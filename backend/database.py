import sqlite3
from pathlib import Path
from datetime import datetime
import json
from contextlib import contextmanager


DB_PATH = Path(__file__).parent / "data" / "finguard.db"


def get_connection():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS analyses (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                regulation_title TEXT,
                regulation_reference TEXT,
                overall_status TEXT NOT NULL,
                gaps_count INTEGER NOT NULL DEFAULT 0,
                action_items_count INTEGER NOT NULL DEFAULT 0,
                processing_time REAL,
                report_json TEXT,
                created_at TEXT NOT NULL
            )
        """)


def save_analysis(
    analysis_id: str,
    filename: str,
    regulation_title: str,
    regulation_reference: str | None,
    overall_status: str,
    gaps_count: int,
    action_items_count: int,
    processing_time: float,
    report_json: str
):
    with get_db() as conn:
        conn.execute("""
            INSERT INTO analyses (
                id, filename, regulation_title, regulation_reference,
                overall_status, gaps_count, action_items_count,
                processing_time, report_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            analysis_id,
            filename,
            regulation_title,
            regulation_reference,
            overall_status,
            gaps_count,
            action_items_count,
            processing_time,
            report_json,
            datetime.utcnow().isoformat()
        ))


def get_analyses(limit: int = 10):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT id, filename, regulation_title, regulation_reference,
                   overall_status, gaps_count, action_items_count,
                   processing_time, created_at
            FROM analyses
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,)).fetchall()
        return [dict(row) for row in rows]


def get_analysis_by_id(analysis_id: str):
    with get_db() as conn:
        row = conn.execute("""
            SELECT * FROM analyses WHERE id = ?
        """, (analysis_id,)).fetchone()
        if row:
            result = dict(row)
            if result.get("report_json"):
                result["report"] = json.loads(result["report_json"])
            return result
        return None


def init_investment_strategies_table():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS investment_strategies (
                id TEXT PRIMARY KEY,
                ticker_or_sector TEXT NOT NULL,
                risk_tolerance TEXT NOT NULL,
                investment_horizon TEXT NOT NULL,
                focus_areas TEXT,
                strategy_name TEXT,
                strategy_json TEXT,
                processing_time REAL,
                created_at TEXT NOT NULL
            )
        """)


def save_investment_strategy(
    strategy_id: str,
    ticker_or_sector: str,
    risk_tolerance: str,
    investment_horizon: str,
    focus_areas: str | None,
    strategy_name: str,
    strategy_json: str,
    processing_time: float
):
    with get_db() as conn:
        conn.execute("""
            INSERT INTO investment_strategies (
                id, ticker_or_sector, risk_tolerance, investment_horizon,
                focus_areas, strategy_name, strategy_json, processing_time, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            strategy_id,
            ticker_or_sector,
            risk_tolerance,
            investment_horizon,
            focus_areas,
            strategy_name,
            strategy_json,
            processing_time,
            datetime.utcnow().isoformat()
        ))


def get_investment_strategies(limit: int = 10):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT id, ticker_or_sector, strategy_name, risk_tolerance,
                   investment_horizon, processing_time, created_at
            FROM investment_strategies
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,)).fetchall()
        return [dict(row) for row in rows]


def get_investment_strategy_by_id(strategy_id: str):
    with get_db() as conn:
        row = conn.execute("""
            SELECT * FROM investment_strategies WHERE id = ?
        """, (strategy_id,)).fetchone()
        if row:
            result = dict(row)
            if result.get("strategy_json"):
                result["strategy_output"] = json.loads(result["strategy_json"])
            return result
        return None


init_db()
init_investment_strategies_table()


def init_fraud_transactions_table():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS fraud_transactions (
                id TEXT PRIMARY KEY,
                transaction_id TEXT UNIQUE NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL,
                source_account_id TEXT,
                destination_name TEXT,
                risk_score INTEGER,
                verdict TEXT,
                fraud_type TEXT,
                tier_reached INTEGER,
                rule_flags TEXT,
                ml_score REAL,
                ml_features TEXT,
                ai_reasoning TEXT,
                processing_time_ms REAL,
                transaction_json TEXT,
                created_at TEXT NOT NULL
            )
        """)


def save_fraud_transaction(
    record_id: str,
    transaction_id: str,
    amount: float,
    txn_type: str,
    source_account_id: str,
    destination_name: str,
    risk_score: int,
    verdict: str,
    fraud_type: str | None,
    tier_reached: int,
    rule_flags: str,
    ml_score: float | None,
    ml_features: str | None,
    ai_reasoning: str | None,
    processing_time_ms: float,
    transaction_json: str
):
    with get_db() as conn:
        conn.execute("""
            INSERT INTO fraud_transactions (
                id, transaction_id, amount, type, source_account_id,
                destination_name, risk_score, verdict, fraud_type, tier_reached,
                rule_flags, ml_score, ml_features, ai_reasoning,
                processing_time_ms, transaction_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record_id,
            transaction_id,
            amount,
            txn_type,
            source_account_id,
            destination_name,
            risk_score,
            verdict,
            fraud_type,
            tier_reached,
            rule_flags,
            ml_score,
            ml_features,
            ai_reasoning,
            processing_time_ms,
            transaction_json,
            datetime.utcnow().isoformat()
        ))


def get_fraud_transactions(limit: int = 50):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT id, transaction_id, amount, type, destination_name,
                   risk_score, verdict, fraud_type, created_at
            FROM fraud_transactions
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,)).fetchall()
        return [dict(row) for row in rows]


def get_fraud_transaction_by_id(transaction_id: str):
    with get_db() as conn:
        row = conn.execute("""
            SELECT * FROM fraud_transactions WHERE transaction_id = ?
        """, (transaction_id,)).fetchone()
        if row:
            result = dict(row)
            if result.get("transaction_json"):
                result["transaction_data"] = json.loads(result["transaction_json"])
            if result.get("rule_flags"):
                result["rule_flags_list"] = json.loads(result["rule_flags"])
            if result.get("ml_features"):
                result["ml_features_dict"] = json.loads(result["ml_features"])
            return result
        return None


def get_processed_transaction_ids() -> set[str]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT transaction_id FROM fraud_transactions
        """).fetchall()
        return {row["transaction_id"] for row in rows}


def delete_oldest_fraud_transaction() -> str | None:
    with get_db() as conn:
        row = conn.execute("""
            SELECT transaction_id FROM fraud_transactions
            ORDER BY created_at ASC LIMIT 1
        """).fetchone()
        if row:
            txn_id = row["transaction_id"]
            conn.execute("""
                DELETE FROM fraud_transactions WHERE transaction_id = ?
            """, (txn_id,))
            return txn_id
        return None


def get_fraud_stats():
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) as cnt FROM fraud_transactions").fetchone()["cnt"]
        safe = conn.execute("SELECT COUNT(*) as cnt FROM fraud_transactions WHERE verdict = 'SAFE'").fetchone()["cnt"]
        suspicious = conn.execute("SELECT COUNT(*) as cnt FROM fraud_transactions WHERE verdict = 'SUSPICIOUS'").fetchone()["cnt"]
        high_risk = conn.execute("SELECT COUNT(*) as cnt FROM fraud_transactions WHERE verdict = 'HIGH_RISK'").fetchone()["cnt"]
        avg_time = conn.execute("SELECT AVG(processing_time_ms) as avg FROM fraud_transactions").fetchone()["avg"] or 0

        fraud_types = conn.execute("""
            SELECT fraud_type, COUNT(*) as cnt FROM fraud_transactions
            WHERE fraud_type IS NOT NULL AND fraud_type != ''
            GROUP BY fraud_type
        """).fetchall()
        fraud_type_breakdown = {row["fraud_type"]: row["cnt"] for row in fraud_types}

        return {
            "total_transactions": total,
            "safe_count": safe,
            "suspicious_count": suspicious,
            "high_risk_count": high_risk,
            "avg_processing_time_ms": round(avg_time, 2),
            "fraud_type_breakdown": fraud_type_breakdown
        }


init_fraud_transactions_table()


def init_credit_assessments_table():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS credit_assessments (
                id TEXT PRIMARY KEY,
                assessment_id TEXT UNIQUE NOT NULL,
                user_id TEXT NOT NULL,
                age INTEGER,
                occupation TEXT,
                monthly_income REAL,
                final_score INTEGER,
                risk_band TEXT,
                reason_codes TEXT,
                rule_score INTEGER,
                ml_score INTEGER,
                ml_probability REAL,
                processing_time_ms REAL,
                applicant_json TEXT,
                created_at TEXT NOT NULL
            )
        """)


def save_credit_assessment(
    record_id: str,
    assessment_id: str,
    user_id: str,
    age: int,
    occupation: str,
    monthly_income: float,
    final_score: int,
    risk_band: str,
    reason_codes: str,
    rule_score: int,
    ml_score: int,
    ml_probability: float,
    processing_time_ms: float,
    applicant_json: str
):
    with get_db() as conn:
        conn.execute("""
            INSERT INTO credit_assessments (
                id, assessment_id, user_id, age, occupation, monthly_income,
                final_score, risk_band, reason_codes, rule_score, ml_score,
                ml_probability, processing_time_ms, applicant_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record_id,
            assessment_id,
            user_id,
            age,
            occupation,
            monthly_income,
            final_score,
            risk_band,
            reason_codes,
            rule_score,
            ml_score,
            ml_probability,
            processing_time_ms,
            applicant_json,
            datetime.utcnow().isoformat()
        ))


def get_credit_assessments(limit: int = 50):
    with get_db() as conn:
        rows = conn.execute("""
            SELECT id, assessment_id, user_id, age, occupation, monthly_income,
                   final_score, risk_band, processing_time_ms, created_at
            FROM credit_assessments
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,)).fetchall()
        return [dict(row) for row in rows]


def get_credit_assessment_by_id(assessment_id: str):
    with get_db() as conn:
        row = conn.execute("""
            SELECT * FROM credit_assessments WHERE assessment_id = ?
        """, (assessment_id,)).fetchone()
        if row:
            result = dict(row)
            if result.get("applicant_json"):
                result["applicant_data"] = json.loads(result["applicant_json"])
            if result.get("reason_codes"):
                result["reason_codes_list"] = json.loads(result["reason_codes"])
            return result
        return None


def get_processed_applicant_ids() -> set[str]:
    with get_db() as conn:
        rows = conn.execute("""
            SELECT user_id FROM credit_assessments
        """).fetchall()
        return {row["user_id"] for row in rows}


def delete_oldest_credit_assessment() -> str | None:
    with get_db() as conn:
        row = conn.execute("""
            SELECT user_id FROM credit_assessments
            ORDER BY created_at ASC LIMIT 1
        """).fetchone()
        if row:
            user_id = row["user_id"]
            conn.execute("""
                DELETE FROM credit_assessments WHERE user_id = ?
            """, (user_id,))
            return user_id
        return None


def get_credit_stats():
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) as cnt FROM credit_assessments").fetchone()["cnt"]
        low = conn.execute("SELECT COUNT(*) as cnt FROM credit_assessments WHERE risk_band = 'Low'").fetchone()["cnt"]
        moderate = conn.execute("SELECT COUNT(*) as cnt FROM credit_assessments WHERE risk_band = 'Moderate'").fetchone()["cnt"]
        high = conn.execute("SELECT COUNT(*) as cnt FROM credit_assessments WHERE risk_band = 'High'").fetchone()["cnt"]
        avg_score = conn.execute("SELECT AVG(final_score) as avg FROM credit_assessments").fetchone()["avg"] or 0
        avg_time = conn.execute("SELECT AVG(processing_time_ms) as avg FROM credit_assessments").fetchone()["avg"] or 0

        return {
            "total_assessments": total,
            "low_risk_count": low,
            "moderate_risk_count": moderate,
            "high_risk_count": high,
            "avg_score": round(avg_score, 1),
            "avg_processing_time_ms": round(avg_time, 2)
        }


init_credit_assessments_table()
