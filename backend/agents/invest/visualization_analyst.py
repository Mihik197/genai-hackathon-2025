"""Visualization Analyst Agent

Decides what visualizations to create based on market analysis data.
"""

from google.adk import Agent

from schemas.invest import VisualizationOutput
from .prompts import VISUALIZATION_PROMPT

MODEL = "gemini-2.5-flash"

# Note: planner cannot be used with output_schema per ADK limitations
visualization_agent = Agent(
    model=MODEL,
    name="visualization_agent",
    description="Analyzes market data and generates chart specifications for the frontend",
    instruction=VISUALIZATION_PROMPT,
    output_schema=VisualizationOutput,
    output_key="visualization_output",
)

