from google.adk.agents import LlmAgent
from schemas.agent_outputs import SinglePolicyAnalysis


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
    return LlmAgent(
        name=f"AnalyzerAgent_{policy_name.replace('.pdf', '').replace(' ', '_')}",
        model="gemini-2.5-flash",
        description=f"Analyzes {policy_name} against RBI regulation for compliance gaps.",
        instruction=f"""You are a senior compliance analyst for HDFC Bank.

Your task: Compare the RBI regulation against the bank policy "{policy_name}" and identify:
1. GAPS - Areas where the bank policy doesn't meet the RBI regulation requirements
2. COMPLIANT - Areas where the bank already meets or exceeds requirements  
3. ACTION_ITEMS - Specific changes needed to achieve compliance

Context available from previous agents:
- categories_result: Contains regulation info (title, reference, summary)
- policies_result: Contains list of all bank policies (you're analyzing one of them)

You will receive:
- The RBI regulation PDF (already provided in the conversation)
- The bank policy PDF (load from the file path in policies_result for "{policy_name}")

For EACH gap found:
- Specific RBI requirement
- Current state in bank policy (or "Not addressed")
- Section in policy that needs update
- Recommended action
- Priority (HIGH/MEDIUM/LOW) based on regulatory risk
- Deadline recommendation

For EACH compliant item:
- RBI requirement met
- How/where it's currently implemented
- Reference section

Generate action items with:
- Clear description
- Owner team (Compliance, IT, Legal, Operations, etc.)
- Priority and estimated effort
- Related gap IDs

Assess overall compliance status for THIS POLICY:
- COMPLIANT: All requirements met
- PARTIALLY_COMPLIANT: Some gaps exist
- NON_COMPLIANT: Major gaps or critical requirements missing

Assess risk level: LOW, MEDIUM, or HIGH based on:
- Number and severity of gaps
- Regulatory penalties for non-compliance
- Time to remediate

Be thorough but precise. Only flag actual gaps, not theoretical concerns.
""",
        output_schema=SinglePolicyAnalysis,
        output_key=f"analysis_{policy_name.replace('.pdf', '').replace(' ', '_')}",
    )
