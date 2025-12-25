def rule_score(req):
    """Produce a rule-based risk score (higher value => higher risk) 0-1000 scale."""
    score = 0

    if req.transaction_count_30d >= 100:
        score += 300
    elif req.transaction_count_30d >= 50:
        score += 200
    elif req.transaction_count_30d >= 20:
        score += 120
    else:
        score += 40

    if req.avg_transaction_amount >= 1000:
        score += 250
    elif req.avg_transaction_amount >= 200:
        score += 150
    else:
        score += 60

    score += int(req.location_risk_score * 200)
    score += min(req.device_change_frequency * 40, 200)

    if req.previous_fraud_flag:
        score += 200
    score += min(req.chargeback_count * 50, 200)

    return min(score, 1000)
