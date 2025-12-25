import json
import time
import uuid
import logging
from pathlib import Path
from fastapi import APIRouter, HTTPException

from schemas.fraud import Transaction, FraudVerdict, Verdict
from fraud.rule_engine import apply_rules
from fraud.ml_scorer import fraud_scorer
from fraud.llm_analyzer import analyze_transaction
from database import (
    save_fraud_transaction,
    get_fraud_transactions,
    get_fraud_transaction_by_id,
    get_processed_transaction_ids,
    delete_oldest_fraud_transaction,
    get_fraud_stats
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/fraud", tags=["Fraud Detection"])

DATA_DIR = Path(__file__).parent.parent / "data"
MOCK_FILES = ["mock_transactions.json", "more_mock_transactions.json"]


def load_all_mock_transactions() -> list[dict]:
    all_transactions = []
    for filename in MOCK_FILES:
        filepath = DATA_DIR / filename
        if filepath.exists():
            with open(filepath, "r", encoding="utf-8") as f:
                data = json.load(f)
                all_transactions.extend(data.get("transactions", []))
    return all_transactions


def process_transaction(txn_dict: dict) -> FraudVerdict:
    start_time = time.perf_counter()

    txn = Transaction.model_validate(txn_dict)

    rule_result = apply_rules(txn)
    tier_reached = 1
    ml_result = None
    ai_result = None
    fraud_type = None

    if rule_result.pass_to_ml:
        ml_result = fraud_scorer.score(txn)
        tier_reached = 2

        if ml_result.pass_to_llm:
            ai_result = analyze_transaction(
                txn_data=txn_dict,
                rule_flags=rule_result.flags,
                ml_score=ml_result.anomaly_score
            )
            tier_reached = 3
            fraud_type = ai_result.fraud_type

    # Define known fraud types  
    FRAUD_TYPES = {
        "SYNTHETIC_IDENTITY", "MONEY_LAUNDERING", "ACCOUNT_TAKEOVER",
        "STRUCTURING", "BUST_OUT", "PHISHING_SCAM", "MULE_ACCOUNT",
        "BUSINESS_EMAIL_COMPROMISE", "CRYPTO_SCAM"
    }
    
    # Determine verdict based on tier reached
    if tier_reached == 3 and ai_result:
        fraud_type_upper = ai_result.fraud_type.upper()
        
        # Check if AI identified a fraud type
        # If AI identifies actual fraud type, treat it seriously
        if fraud_type_upper in ["LEGITIMATE", "SAFE", "NORMAL", "NONE", "N/A", ""]:
            # AI says it's legitimate
            verdict = Verdict.SAFE
            risk_score = max(15, min(35, ai_result.confidence // 2))
        else:
            # AI identified a real fraud type - this is serious
            if ai_result.recommended_action == "BLOCK" or ai_result.confidence > 70:
                verdict = Verdict.HIGH_RISK
                risk_score = max(75, ai_result.confidence)
            else:
                verdict = Verdict.SUSPICIOUS
                risk_score = max(55, min(74, ai_result.confidence))
    elif tier_reached == 2 and ml_result:
        # Use ML anomaly score to determine verdict
        if ml_result.anomaly_score > 65:
            verdict = Verdict.SUSPICIOUS
            risk_score = int(ml_result.anomaly_score)
        elif ml_result.anomaly_score > 50:
            verdict = Verdict.SUSPICIOUS  # Changed: 50+ is suspicious
            risk_score = int(ml_result.anomaly_score)
        elif ml_result.anomaly_score > 30:
            verdict = Verdict.SAFE
            risk_score = int(ml_result.anomaly_score)
        else:
            verdict = Verdict.SAFE
            risk_score = int(ml_result.anomaly_score)
    else:
        # Tier 1 only - based on rule flags
        if len(rule_result.flags) >= 5:
            verdict = Verdict.SUSPICIOUS
            risk_score = 50
        elif len(rule_result.flags) >= 3:
            verdict = Verdict.SAFE
            risk_score = 30
        elif len(rule_result.flags) >= 1:
            verdict = Verdict.SAFE
            risk_score = 15
        else:
            verdict = Verdict.SAFE
            risk_score = 5

    total_time_ms = (time.perf_counter() - start_time) * 1000

    return FraudVerdict(
        transaction_id=txn.transaction_id,
        amount=txn.amount,
        type=txn.type,
        source_account_id=txn.source_account.account_id,
        destination_name=txn.destination.name,
        risk_score=risk_score,
        verdict=verdict,
        fraud_type=fraud_type,
        tier_reached=tier_reached,
        rule_flags=rule_result.flags,
        ml_score=ml_result.anomaly_score if ml_result else None,
        ml_features=ml_result.feature_contributions if ml_result else None,
        ai_analysis=ai_result,
        processing_time_ms=total_time_ms,
        timestamp=txn.timestamp
    )


@router.post("/process-next")
async def process_next_transaction():
    all_txns = load_all_mock_transactions()
    if not all_txns:
        raise HTTPException(status_code=404, detail="No mock transactions found")

    processed_ids = get_processed_transaction_ids()

    next_txn = None
    for txn in all_txns:
        if txn.get("transaction_id") not in processed_ids:
            next_txn = txn
            break

    if next_txn is None:
        deleted_id = delete_oldest_fraud_transaction()
        if deleted_id:
            for txn in all_txns:
                if txn.get("transaction_id") == deleted_id:
                    next_txn = txn
                    break

        if next_txn is None and all_txns:
            next_txn = all_txns[0]
            delete_oldest_fraud_transaction()

    if next_txn is None:
        raise HTTPException(status_code=404, detail="No transactions available")

    verdict = process_transaction(next_txn)

    record_id = str(uuid.uuid4())
    save_fraud_transaction(
        record_id=record_id,
        transaction_id=verdict.transaction_id,
        amount=verdict.amount,
        txn_type=verdict.type,
        source_account_id=verdict.source_account_id,
        destination_name=verdict.destination_name,
        risk_score=verdict.risk_score,
        verdict=verdict.verdict.value,
        fraud_type=verdict.fraud_type,
        tier_reached=verdict.tier_reached,
        rule_flags=json.dumps(verdict.rule_flags),
        ml_score=verdict.ml_score,
        ml_features=json.dumps(verdict.ml_features) if verdict.ml_features else None,
        ai_reasoning=verdict.ai_analysis.reasoning if verdict.ai_analysis else None,
        processing_time_ms=verdict.processing_time_ms,
        transaction_json=json.dumps(next_txn)
    )

    return {
        "success": True,
        "transaction": verdict.model_dump()
    }


@router.get("/transactions")
async def list_transactions(limit: int = 50):
    transactions = get_fraud_transactions(limit=limit)
    return {"transactions": transactions}


@router.get("/transactions/{transaction_id}")
async def get_transaction_detail(transaction_id: str):
    transaction = get_fraud_transaction_by_id(transaction_id)
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.get("/stats")
async def get_stats():
    return get_fraud_stats()
