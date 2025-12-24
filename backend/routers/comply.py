import time
import tempfile
import json
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.events import Event, EventActions
from google.genai import types

from agents.comply import root_agent
from agents.comply.analyzer_agent import create_policy_analyzer
from agents.comply.aggregator_agent import aggregator_agent
from agents.comply.retriever_agent import get_policies_for_categories, list_policy_files, BASE_PATH as POLICIES_BASE_PATH
from schemas.comply import AnalyzeResponse, ComplianceReport
from database import save_analysis, get_analyses, get_analysis_by_id

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")

router = APIRouter(prefix="/api/v1/comply", tags=["Compliance"])

# Initialize ADK session service
session_service = InMemorySessionService()


@router.post("/analyze-stream")
async def analyze_regulation_stream(file: UploadFile = File(...)):
    """
    Streaming version of analyze endpoint.
    Returns Server-Sent Events with progress updates during analysis.
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file content upfront (can't do async in generator)
    content = await file.read()
    filename = file.filename
    
    async def event_generator():
        start_time = time.time()
        tmp_path = None
        
        def emit(event_type: str, **data):
            """Helper to format SSE events as NDJSON"""
            return json.dumps({"type": event_type, **data}) + "\n"
        
        try:
            # Save temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            
            yield emit("progress", step="upload", message="Document uploaded successfully")
            
            # Create session
            session = await session_service.create_session(
                app_name="finguard",
                user_id="compliance_user"
            )
            
            # STEP 1: Run Router + Retriever
            yield emit("progress", step="categorizing", message="Reading and categorizing regulation...")
            
            pipeline_runner = Runner(
                agent=root_agent,
                app_name="finguard",
                session_service=session_service
            )
            
            with open(tmp_path, "rb") as f:
                pdf_content = f.read()
            
            input_content = types.Content(
                parts=[
                    types.Part.from_bytes(data=pdf_content, mime_type="application/pdf"),
                    types.Part(text=f"Analyze this regulation document (filename: {filename}) for compliance with HDFC Bank policies.")
                ]
            )
            
            async for event in pipeline_runner.run_async(
                user_id="compliance_user",
                session_id=session.id,
                new_message=input_content
            ):
                # Emit agent events for transparency
                if event.author and event.author != "user":
                    if hasattr(event, 'content') and event.content:
                        pass  # Agent is processing
            
            yield emit("progress", step="categorized", message="Regulation categories identified")
            
            # Get categories from session
            current_session = await session_service.get_session(
                app_name="finguard",
                user_id="compliance_user",
                session_id=session.id
            )
            
            categories_data = current_session.state.get('categories_result')
            if not categories_data:
                yield emit("error", message="Could not categorize the regulation document")
                return
            
            if isinstance(categories_data, str):
                categories_info = json.loads(categories_data)
            else:
                categories_info = categories_data
            
            categories = categories_info.get('categories', [])
            
            if not categories:
                yield emit("error", message="No policy categories identified in the regulation")
                return
            
            # STEP 2: Get policies
            yield emit("progress", step="retrieving", message=f"Finding policies for: {', '.join(categories)}")
            
            policies_found = get_policies_for_categories(categories)
            
            if not policies_found:
                yield emit("error", message=f"No bank policies found for categories: {categories}")
                return
            
            yield emit("progress", step="retrieved", message=f"Found {len(policies_found)} policies to analyze")
            
            # Store policies in session
            policies_result_data = {
                "categories_analyzed": categories,
                "policies_found": policies_found,
                "total_policies": len(policies_found)
            }
            
            current_session = await session_service.get_session(
                app_name="finguard",
                user_id="compliance_user",
                session_id=session.id
            )
            state_update_event = Event(
                invocation_id=session.id,
                author="system",
                actions=EventActions(state_delta={"policies_result": policies_result_data})
            )
            await session_service.append_event(session=current_session, event=state_update_event)
            
            # STEP 3: Analyze each policy
            analysis_keys = []
            total_policies = len(policies_found)
            
            for idx, policy in enumerate(policies_found, 1):
                policy_name = policy['file_name']
                policy_path = policy['file_path']
                
                yield emit("progress", step="analyzing", message=f"Analyzing {policy_name}...", current=idx, total=total_policies)
                
                with open(policy_path, "rb") as f:
                    bank_policy_content = f.read()
                
                analyzer = create_policy_analyzer(policy_name)
                analysis_keys.append(analyzer.output_key)
                
                analyzer_runner = Runner(
                    agent=analyzer,
                    app_name="finguard",
                    session_service=session_service
                )
                
                analyzer_input = types.Content(
                    parts=[
                        types.Part.from_bytes(data=pdf_content, mime_type="application/pdf"),
                        types.Part.from_bytes(data=bank_policy_content, mime_type="application/pdf"),
                        types.Part(text=f"""Compare these two documents:
1. FIRST PDF: RBI Regulation - {filename}
2. SECOND PDF: Bank Policy - {policy_name}

Analyze the bank policy against the RBI regulation requirements and identify gaps, compliant items, and action items.""")
                    ]
                )
                
                async for event in analyzer_runner.run_async(
                    user_id="compliance_user",
                    session_id=session.id,
                    new_message=analyzer_input
                ):
                    pass
            
            # STEP 4: Aggregate results
            yield emit("progress", step="aggregating", message="Generating compliance report...")
            
            aggregator_runner = Runner(
                agent=aggregator_agent,
                app_name="finguard",
                session_service=session_service
            )
            
            analysis_keys_str = ", ".join(analysis_keys)
            aggregator_input = types.Content(
                parts=[types.Part(text=f"""Aggregate the analysis results from the session state.

The following session state keys contain the data you need:
- categories_result: Regulation info (title, reference, summary, categories)
- policies_result: List of policies that were analyzed
- Analysis results: {analysis_keys_str}

Read each analysis key and combine all gaps, compliant items, and action items into a single comprehensive compliance report.""")]
            )
            
            async for event in aggregator_runner.run_async(
                user_id="compliance_user",
                session_id=session.id,
                new_message=aggregator_input
            ):
                pass
            
            # Get final result
            final_session = await session_service.get_session(
                app_name="finguard",
                user_id="compliance_user",
                session_id=session.id
            )
            result = final_session.state.get('compliance_report')
            
            if result:
                report = ComplianceReport.model_validate(result)
                processing_time = time.time() - start_time
                
                # Save to database
                analysis_id = str(uuid.uuid4())
                report_json_str = json.dumps(result) if isinstance(result, dict) else result
                save_analysis(
                    analysis_id=analysis_id,
                    filename=filename,
                    regulation_title=report.regulation_info.title,
                    regulation_reference=report.regulation_info.reference,
                    overall_status=report.overall_compliance_status.value,
                    gaps_count=len(report.gaps),
                    action_items_count=len(report.action_items),
                    processing_time=processing_time,
                    report_json=report_json_str
                )
                
                # Emit final result
                yield emit("complete", report=result, processing_time_seconds=processing_time)
            else:
                yield emit("error", message="No compliance report generated")
                
        except Exception as e:
            logger.error(f"[STREAM ERROR] {e}", exc_info=True)
            yield emit("error", message=str(e))
        finally:
            if tmp_path:
                Path(tmp_path).unlink(missing_ok=True)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.get("/categories")
async def list_categories():
    """List available policy categories."""
    return {
        "categories": [
            {"id": "kyc", "name": "KYC (Know Your Customer)", "policy_count": 0},
            {"id": "lending", "name": "Retail & Corporate Lending", "policy_count": 0},
            {"id": "payments", "name": "Payments & UPI", "policy_count": 0},
            {"id": "cybersecurity", "name": "Cyber Security", "policy_count": 0},
            {"id": "consumer_protection", "name": "Consumer Protection", "policy_count": 0},
        ]
    }


@router.get("/history")
async def get_analysis_history(limit: int = 10):
    """Get history of previous compliance analyses."""
    analyses = get_analyses(limit)
    return {"analyses": analyses}


@router.get("/history/{analysis_id}")
async def get_single_analysis(analysis_id: str):
    """Get a single analysis by ID, including full report."""
    analysis = get_analysis_by_id(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


@router.get("/policies")
async def list_all_policies():
    """List all bank policies organized by category."""
    categories = ["kyc", "lending", "payments", "cybersecurity", "consumer_protection"]
    result = {}
    
    for category in categories:
        policies = list_policy_files(category)
        result[category] = {
            "name": {
                "kyc": "KYC (Know Your Customer)",
                "lending": "Retail & Corporate Lending",
                "payments": "Payments & UPI",
                "cybersecurity": "Cyber Security",
                "consumer_protection": "Consumer Protection"
            }.get(category, category),
            "policies": [
                {
                    "file_name": p["file_name"],
                    "file_size": Path(p["file_path"]).stat().st_size if Path(p["file_path"]).exists() else 0
                }
                for p in policies
            ]
        }
    
    return result


@router.post("/policies/{category}")
async def upload_policy(category: str, file: UploadFile = File(...)):
    """Upload a new policy PDF to a category."""
    valid_categories = ["kyc", "lending", "payments", "cybersecurity", "consumer_protection"]
    
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    category_path = POLICIES_BASE_PATH / category
    category_path.mkdir(parents=True, exist_ok=True)
    
    file_path = category_path / file.filename
    
    if file_path.exists():
        raise HTTPException(status_code=400, detail=f"Policy '{file.filename}' already exists in {category}")
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    logger.info(f"[POLICY] Uploaded {file.filename} to {category}")
    
    return {
        "success": True,
        "message": f"Policy '{file.filename}' uploaded to {category}",
        "file_name": file.filename,
        "category": category
    }


@router.delete("/policies/{category}/{filename}")
async def delete_policy(category: str, filename: str):
    """Delete a policy from a category."""
    valid_categories = ["kyc", "lending", "payments", "cybersecurity", "consumer_protection"]
    
    if category not in valid_categories:
        raise HTTPException(status_code=400, detail=f"Invalid category. Must be one of: {valid_categories}")
    
    file_path = POLICIES_BASE_PATH / category / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"Policy '{filename}' not found in {category}")
    
    file_path.unlink()
    logger.info(f"[POLICY] Deleted {filename} from {category}")
    
    return {
        "success": True,
        "message": f"Policy '{filename}' deleted from {category}"
    }
