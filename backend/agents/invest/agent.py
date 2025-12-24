"""
Investment Strategy Coordinator Agent

Orchestrates sub-agents to generate comprehensive investment strategies.
Does NOT enforce output_schema itself because it uses tools (AgentTool).
Final structured output is composed from sub-agent 
structured outputs stored in session state.
"""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool

# output_schema NOT used here because lists of tools are incompatible with structured output enforcement
from .prompts import INVESTMENT_COORDINATOR_PROMPT
from .data_analyst import data_search_agent, data_format_agent
from .trading_analyst import trading_analyst_agent
from .execution_analyst import execution_analyst_agent
from .risk_analyst import risk_analyst_agent

MODEL = "gemini-2.5-flash"

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
    # output_schema removed to allow tool usage
    output_key="coordinator_completion_message",
    tools=[
        AgentTool(agent=data_search_agent),
        AgentTool(agent=data_format_agent),
        AgentTool(agent=trading_analyst_agent),
        AgentTool(agent=execution_analyst_agent),
        AgentTool(agent=risk_analyst_agent),
    ],
)

root_agent = investment_coordinator
