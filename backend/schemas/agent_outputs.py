from pydantic import BaseModel, Field
from typing import Optional


# Router Agent Output Schema
class RouterOutput(BaseModel):
    """Output from Router Agent: categorizes the RBI regulation"""
    regulation_title: str = Field(description="Title of the RBI regulation")
    regulation_reference: Optional[str] = Field(
        default=None,
        description="RBI circular number (e.g., RBI/2024-25/128)"
    )
    categories: list[str] = Field(
        description="List of affected policy categories"
    )
    summary: str = Field(
        description="2-3 sentence summary of regulation requirements"
    )
    effective_date: Optional[str] = Field(
        default=None,
        description="Effective date of regulation if mentioned"
    )


# Retriever Agent Output Schema
class PolicyFile(BaseModel):
    """Information about a bank policy file"""
    file_name: str = Field(description="Name of the policy PDF file")
    file_path: str = Field(description="Absolute path to the PDF file")
    category: str = Field(description="Policy category (kyc, lending, etc.)")


class RetrieverOutput(BaseModel):
    """Output from Retriever Agent: lists relevant bank policies"""
    categories_analyzed: list[str] = Field(
        description="Categories that were searched"
    )
    policies_found: list[PolicyFile] = Field(
        description="List of bank policy files found"
    )
    total_policies: int = Field(
        description="Total number of policies found"
    )


# Analyzer Agent Output Schema (per individual policy analysis)
class Gap(BaseModel):
    """A compliance gap identified between RBI regulation and bank policy"""
    id: str = Field(description="Unique gap identifier (e.g., GAP-001)")
    requirement: str = Field(description="Specific RBI requirement")
    current_state: str = Field(
        description="Current state in bank policy or 'Not addressed'"
    )
    affected_section: Optional[str] = Field(
        default=None,
        description="Section in bank policy that needs update"
    )
    action_required: str = Field(
        description="Recommended action to achieve compliance"
    )
    priority: str = Field(
        description="Priority level: HIGH, MEDIUM, or LOW"
    )
    deadline_recommended: Optional[str] = Field(
        default=None,
        description="Recommended deadline (e.g., '30 days', '90 days')"
    )



class ActionItem(BaseModel):
    """Actionable task to achieve compliance"""
    id: str = Field(description="Unique action identifier (e.g., ACTION-001)")
    description: str = Field(description="What needs to be done")
    owner_team: str = Field(
        description="Team responsible (e.g., Compliance, IT, Legal)"
    )
    priority: str = Field(description="Priority: HIGH, MEDIUM, or LOW")
    estimated_effort: str = Field(
        description="Estimated effort (e.g., Low, Medium, High)"
    )
    related_gap_ids: list[str] = Field(
        default_factory=list,
        description="Gap IDs this action addresses"
    )


class SinglePolicyAnalysis(BaseModel):
    """Analysis result for one bank policy vs RBI regulation"""
    bank_policy_name: str = Field(
        description="Name of the bank policy PDF analyzed"
    )
    gaps: list[Gap] = Field(
        default_factory=list,
        description="Gaps found in this policy"
    )
    action_items: list[ActionItem] = Field(
        default_factory=list,
        description="Actions needed for this policy"
    )
    compliance_status: str = Field(
        description="COMPLIANT, PARTIALLY_COMPLIANT, or NON_COMPLIANT"
    )
    risk_level: str = Field(
        description="Risk assessment: LOW, MEDIUM, or HIGH"
    )
