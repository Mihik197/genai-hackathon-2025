"""Data Analyst Agents - Search and Formatting

1. DataSearchAgent: Uses Google Search + yfinance tools to gather comprehensive data
2. DataFormatAgent: Formats the info into structured JSON
"""

from google.adk import Agent
from google.adk.tools import google_search
from google.adk.planners import BuiltInPlanner
from google.genai.types import ThinkingConfig

from schemas.invest import MarketDataAnalysisOutput
from tools.yfinance_tools import (
    get_stock_quote,
    get_stock_fundamentals,
    get_price_history,
    get_analyst_ratings,
)
from .prompts import DATA_ANALYST_PROMPT, DATA_FORMATTER_PROMPT

MODEL = "gemini-3-flash"

# Only data_search_agent uses planner (it has tools, no output_schema)
search_planner = BuiltInPlanner(
    thinking_config=ThinkingConfig(
        include_thoughts=True,
        thinking_budget=16000,
    )
)

data_search_agent = Agent(
    model=MODEL,
    name="data_search_agent",
    description="Gathers market data using yfinance tools and news using Google Search",
    instruction=DATA_ANALYST_PROMPT,
    planner=search_planner,
    output_key="market_data_analysis_raw",
    tools=[
        get_stock_quote,
        get_stock_fundamentals, 
        get_price_history,
        get_analyst_ratings,
        google_search,
    ],
)

# Note: planner cannot be used with output_schema per ADK limitations
data_format_agent = Agent(
    model=MODEL,
    name="data_format_agent",
    description="Formats raw market data into structured JSON",
    instruction=DATA_FORMATTER_PROMPT,
    output_schema=MarketDataAnalysisOutput,
    output_key="market_data_analysis_output",
)

