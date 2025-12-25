"""
Investment Strategy Coordinator Agent

Orchestrates sub-agents to generate comprehensive investment strategies.
Uses BuiltInPlanner for multi-step reasoning before execution.
"""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool
from google.adk.planners import BuiltInPlanner
from google.genai.types import ThinkingConfig

from .prompts import INVESTMENT_COORDINATOR_PROMPT
from .data_analyst import data_search_agent, data_format_agent
from .visualization_analyst import visualization_agent
from .trading_analyst import trading_analyst_agent
from .execution_analyst import execution_analyst_agent
from .risk_analyst import risk_analyst_agent

MODEL = "gemini-2.5-flash"

# Configure thinking for deeper planning
coordinator_planner = BuiltInPlanner(
    thinking_config=ThinkingConfig(
        include_thoughts=True,
        thinking_budget=16000,  # Higher budget for orchestration decisions
    )
)

investment_coordinator = LlmAgent(
    name="investment_coordinator",
    model=MODEL,
    description=(
        "Guide portfolio managers through a structured process to receive "
        "investment strategy recommendations by orchestrating expert subagents. "
        "Analyze market tickers or sectors, develop trading strategies, define "
        "execution plans, and evaluate overall risk."
    ),
    instruction=INVESTMENT_COORDINATOR_PROMPT,
    planner=coordinator_planner,
    output_key="coordinator_completion_message",
    tools=[
        AgentTool(agent=data_search_agent),
        AgentTool(agent=data_format_agent),
        AgentTool(agent=visualization_agent),
        AgentTool(agent=trading_analyst_agent),
        AgentTool(agent=execution_analyst_agent),
        AgentTool(agent=risk_analyst_agent),
    ],
)

root_agent = investment_coordinator
