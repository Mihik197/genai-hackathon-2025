"""Risk Analyst Agent - Evaluates overall risk of the investment plan
"""

from google.adk import Agent

from schemas.invest import RiskAssessmentOutput
from .prompts import RISK_ANALYST_PROMPT

MODEL = "gemini-3-flash"

# Note: planner cannot be used with output_schema per ADK limitations
risk_analyst_agent = Agent(
    model=MODEL,
    name="risk_analyst",
    description="Evaluates overall risk and alignment with user profile",
    instruction=RISK_ANALYST_PROMPT,
    output_schema=RiskAssessmentOutput,
    output_key="final_risk_assessment_output",
)

