import json
import time
import uuid
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter, HTTPException

from schemas.credit import (
    CreditApplicant,
    CreditAssessmentResult,
    RuleScoring,
    MLScoring,
    CreditDecision,
    RiskBand,
)
from credit.rule_engine import rule_score
from credit.ml_model import ml_score, MODEL_AUC
from credit.feature_mapper import to_ml_features
from credit.reason_codes import generate_reason_codes
from database import (
    save_credit_assessment,
    get_credit_assessments,
    get_credit_assessment_by_id,
    get_processed_applicant_ids,
    delete_oldest_credit_assessment,
    get_credit_stats
)


router = APIRouter(prefix="/api/v1/credit", tags=["Credit Scoring"])

DATA_FILE = Path(__file__).parent.parent / "data" / "credit_sample_data.json"


def load_sample_applicants() -> list[dict]:
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def process_applicant(applicant_data: dict) -> CreditAssessmentResult:
    start_time = time.perf_counter()
    
    applicant = CreditApplicant.model_validate(applicant_data)
    
    r_score = rule_score(applicant)
    features = to_ml_features(applicant)
    prob, m_score = ml_score(features)
    
    final_score = int(0.6 * m_score + 0.4 * r_score)
    
    if final_score >= 700:
        band = RiskBand.HIGH
    elif final_score >= 350:
        band = RiskBand.MODERATE
    else:
        band = RiskBand.LOW
    
    reason_codes = generate_reason_codes(applicant)
    
    total_time_ms = (time.perf_counter() - start_time) * 1000
    
    return CreditAssessmentResult(
        assessment_id=f"CR-{applicant.user_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        timestamp=datetime.now().isoformat(),
        applicant=applicant,
        rule_scoring=RuleScoring(
            base_score=r_score,
            final_rule_score=r_score
        ),
        ml_scoring=MLScoring(
            high_risk_probability=round(prob, 4),
            ml_score=m_score,
            model_auc=round(MODEL_AUC, 3) if MODEL_AUC else None
        ),
        decision=CreditDecision(
            final_credit_score=final_score,
            risk_band=band,
            reason_codes=reason_codes
        ),
        processing_time_ms=total_time_ms
    )


@router.post("/process-next")
async def process_next_applicant():
    all_applicants = load_sample_applicants()
    if not all_applicants:
        raise HTTPException(status_code=404, detail="No sample applicants found")
    
    processed_ids = get_processed_applicant_ids()
    
    next_applicant = None
    for applicant in all_applicants:
        if applicant.get("user_id") not in processed_ids:
            next_applicant = applicant
            break
    
    if next_applicant is None:
        deleted_id = delete_oldest_credit_assessment()
        if deleted_id:
            for applicant in all_applicants:
                if applicant.get("user_id") == deleted_id:
                    next_applicant = applicant
                    break
        
        if next_applicant is None and all_applicants:
            next_applicant = all_applicants[0]
            delete_oldest_credit_assessment()
    
    if next_applicant is None:
        raise HTTPException(status_code=404, detail="No applicants available")
    
    result = process_applicant(next_applicant)
    
    record_id = str(uuid.uuid4())
    save_credit_assessment(
        record_id=record_id,
        assessment_id=result.assessment_id,
        user_id=result.applicant.user_id,
        age=result.applicant.age,
        occupation=result.applicant.occupation,
        monthly_income=result.applicant.monthly_income,
        final_score=result.decision.final_credit_score,
        risk_band=result.decision.risk_band.value,
        reason_codes=json.dumps(result.decision.reason_codes),
        rule_score=result.rule_scoring.final_rule_score,
        ml_score=result.ml_scoring.ml_score,
        ml_probability=result.ml_scoring.high_risk_probability,
        processing_time_ms=result.processing_time_ms,
        applicant_json=json.dumps(next_applicant)
    )
    
    return {
        "success": True,
        "assessment": result.model_dump()
    }


@router.get("/assessments")
async def list_assessments(limit: int = 50):
    assessments = get_credit_assessments(limit=limit)
    return {"assessments": assessments}


@router.get("/assessments/{assessment_id}")
async def get_assessment_detail(assessment_id: str):
    assessment = get_credit_assessment_by_id(assessment_id)
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return assessment


@router.get("/stats")
async def get_stats():
    return get_credit_stats()
