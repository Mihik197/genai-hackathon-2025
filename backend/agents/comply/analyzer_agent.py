import re
from google.adk.agents import LlmAgent
from schemas.agent_outputs import SinglePolicyAnalysis


def sanitize_name(name: str) -> str:
    """Sanitize a name to be a valid Python identifier for ADK agent names."""
    # Remove .pdf extension
    name = name.replace('.pdf', '')
    # Replace spaces and invalid chars with underscores
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    # Ensure it starts with a letter or underscore
    if name and name[0].isdigit():
        name = '_' + name
    return name


def create_policy_analyzer(policy_name: str) -> LlmAgent:
    """
    Creates an analyzer agent instance for a specific bank policy.
    
    This agent compares ONE bank policy PDF against the RBI regulation PDF
    and identifies gaps, compliant items, and required actions.
    
    Args:
        policy_name: Name of the bank policy file being analyzed
        
    Returns:
        LlmAgent configured to analyze the specific policy
    """
    safe_name = sanitize_name(policy_name)
    
    return LlmAgent(
        name=f"AnalyzerAgent_{safe_name}",
        model="gemini-3-flash",
        description=f"Analyzes {policy_name} against RBI regulation for compliance gaps.",
        instruction=f"""You are a compliance analyst for HDFC Bank.

Your task: Compare the RBI regulation against bank policy "{policy_name}" and identify ONLY:
1. GAPS - Where the policy doesn't meet RBI requirements
2. ACTION_ITEMS - Specific changes needed

You are provided with TWO PDF documents:
1. FIRST PDF: RBI regulation/circular
2. SECOND PDF: Bank policy "{policy_name}"

For each GAP (keep concise):
- id: GAP-001, GAP-002, etc.
- requirement: Brief RBI requirement statement
- current_state: Current policy state or "Not addressed"
- affected_section: Policy section needing update (if known)
- action_required: What needs to change
- priority: HIGH/MEDIUM/LOW
- deadline_recommended: e.g., "30 days", "90 days"

For each ACTION_ITEM:
- id: ACTION-001, ACTION-002, etc.
- description: What needs to be done (1-2 sentences)
- owner_team: Compliance, IT, Legal, Operations, etc.
- priority: HIGH/MEDIUM/LOW
- estimated_effort: Low/Medium/High
- related_gap_ids: Which gaps this addresses

Set compliance_status: COMPLIANT (no gaps), PARTIALLY_COMPLIANT (some gaps), NON_COMPLIANT (critical gaps)
Set risk_level: LOW, MEDIUM, or HIGH

DO NOT include compliant items - only output gaps and actions needed.
Be concise. Keep descriptions short.
""",
        output_schema=SinglePolicyAnalysis,
        output_key=f"analysis_{safe_name}",
    )
