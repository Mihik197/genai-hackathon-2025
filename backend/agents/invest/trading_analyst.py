"""Trading Analyst Agent - Develops trading strategies based on market analysis"""

from google.adk import Agent

from schemas.invest import TradingStrategiesOutput
from .prompts import TRADING_ANALYST_PROMPT

MODEL = "gemini-2.5-flash"

trading_analyst_agent = Agent(
    model=MODEL,
    name="trading_analyst",
    instruction=TRADING_ANALYST_PROMPT,
    output_schema=TradingStrategiesOutput,
    output_key="proposed_trading_strategies_output",
)
