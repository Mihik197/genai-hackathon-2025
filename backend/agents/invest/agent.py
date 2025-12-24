"""
Investment Strategy Coordinator Agent

Orchestrates 4 sub-agents to generate comprehensive investment strategies:
1. Data Analyst - Gathers market data via Google Search
2. Trading Analyst - Develops trading strategies
3. Execution Analyst - Creates execution plans
4. Risk Analyst - Evaluates overall risk
"""

from google.adk.agents import LlmAgent
from google.adk.tools.agent_tool import AgentTool

from schemas.invest import InvestmentStrategyOutput
from .prompts import INVESTMENT_COORDINATOR_PROMPT
from .data_analyst import data_analyst_agent
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
    output_schema=InvestmentStrategyOutput,
    output_key="investment_strategy_output",
    tools=[
        AgentTool(agent=data_analyst_agent),
        AgentTool(agent=trading_analyst_agent),
        AgentTool(agent=execution_analyst_agent),
        AgentTool(agent=risk_analyst_agent),
    ],
)

root_agent = investment_coordinator
