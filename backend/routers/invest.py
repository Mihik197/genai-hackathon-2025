"""Investment Strategy API Router - Streaming endpoint for strategy generation"""

import time
import json
import uuid
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, Literal

from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agents.invest import root_agent
from database import (
    save_investment_strategy,
    get_investment_strategies,
    get_investment_strategy_by_id
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/invest", tags=["Investment Strategy"])

session_service = InMemorySessionService()


class StrategyRequest(BaseModel):
    ticker_or_sector: str
    risk_tolerance: Literal["conservative", "moderate", "aggressive"]
    investment_horizon: Literal["short", "medium", "long"]
    focus_areas: Optional[str] = None


@router.post("/generate")
async def generate_strategy(request: StrategyRequest):
    """
    Streaming endpoint for investment strategy generation.
    Returns Server-Sent Events with progress updates as each agent runs.
    """
    async def event_generator():
        start_time = time.time()
        strategy_id = str(uuid.uuid4())
        
        def emit(event_type: str, **data):
            return json.dumps({"type": event_type, **data}) + "\n"
        
        try:
            yield emit("progress", step="starting", message="Initializing strategy generation...")
            
            session = await session_service.create_session(
                app_name="finguard_invest",
                user_id="invest_user"
            )
            
            yield emit("progress", step="data_analyst", status="running", 
                      message="Searching for market data and news...")
            
            runner = Runner(
                agent=root_agent,
                app_name="finguard_invest",
                session_service=session_service
            )
            
            horizon_text = {
                "short": "short-term (less than 1 year)",
                "medium": "medium-term (1-3 years)",
                "long": "long-term (3+ years)"
            }
            
            focus_text = f"\nAdditional focus: {request.focus_areas}" if request.focus_areas else ""
            
            
            input_message = f"""Generate an investment strategy with the following parameters:

Ticker/Sector: {request.ticker_or_sector}
Risk Tolerance: {request.risk_tolerance}
Investment Horizon: {horizon_text[request.investment_horizon]}
Focusing on Aspect (if any, else none): {focus_text}

Please proceed through all 5 steps:
1. Gather raw market data (data_search_agent)
2. Format data into JSON (data_format_agent)
3. Develop 3-5 trading strategies (trading_analyst)
4. Create detailed execution plan (execution_analyst)
5. Evaluate overall risk (risk_analyst)

Confirm when done."""

            input_content = types.Content(
                parts=[types.Part(text=input_message)]
            )
            
            current_step = "data_search_agent"
            step_order = ["data_search_agent", "data_format_agent", "visualization_agent", "trading_analyst", "execution_analyst", "risk_analyst"]
            step_messages = {
                "data_search_agent": "Searching for market data and news...",
                "data_format_agent": "Structuring and analyzing market data...",
                "visualization_agent": "Generating data visualizations...",
                "trading_analyst": "Generating trading strategies...",
                "execution_analyst": "Creating execution plan...",
                "risk_analyst": "Evaluating risk profile..."
            }
            
            final_output = None
            
            # Emit initial running state for the first step
            yield emit("progress", step=current_step, status="running",
                      message=step_messages[current_step], 
                      current=1, total=6)
            
            async for event in runner.run_async(
                user_id="invest_user",
                session_id=session.id,
                new_message=input_content
            ):
                if event.author and event.author != "user":
                    agent_name = event.author.lower()
                    
                    for step in step_order:
                        if step in agent_name and step != current_step:
                            yield emit("progress", step=current_step, status="complete",
                                      message=f"{step_messages[current_step]} Done")
                            current_step = step
                            step_idx = step_order.index(step) + 1
                            yield emit("progress", step=step, status="running",
                                      message=step_messages[step], 
                                      current=step_idx, total=6)
                            break
                    
                    if hasattr(event, 'content') and event.content:
                        for part in event.content.parts:
                            if hasattr(part, 'text') and part.text:
                                final_output = part.text
            
            yield emit("progress", step=current_step, status="complete",
                      message=f"{step_messages.get(current_step, 'Processing')} Done")
            
            final_session = await session_service.get_session(
                app_name="finguard_invest",
                user_id="invest_user",
                session_id=session.id
            )
            
            state = final_session.state if final_session else {}
            
            market_analysis = state.get("market_data_analysis_output", {})
            visualization_output = state.get("visualization_output", {})
            trading_strategies = state.get("proposed_trading_strategies_output", {})
            execution_plan = state.get("execution_plan_output", {})
            risk_assessment = state.get("final_risk_assessment_output", {})
            investment_strategy = state.get("investment_strategy_output", {})
            
            processing_time = time.time() - start_time
            
            if investment_strategy:
                strategy_output = investment_strategy
                if isinstance(strategy_output, str):
                    try:
                        strategy_output = json.loads(strategy_output)
                    except json.JSONDecodeError:
                        pass
                strategy_output["id"] = strategy_id
                strategy_output["processing_time"] = processing_time
            else:
                strategy_output = {
                    "id": strategy_id,
                    "strategy_name": f"{request.ticker_or_sector} {request.risk_tolerance.title()} Strategy",
                    "ticker_or_sector": request.ticker_or_sector,
                    "risk_tolerance": request.risk_tolerance,
                    "investment_horizon": request.investment_horizon,
                    "market_analysis": market_analysis if isinstance(market_analysis, dict) else {},
                    "visualization_output": visualization_output if isinstance(visualization_output, dict) else {},
                    "trading_strategies": trading_strategies if isinstance(trading_strategies, dict) else {},
                    "execution_plan": execution_plan if isinstance(execution_plan, dict) else {},
                    "risk_assessment": risk_assessment if isinstance(risk_assessment, dict) else {},
                    "processing_time": processing_time,
                    "disclaimer": (
                        "This information is for educational and informational purposes only. "
                        "It does not constitute financial advice or investment recommendations. "
                        "Consult a qualified financial advisor before making investment decisions."
                    )
                }
            
            try:
                save_investment_strategy(
                    strategy_id=strategy_id,
                    ticker_or_sector=request.ticker_or_sector,
                    risk_tolerance=request.risk_tolerance,
                    investment_horizon=request.investment_horizon,
                    focus_areas=request.focus_areas,
                    strategy_name=strategy_output["strategy_name"],
                    strategy_json=json.dumps(strategy_output),
                    processing_time=processing_time
                )
            except Exception as save_error:
                logger.warning(f"Failed to save strategy to database: {save_error}")
            
            yield emit("complete", strategy=strategy_output, processing_time=processing_time)
            
        except Exception as e:
            logger.exception("Error generating investment strategy")
            yield emit("error", message=str(e))
    
    return StreamingResponse(
        event_generator(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )


@router.get("/history")
async def get_strategy_history(limit: int = 10):
    """Get history of generated strategies"""
    strategies = get_investment_strategies(limit=limit)
    return {"strategies": strategies}


@router.get("/history/{strategy_id}")
async def get_strategy_detail(strategy_id: str):
    """Get full details of a specific strategy"""
    strategy = get_investment_strategy_by_id(strategy_id)
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    return strategy
