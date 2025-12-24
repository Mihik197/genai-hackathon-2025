"""Data Analyst Agent - Uses Google Search to gather market intelligence"""

from google.adk import Agent
from google.adk.tools import google_search

from schemas.invest import MarketDataAnalysisOutput
from .prompts import DATA_ANALYST_PROMPT

MODEL = "gemini-2.5-flash"

data_analyst_agent = Agent(
    model=MODEL,
    name="data_analyst",
    description="Gathers market data, news, and analysis using Google Search",
    instruction=DATA_ANALYST_PROMPT,
    output_schema=MarketDataAnalysisOutput,
    output_key="market_data_analysis_output",
    tools=[google_search],
)
