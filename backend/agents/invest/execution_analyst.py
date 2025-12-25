"""Execution Analyst Agent - Creates detailed execution plans for strategies
"""

from google.adk import Agent

from schemas.invest import ExecutionPlanOutput
from .prompts import EXECUTION_ANALYST_PROMPT

MODEL = "gemini-2.5-flash"

# Note: planner cannot be used with output_schema per ADK limitations
execution_analyst_agent = Agent(
    model=MODEL,
    name="execution_analyst",
    description="Creates detailed execution plans for trading strategies",
    instruction=EXECUTION_ANALYST_PROMPT,
    output_schema=ExecutionPlanOutput,
    output_key="execution_plan_output",
)

