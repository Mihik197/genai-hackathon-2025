"""Data Analyst Agents - Search and Formatting
1. DataSearchAgent: Uses Google Search to gather info (No Schema, has Tools)
2. DataFormatAgent: Formats the info into structured JSON (Has Schema, No Tools)
"""

from google.adk import Agent
from google.adk.tools import google_search

from schemas.invest import MarketDataAnalysisOutput
from .prompts import DATA_ANALYST_PROMPT, DATA_FORMATTER_PROMPT

MODEL = "gemini-2.5-flash"

# 1. Search Agent (Tools enabled, No Schema)
data_search_agent = Agent(
    model=MODEL,
    name="data_search_agent",
    description="Gathers market data, news, and analysis using Google Search",
    instruction=DATA_ANALYST_PROMPT,
    output_key="market_data_analysis_raw", # Store raw search results here
    tools=[google_search],
)

# 2. Formatting Agent (No Tools, Schema enabled)
data_format_agent = Agent(
    model=MODEL,
    name="data_format_agent",
    description="Formats raw market data into structured JSON",
    instruction=DATA_FORMATTER_PROMPT,
    output_schema=MarketDataAnalysisOutput,
    output_key="market_data_analysis_output", # Store structured data here
)
