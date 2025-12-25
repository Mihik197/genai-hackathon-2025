import time
import numpy as np
from schemas.fraud import Transaction, MLScoreResult


class FraudScorer:
    """
    ML-based fraud scorer using weighted risk indicators.
    Produces differentiated risk scores:
    - Low risk: 10-30%
    - Medium risk: 40-60%
    - High risk: 70-100%
    """

    def __init__(self):
        self.feature_names = [
            "amount_risk",
            "account_age_risk",
            "velocity_risk",
            "ip_risk",
            "device_risk",
            "beneficiary_risk",
            "failed_attempts_risk",
            "session_risk"
        ]

    def score(self, txn: Transaction) -> MLScoreResult:
        start_time = time.perf_counter()

        # Calculate individual risk factors (0-100 each)
        contributions = {}

        # Amount risk - high amounts relative to balance
        balance_ratio = txn.amount / max(txn.source_account.avg_monthly_balance, 1)
        amount_deviation = txn.amount / max(txn.source_account.avg_transaction_amount, 1)
        if balance_ratio > 1.0:
            contributions["amount_risk"] = min(25, (balance_ratio - 1) * 30)
        elif amount_deviation > 10:
            contributions["amount_risk"] = min(20, (amount_deviation - 10) * 2)
        elif amount_deviation > 5:
            contributions["amount_risk"] = min(10, (amount_deviation - 5) * 2)
        else:
            contributions["amount_risk"] = 0

        # Account age risk - new accounts are risky
        age_days = txn.source_account.account_age_days
        if age_days < 7:
            contributions["account_age_risk"] = 25
        elif age_days < 30:
            contributions["account_age_risk"] = 15
        elif age_days < 90:
            contributions["account_age_risk"] = 5
        else:
            contributions["account_age_risk"] = 0

        # Velocity risk - high transaction frequency
        velocity = txn.risk_signals.velocity_txn_last_10min
        if velocity > 5:
            contributions["velocity_risk"] = 20
        elif velocity > 3:
            contributions["velocity_risk"] = 12
        elif velocity > 2:
            contributions["velocity_risk"] = 5
        else:
            contributions["velocity_risk"] = 0

        # IP risk - high IP risk score indicates VPN/proxy/bad reputation
        ip_score = txn.risk_signals.ip_risk_score
        if ip_score > 80:
            contributions["ip_risk"] = 25
        elif ip_score > 50:
            contributions["ip_risk"] = 15
        elif ip_score > 30:
            contributions["ip_risk"] = 5
        else:
            contributions["ip_risk"] = 0

        # Device change risk
        contributions["device_risk"] = 18 if txn.risk_signals.device_change_flag else 0

        # Beneficiary risk
        if not txn.destination.is_known_beneficiary:
            if txn.destination.relationship == "unknown":
                contributions["beneficiary_risk"] = 15
            else:
                contributions["beneficiary_risk"] = 8
        else:
            contributions["beneficiary_risk"] = 0

        # Failed attempts risk
        failed = txn.risk_signals.failed_txn_count_24hr
        if failed >= 3:
            contributions["failed_attempts_risk"] = 20
        elif failed >= 2:
            contributions["failed_attempts_risk"] = 10
        else:
            contributions["failed_attempts_risk"] = 0

        # Session duration risk - very short sessions are suspicious
        session = txn.risk_signals.session_duration_seconds
        if session < 15:
            contributions["session_risk"] = 15
        elif session < 30:
            contributions["session_risk"] = 8
        else:
            contributions["session_risk"] = 0

        # Calculate total anomaly score from contributions
        total_risk = sum(contributions.values())
        
        # Apply base score adjustment - start from a low baseline
        # This ensures normal transactions score low (10-25)
        # and suspicious ones score high (50+)
        base_score = 10
        anomaly_score = min(100, max(0, base_score + total_risk))

        # Round contributions for display
        for key in contributions:
            contributions[key] = round(contributions[key], 1)

        elapsed_ms = (time.perf_counter() - start_time) * 1000

        return MLScoreResult(
            anomaly_score=round(anomaly_score, 1),
            feature_contributions=contributions,
            pass_to_llm=anomaly_score > 55,  # Trigger LLM for medium-high risk
            processing_time_ms=elapsed_ms
        )


fraud_scorer = FraudScorer()



