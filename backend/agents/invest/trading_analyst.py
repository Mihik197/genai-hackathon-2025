"""Trading Analyst Agent - Develops trading strategies based on market analysis
"""

from google.adk import Agent

from schemas.invest import TradingStrategiesOutput
from .prompts import TRADING_ANALYST_PROMPT

MODEL = "gemini-3-flash"

# Note: planner cannot be used with output_schema per ADK limitations
trading_analyst_agent = Agent(
    model=MODEL,
    name="trading_analyst",
    description="Develops trading strategies based on market analysis and user profile",
    instruction=TRADING_ANALYST_PROMPT,
    output_schema=TradingStrategiesOutput,
    output_key="proposed_trading_strategies_output",
)

