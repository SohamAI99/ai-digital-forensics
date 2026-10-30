import sqlite3
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from backend.app.config import DATABASE_PATH

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DATABASE_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id TEXT PRIMARY KEY,
            analysis_type TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            identifier TEXT NOT NULL,
            classification TEXT NOT NULL,
            risk_level TEXT NOT NULL,
            overall_score REAL NOT NULL,
            summary TEXT,
            details_json TEXT NOT NULL,
            report_pdf_path TEXT,
            report_html_path TEXT
        )
    """)
    conn.commit()
    conn.close()

def insert_analysis(
    analysis_id: str,
    analysis_type: str,
    identifier: str,
    classification: str,
    risk_level: str,
    overall_score: float,
    summary: str,
    details: Dict[str, Any],
    report_pdf_path: Optional[str] = None,
    report_html_path: Optional[str] = None
) -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO analyses (
            id, analysis_type, timestamp, identifier, classification,
            risk_level, overall_score, summary, details_json,
            report_pdf_path, report_html_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        analysis_id,
        analysis_type,
        datetime.now(timezone.utc).isoformat(),
        identifier,
        classification,
        risk_level,
        overall_score,
        summary,
        json.dumps(details),
        report_pdf_path,
        report_html_path
    ))
    conn.commit()
    conn.close()

def get_analysis_by_id(analysis_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        try:
            data["details"] = json.loads(data["details_json"])
        except Exception:
            data["details"] = {}
        return data
    return None

def get_recent_analyses(limit: int = 50, analysis_type: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if analysis_type:
        cursor.execute("SELECT * FROM analyses WHERE analysis_type = ? ORDER BY timestamp DESC LIMIT ?", (analysis_type, limit))
    else:
        cursor.execute("SELECT * FROM analyses ORDER BY timestamp DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    results = []
    for row in rows:
        item = dict(row)
        try:
            item["details"] = json.loads(item["details_json"])
        except Exception:
            item["details"] = {}
        results.append(item)
    return results

def get_dashboard_summary() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Email stats
    cursor.execute("SELECT COUNT(*) FROM analyses WHERE analysis_type = 'email'")
    email_total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM analyses WHERE analysis_type = 'email' AND risk_level = 'High Risk'")
    high_risk_emails = cursor.fetchone()[0]
    
    # Image stats
    cursor.execute("SELECT COUNT(*) FROM analyses WHERE analysis_type = 'image'")
    image_total = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM analyses WHERE analysis_type = 'image' AND (classification LIKE '%Manipulated%' OR classification LIKE '%Deepfake%')")
    potential_deepfakes = cursor.fetchone()[0]
    
    # Recent activity
    cursor.execute("SELECT id, analysis_type, timestamp, identifier, classification, risk_level, overall_score FROM analyses ORDER BY timestamp DESC LIMIT 8")
    recent_rows = cursor.fetchall()
    conn.close()
    
    recent_activity = [dict(r) for r in recent_rows]
    
    return {
        "email_total": email_total,
        "image_total": image_total,
        "high_risk_emails": high_risk_emails,
        "potential_deepfakes": potential_deepfakes,
        "recent_activity": recent_activity
    }
