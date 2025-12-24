import time
import tempfile
import json
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.agents import ParallelAgent
from google.genai import types

from agents.comply import root_agent
from agents.comply.analyzer_agent import create_policy_analyzer
from agents.comply.aggregator_agent import aggregator_agent
from schemas.comply import AnalyzeResponse, ComplianceReport

router = APIRouter(prefix="/api/v1/comply", tags=["Compliance"])

# Initialize ADK session service
session_service = InMemorySessionService()


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_regulation(file: UploadFile = File(...)):
    """
    Upload an RBI regulation PDF and analyze it against HDFC Bank policies.
    
    Flow:
    1. Router categorizes regulation
    2. Retriever fetches relevant bank policies
    3. Create one analyzer per policy, run in parallel
    4. Aggregator combines results into final report
    
    Returns a compliance report with gaps, compliant items, and action items.
    """
    start_time = time.time()
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    tmp_path = None
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Create a new session for this analysis
        session = await session_service.create_session(
            app_name="finguard",
            user_id="compliance_user"
        )
        
        # STEP 1 & 2: Run Router + Retriever pipeline
        pipeline_runner = Runner(
            agent=root_agent,
            app_name="finguard",
            session_service=session_service
        )
        
        # Read the PDF file and create content for the agent
        with open(tmp_path, "rb") as f:
            pdf_content = f.read()
        
        # Create the input message with the PDF as a file part
        # Gemini 2.5 Flash can process PDFs natively with 1M token context
        input_content = types.Content(
            parts=[
                types.Part.from_bytes(data=pdf_content, mime_type="application/pdf"),
                types.Part.from_text(
                    f"Analyze this RBI regulation document (filename: {file.filename}) "
                    "for compliance with HDFC Bank policies."
                )
            ]
        )
        
        # Run the router + retriever pipeline
        async for event in pipeline_runner.run_async(
            user_id="compliance_user",
            session_id=session.id,
            new_message=input_content
        ):
            pass  # Let it complete
        
        # Get the current session to access state
        current_session = await session_service.get_session(
            app_name="finguard",
            user_id="compliance_user",
            session_id=session.id
        )
        
        # STEP 3: Parse policies_result to create parallel analyzers
        policies_data = current_session.state.get('policies_result')
        if isinstance(policies_data, str):
            policies_info = json.loads(policies_data)
        else:
            policies_info = policies_data
            
        policies_found = policies_info.get('policies_found', [])
        
        if not policies_found:
            return AnalyzeResponse(
                success=False,
                error="No bank policies found for the identified categories",
                processing_time_seconds=time.time() - start_time
            )
        
        # Create one analyzer agent per policy
        analyzer_agents = []
        for policy in policies_found:
            policy_name = policy['file_name']
            analyzer = create_policy_analyzer(policy_name)
            analyzer_agents.append(analyzer)
        
        # Run analyzers in parallel
        if len(analyzer_agents) > 1:
            parallel_analyzer = ParallelAgent(
                name="ParallelPolicyAnalyzers",
                sub_agents=analyzer_agents
            )
            analyzer_runner = Runner(
                agent=parallel_analyzer,
                app_name="finguard",
                session_service=session_service
            )
        else:
            # Just one policy
            analyzer_runner = Runner(
                agent=analyzer_agents[0],
                app_name="finguard",
                session_service=session_service
            )
        
        # Run the analyzers (they'll read from session state)
        async for event in analyzer_runner.run_async(
            user_id="compliance_user",
            session_id=session.id,
            new_message=types.Content(parts=[types.Part.from_text("Analyze the policies.")])
        ):
            pass
        
        # STEP 4: Run aggregator to combine results
        aggregator_runner = Runner(
            agent=aggregator_agent,
            app_name="finguard",
            session_service=session_service
        )
        
        result = None
        async for event in aggregator_runner.run_async(
            user_id="compliance_user",
            session_id=session.id,
            new_message=types.Content(parts=[types.Part.from_text("Aggregate the analysis results.")])
        ):
            # Capture the final compliance report from state
            if hasattr(event, 'state') and 'compliance_report' in event.state:
                result = event.state['compliance_report']
        
        # Parse the result into our schema
        if result:
            report = ComplianceReport.model_validate_json(result)
            return AnalyzeResponse(
                success=True,
                report=report,
                processing_time_seconds=time.time() - start_time
            )
        else:
            return AnalyzeResponse(
                success=False,
                error="No compliance report generated",
                processing_time_seconds=time.time() - start_time
            )
            
    except Exception as e:
        return AnalyzeResponse(
            success=False,
            error=str(e),
            processing_time_seconds=time.time() - start_time
        )
    finally:
        # Cleanup temp file
        if tmp_path:
            Path(tmp_path).unlink(missing_ok=True)


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
async def get_analysis_history():
    """Get history of previous compliance analyses."""
    # TODO: Implement with database
    return {
        "analyses": []
    }
