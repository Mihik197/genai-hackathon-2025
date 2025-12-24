"""Execution Analyst Agent - Creates detailed execution plans for strategies

This agent has no tools, so it CAN have output_schema.
"""

from google.adk.agents import LlmAgent

from schemas.invest import ExecutionPlanOutput
from .prompts import EXECUTION_ANALYST_PROMPT

MODEL = "gemini-2.5-flash"

execution_analyst_agent = LlmAgent(
    model=MODEL,
    name="execution_analyst",
    description="Creates detailed execution plans for trading strategies",
    instruction=EXECUTION_ANALYST_PROMPT,
    output_schema=ExecutionPlanOutput,
    output_key="execution_plan_output",
)
