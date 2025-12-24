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

