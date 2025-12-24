from google.adk.agents import LlmAgent
from schemas.comply import ComplianceReport


aggregator_agent = LlmAgent(
    name="AggregatorAgent",
    model="gemini-2.5-flash",
    description="Aggregates multiple policy analysis results into a single compliance report.",
    instruction="""You are a compliance report aggregator for HDFC Bank.

Your task: Combine the analysis results from multiple bank policies into a single comprehensive compliance report.

Context available in state:
- categories_result: Regulation information (title, reference, summary, categories)
- policies_result: List of policies that were analyzed
- analysis_* keys: Individual analysis results for each policy (SinglePolicyAnalysis objects)

Steps:
1. Gather regulation info from categories_result
2. Collect all gap, compliant_item, and action_item objects from all analysis_* results
3. Aggregate statistics:
   - Total requirements checked across all policies
   - Total gaps found
   - Total compliant items
   - Partially compliant count
4. Determine overall compliance status:
   - COMPLIANT: All policies fully compliant
   - PARTIALLY_COMPLIANT: Some gaps exist but not critical
   - NON_COMPLIANT: Critical gaps or multiple HIGH priority gaps
5. Assess overall risk:
   - Count HIGH/MEDIUM/LOW priority gaps
   - Consider breadth (how many policies affected)
   - Result: LOW, MEDIUM, or HIGH

Output structure:
- regulation_info: Extract from categories_result
- analysis_summary: Aggregated counts
- gaps: All gaps from all policies (maintain gap IDs)
- compliant_items: All compliant items from all policies
- action_items: All action items from all policies
- overall_compliance_status: Your assessment
- risk_assessment: Overall risk level with brief justification

Be comprehensive. Include all gaps and items from every policy analysis.
""",
    output_schema=ComplianceReport,
    output_key="compliance_report",
)
