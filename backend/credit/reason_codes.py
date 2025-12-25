def generate_reason_codes(req):
    """Generate explainability reason codes for credit decision."""
    reasons = []

    if req.previous_fraud_flag:
        reasons.append("R10: Historical fraud flag on account")

    if req.chargeback_count >= 1:
        reasons.append("R11: Chargebacks detected")

    if req.location_risk_score >= 0.7:
        reasons.append("R07: High-risk location activity")

    if req.transaction_count_30d >= 100 and req.avg_transaction_amount < 50:
        reasons.append("R12: High frequency of low-value transactions")

    if req.device_change_frequency >= 4:
        reasons.append("R05: Frequent device changes")

    if req.account_age_months < 6:
        reasons.append("R03: New account (less than 6 months)")

    return reasons
