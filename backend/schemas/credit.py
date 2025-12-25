from pydantic import BaseModel
from typing import Optional
from enum import Enum


class RiskBand(str, Enum):
    LOW = "Low"
    MODERATE = "Moderate"
    HIGH = "High"


class CreditApplicant(BaseModel):
    user_id: str
    age: int
    occupation: str
    monthly_income: float
    transaction_count_30d: int
    avg_transaction_amount: float
    location_risk_score: float
    device_change_frequency: int
    previous_fraud_flag: int
    account_age_months: int
    chargeback_count: int


class RuleScoring(BaseModel):
    base_score: int
    final_rule_score: int


class MLScoring(BaseModel):
    high_risk_probability: float
    ml_score: int
    model_auc: Optional[float] = None


class CreditDecision(BaseModel):
    final_credit_score: int
    risk_band: RiskBand
    reason_codes: list[str]


class CreditAssessmentResult(BaseModel):
    assessment_id: str
    timestamp: str
    applicant: CreditApplicant
    rule_scoring: RuleScoring
    ml_scoring: MLScoring
    decision: CreditDecision
    processing_time_ms: float


class CreditAssessmentHistoryItem(BaseModel):
    id: str
    assessment_id: str
    user_id: str
    age: int
    occupation: str
    monthly_income: float
    final_score: int
    risk_band: str
    processing_time_ms: float
    created_at: str


class CreditStats(BaseModel):
    total_assessments: int
    low_risk_count: int
    moderate_risk_count: int
    high_risk_count: int
    avg_score: float
    avg_processing_time_ms: float
