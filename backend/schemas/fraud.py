from pydantic import BaseModel
from typing import Optional
from enum import Enum


class Verdict(str, Enum):
    SAFE = "SAFE"
    SUSPICIOUS = "SUSPICIOUS"
    HIGH_RISK = "HIGH_RISK"


class RecommendedAction(str, Enum):
    APPROVE = "APPROVE"
    FLAG_FOR_REVIEW = "FLAG_FOR_REVIEW"
    BLOCK = "BLOCK"


class SourceAccount(BaseModel):
    account_id: str
    account_number: Optional[str] = None
    ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    account_age_days: int
    avg_monthly_balance: float
    total_transactions_30d: int
    avg_transaction_amount: float
    location: str
    kyc_status: str


class Destination(BaseModel):
    account_id: str
    account_number: Optional[str] = None
    ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    name: str
    is_known_beneficiary: bool
    relationship: str
    location: str
    merchant_category_code: Optional[str] = None


class RiskSignals(BaseModel):
    device_id: str
    ip_address: str
    geo_lat: Optional[float] = None
    geo_long: Optional[float] = None
    ip_risk_score: int
    device_change_flag: bool
    velocity_txn_last_10min: int
    velocity_amt_last_1hr: float
    failed_txn_count_24hr: int
    session_duration_seconds: int


class Transaction(BaseModel):
    transaction_id: str
    reference_id: str
    timestamp: str
    amount: float
    currency: str
    type: str
    channel: str
    transaction_status: str
    source_account: SourceAccount
    destination: Destination
    risk_signals: RiskSignals
    expected_label: Optional[str] = None
    description: Optional[str] = None


class RuleResult(BaseModel):
    flags: list[str]
    pass_to_ml: bool
    processing_time_ms: float


class MLScoreResult(BaseModel):
    anomaly_score: float
    feature_contributions: dict[str, float]
    pass_to_llm: bool
    processing_time_ms: float


class AIAnalysisResult(BaseModel):
    fraud_type: str
    confidence: int
    reasoning: str
    risk_factors: list[str]
    recommended_action: str


class FraudVerdict(BaseModel):
    transaction_id: str
    amount: float
    type: str
    source_account_id: str
    destination_name: str
    risk_score: int
    verdict: Verdict
    fraud_type: Optional[str] = None
    tier_reached: int
    rule_flags: list[str]
    ml_score: Optional[float] = None
    ml_features: Optional[dict[str, float]] = None
    ai_analysis: Optional[AIAnalysisResult] = None
    processing_time_ms: float
    timestamp: str


class TransactionHistoryItem(BaseModel):
    id: str
    transaction_id: str
    amount: float
    type: str
    destination_name: str
    risk_score: int
    verdict: str
    fraud_type: Optional[str] = None
    created_at: str


class FraudStats(BaseModel):
    total_transactions: int
    safe_count: int
    suspicious_count: int
    high_risk_count: int
    avg_processing_time_ms: float
    fraud_type_breakdown: dict[str, int]
