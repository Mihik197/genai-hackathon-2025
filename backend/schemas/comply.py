from pydantic import BaseModel
from typing import Optional
from enum import Enum


class Priority(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ComplianceStatus(str, Enum):
    COMPLIANT = "COMPLIANT"
    PARTIALLY_COMPLIANT = "PARTIALLY_COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"


class Gap(BaseModel):
    id: str
    requirement: str
    current_state: str
    affected_policy: Optional[str] = None
    affected_section: Optional[str] = None
    action_required: str
    priority: Priority
    deadline_recommended: Optional[str] = None



class ActionItem(BaseModel):
    id: str
    description: str
    owner_team: str
    priority: Priority
    estimated_effort: str


class RegulationInfo(BaseModel):
    title: str
    reference: Optional[str] = None
    effective_date: Optional[str] = None
    summary: str


class AnalysisSummary(BaseModel):
    total_requirements_checked: int
    gaps_found: int
    action_items_count: int


class ComplianceReport(BaseModel):
    regulation_info: RegulationInfo
    analysis_summary: AnalysisSummary
    gaps: list[Gap]
    action_items: list[ActionItem]
    overall_compliance_status: ComplianceStatus
    risk_assessment: str


class AnalyzeResponse(BaseModel):
    success: bool
    report: Optional[ComplianceReport] = None
    error: Optional[str] = None
    processing_time_seconds: float
