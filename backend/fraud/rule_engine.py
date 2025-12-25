import time
from schemas.fraud import Transaction, RuleResult

INDIAN_LOCATIONS = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune",
    "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Kanpur", "Nagpur", "Indore",
    "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara",
    "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot",
    "Varanasi", "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai",
    "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", "Gwalior",
    "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Gurgaon", "Noida",
    "Guwahati", "Chandigarh", "Kochi", "Tier-3 City", "India"
]

HIGH_RISK_MCCS = [
    "7995",  # Gambling
    "6211",  # Securities brokers/dealers
    "6010", "6011",  # Financial institutions - cash
    "4829",  # Money transfer
    "5967",  # Direct marketing - inbound teleservices merchant
    "5966",  # Direct marketing - outbound teleservices merchant
]

LOW_RISK_RELATIONSHIPS = ["landlord", "utility_provider", "family", "e_commerce", "merchant"]
HIGH_RISK_RELATIONSHIPS = ["unknown", "business", "crypto_exchange"]


def apply_rules(txn: Transaction) -> RuleResult:
    start_time = time.perf_counter()
    flags: list[str] = []

    # === AMOUNT-BASED RULES ===
    if txn.amount > 500000:
        flags.append("VERY_HIGH_VALUE")
    elif txn.amount > 100000:
        flags.append("HIGH_VALUE")

    # Amount vs average balance ratio (spending more than typical balance)
    balance_ratio = txn.amount / max(txn.source_account.avg_monthly_balance, 1)
    if balance_ratio > 0.8:
        flags.append("NEAR_FULL_BALANCE_WITHDRAWAL")
    elif balance_ratio > 0.5:
        flags.append("HIGH_BALANCE_RATIO")

    # Amount vs typical transaction pattern
    avg_txn = txn.source_account.avg_transaction_amount
    if avg_txn > 0:
        amount_deviation = txn.amount / avg_txn
        if amount_deviation > 10:
            flags.append("EXTREME_AMOUNT_DEVIATION")
        elif amount_deviation > 5:
            flags.append("HIGH_AMOUNT_DEVIATION")

    # Structuring detection (just below reporting thresholds)
    if 49000 <= txn.amount <= 49999:
        flags.append("STRUCTURING_AMOUNT")

    # === ACCOUNT AGE RULES ===
    if txn.source_account.account_age_days < 7:
        flags.append("VERY_NEW_ACCOUNT")
    elif txn.source_account.account_age_days < 30:
        flags.append("NEW_ACCOUNT")

    # New account + high value = suspicious
    if txn.source_account.account_age_days < 30 and txn.amount > 100000:
        flags.append("NEW_ACCOUNT_HIGH_VALUE")

    # === VELOCITY RULES ===
    if txn.risk_signals.velocity_txn_last_10min > 3:
        flags.append("HIGH_VELOCITY")
    
    if txn.risk_signals.velocity_amt_last_1hr > 200000:
        flags.append("VERY_HIGH_AMOUNT_VELOCITY")
    elif txn.risk_signals.velocity_amt_last_1hr > 100000:
        flags.append("HIGH_AMOUNT_VELOCITY")

    # Velocity relative to account history - only flag if VERY unusual
    # monthly_avg = txn.source_account.total_transactions_30d
    # Removed: This was flagging normal transactions too aggressively

    # === BENEFICIARY RULES ===
    if not txn.destination.is_known_beneficiary:
        if txn.amount > 100000:  # Raised threshold
            flags.append("NEW_BENEFICIARY_HIGH_VALUE")
        if txn.destination.relationship == "unknown":
            flags.append("UNKNOWN_RELATIONSHIP")
    
    # Only flag high risk relationships for UNKNOWN beneficiaries
    if txn.destination.relationship in HIGH_RISK_RELATIONSHIPS and not txn.destination.is_known_beneficiary:
        flags.append("HIGH_RISK_RELATIONSHIP")

    # === LOCATION RULES ===
    dest_location = txn.destination.location
    if dest_location and dest_location not in INDIAN_LOCATIONS:
        flags.append("INTERNATIONAL_TRANSFER")
        if not txn.destination.is_known_beneficiary:
            flags.append("INTERNATIONAL_UNKNOWN_BENEFICIARY")

    # Geo mismatch - account location vs source location
    if txn.source_account.location != txn.destination.location:
        if dest_location and dest_location not in INDIAN_LOCATIONS:
            flags.append("CROSS_BORDER_MISMATCH")

    # Geo coordinates missing (possible VPN/proxy)
    if txn.risk_signals.geo_lat is None or txn.risk_signals.geo_long is None:
        flags.append("GEO_LOCATION_HIDDEN")

    # === DEVICE AND IP RULES ===
    if txn.risk_signals.device_change_flag:
        flags.append("DEVICE_CHANGE")
        if txn.amount > 100000:
            flags.append("DEVICE_CHANGE_HIGH_VALUE")

    if txn.risk_signals.ip_risk_score > 80:
        flags.append("VERY_HIGH_IP_RISK")
    elif txn.risk_signals.ip_risk_score > 50:
        flags.append("HIGH_IP_RISK")
    elif txn.risk_signals.ip_risk_score > 30:
        flags.append("MODERATE_IP_RISK")

    # === SESSION BEHAVIOR RULES ===
    # Only flag very short sessions for HIGH VALUE transactions
    if txn.risk_signals.session_duration_seconds < 15 and txn.amount > 100000:
        flags.append("RUSHED_HIGH_VALUE_TRANSACTION")
    # Removed SHORT_SESSION rule - too aggressive for normal transactions

    # === FAILED TRANSACTION HISTORY ===
    if txn.risk_signals.failed_txn_count_24hr >= 3:  # Raised threshold
        flags.append("MULTIPLE_FAILED_ATTEMPTS")

    # === TIME-BASED RULES ===
    hour = _extract_hour(txn.timestamp)
    if hour is not None:
        if 0 <= hour < 5:
            flags.append("LATE_NIGHT_TRANSACTION")
        elif 5 <= hour < 6:
            flags.append("EARLY_MORNING_TRANSACTION")

    # === KYC STATUS RULES ===
    if txn.source_account.kyc_status != "verified":
        if txn.source_account.kyc_status == "video_kyc":
            if txn.amount > 200000:
                flags.append("VIDEO_KYC_HIGH_VALUE")
        else:
            flags.append("INCOMPLETE_KYC")

    # === CHANNEL-BASED RULES ===
    # High value via mobile for accounts that typically use net banking
    if txn.channel == "mobile_app" and txn.amount > 200000:
        flags.append("HIGH_VALUE_MOBILE")

    # === MERCHANT CATEGORY RULES ===
    mcc = txn.destination.merchant_category_code
    if mcc and mcc in HIGH_RISK_MCCS:
        flags.append("HIGH_RISK_MERCHANT_CATEGORY")

    # === COMPOSITE PATTERN DETECTION ===
    # Synthetic identity pattern: new account + device change + high IP risk + international
    synthetic_signals = 0
    if txn.source_account.account_age_days < 30:
        synthetic_signals += 1
    if txn.risk_signals.device_change_flag:
        synthetic_signals += 1
    if txn.risk_signals.ip_risk_score > 50:
        synthetic_signals += 1
    if dest_location and dest_location not in INDIAN_LOCATIONS:
        synthetic_signals += 1
    if txn.risk_signals.geo_lat is None:
        synthetic_signals += 1
    if synthetic_signals >= 3:
        flags.append("SYNTHETIC_IDENTITY_PATTERN")

    # Money laundering pattern: structuring amount + velocity + multiple beneficiaries
    if (49000 <= txn.amount <= 49999 and 
        txn.risk_signals.velocity_txn_last_10min > 2 and
        txn.risk_signals.session_duration_seconds < 30):
        flags.append("STRUCTURING_PATTERN")

    elapsed_ms = (time.perf_counter() - start_time) * 1000

    # Only pass to ML if there are SIGNIFICANT flags (not just minor ones)
    minor_flags = {"HIGH_VALUE", "HIGH_BALANCE_RATIO"}
    significant_flags = [f for f in flags if f not in minor_flags]
    
    return RuleResult(
        flags=flags,
        pass_to_ml=len(significant_flags) > 0,
        processing_time_ms=elapsed_ms
    )


def _extract_hour(timestamp: str) -> int | None:
    try:
        if "T" in timestamp:
            time_part = timestamp.split("T")[1]
            hour_str = time_part.split(":")[0]
            return int(hour_str)
    except (IndexError, ValueError):
        pass
    return None

