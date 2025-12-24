"""Risk Analyst Agent - Evaluates overall risk of the investment plan

Note: Uses output_schema for structured JSON output.
Receives all prior analysis from state.
"""

from google.adk import Agent

from schemas.invest import RiskAssessmentOutput
from .prompts import RISK_ANALYST_PROMPT

MODEL = "gemini-2.5-flash"

risk_analyst_agent = Agent(
    model=MODEL,
    name="risk_analyst",
    instruction=RISK_ANALYST_PROMPT,
    output_schema=RiskAssessmentOutput,
    output_key="final_risk_assessment_output",
)
