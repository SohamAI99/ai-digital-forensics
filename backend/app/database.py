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
    
    # 1. Primary Analysis Master Table (Preserves full backward compatibility)
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

    # 2. Normalized Email Forensics Entity
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS email_analyses (
            analysis_id TEXT PRIMARY KEY,
            sender TEXT,
            recipient TEXT,
            reply_to TEXT,
            subject TEXT,
            message_id TEXT,
            received_hops INTEGER DEFAULT 0,
            urls_count INTEGER DEFAULT 0,
            attachments_count INTEGER DEFAULT 0,
            spf_result TEXT,
            dkim_result TEXT,
            dmarc_result TEXT,
            FOREIGN KEY (analysis_id) REFERENCES analyses (id) ON DELETE CASCADE
        )
    """)

    # 3. Normalized Image Forensics Entity
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS image_analyses (
            analysis_id TEXT PRIMARY KEY,
            sha256 TEXT,
            image_width INTEGER,
            image_height INTEGER,
            file_size_bytes INTEGER,
            face_detected BOOLEAN,
            high_freq_ratio REAL,
            spectral_centroid REAL,
            azimuthal_deviation REAL,
            FOREIGN KEY (analysis_id) REFERENCES analyses (id) ON DELETE CASCADE
        )
    """)

    # 4. Normalized Forensic Evidence Entity
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS evidence_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id TEXT NOT NULL,
            category TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            severity TEXT NOT NULL,
            score_impact REAL DEFAULT 0.0,
            FOREIGN KEY (analysis_id) REFERENCES analyses (id) ON DELETE CASCADE
        )
    """)

    # 5. Model Version Registry
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS model_versions (
            model_name TEXT PRIMARY KEY,
            version TEXT NOT NULL,
            framework TEXT NOT NULL,
            module_type TEXT NOT NULL,
            last_loaded TEXT NOT NULL
        )
    """)

    # 6. Reports Entity
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reports (
            report_id TEXT PRIMARY KEY,
            analysis_id TEXT NOT NULL,
            report_type TEXT NOT NULL,
            pdf_path TEXT,
            generated_at TEXT NOT NULL,
            FOREIGN KEY (analysis_id) REFERENCES analyses (id) ON DELETE CASCADE
        )
    """)

    # 7. Uploaded File Entity
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            analysis_id TEXT NOT NULL,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            file_size_bytes INTEGER,
            sha256 TEXT,
            uploaded_at TEXT NOT NULL,
            FOREIGN KEY (analysis_id) REFERENCES analyses (id) ON DELETE CASCADE
        )
    """)

    # Seed baseline model versions if not already registered
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
        INSERT OR IGNORE INTO model_versions (model_name, version, framework, module_type, last_loaded)
        VALUES 
            ('TF-IDF + Logistic Regression Phishing Classifier', '1.0.0', 'scikit-learn', 'email', ?),
            ('ForensicSpatialFrequencyNet-v1 (ResNet-18 Spatial-Residual)', '1.0.0-baseline', 'PyTorch', 'image', ?)
    """, (now_iso, now_iso))

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
    timestamp_iso = datetime.now(timezone.utc).isoformat()

    # 1. Master analyses table
    cursor.execute("""
        INSERT INTO analyses (
            id, analysis_type, timestamp, identifier, classification,
            risk_level, overall_score, summary, details_json,
            report_pdf_path, report_html_path
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        analysis_id,
        analysis_type,
        timestamp_iso,
        identifier,
        classification,
        risk_level,
        overall_score,
        summary,
        json.dumps(details),
        report_pdf_path,
        report_html_path
    ))

    # 2. Populate specialized relational tables
    try:
        if analysis_type == "email":
            cursor.execute("""
                INSERT OR REPLACE INTO email_analyses (
                    analysis_id, sender, recipient, reply_to, subject,
                    message_id, received_hops, urls_count, attachments_count,
                    spf_result, dkim_result, dmarc_result
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                analysis_id,
                details.get("sender"),
                details.get("recipient"),
                details.get("reply_to"),
                details.get("subject"),
                details.get("message_id"),
                details.get("received_hops", 0),
                details.get("urls_count", 0),
                details.get("attachments_count", 0),
                details.get("spf_result"),
                details.get("dkim_result"),
                details.get("dmarc_result")
            ))
        elif analysis_type == "image":
            dims = details.get("dimensions", [0, 0])
            cursor.execute("""
                INSERT OR REPLACE INTO image_analyses (
                    analysis_id, sha256, image_width, image_height,
                    file_size_bytes, face_detected, high_freq_ratio,
                    spectral_centroid, azimuthal_deviation
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                analysis_id,
                details.get("sha256"),
                dims[0] if len(dims) > 0 else 0,
                dims[1] if len(dims) > 1 else 0,
                details.get("file_size_bytes", 0),
                bool(details.get("face_detected", False)),
                details.get("high_freq_ratio", 0.0),
                details.get("spectral_centroid", 0.0),
                details.get("azimuthal_deviation", 0.0)
            ))

        # 3. Insert individual evidence items if provided
        evidence_list = details.get("evidence_list", [])
        for ev in evidence_list:
            if isinstance(ev, dict):
                cursor.execute("""
                    INSERT INTO evidence_items (
                        analysis_id, category, title, description, severity, score_impact
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    analysis_id,
                    ev.get("category", "general"),
                    ev.get("title", ""),
                    ev.get("description", ""),
                    ev.get("severity", "info"),
                    ev.get("score_impact", 0.0)
                ))

        # 4. Insert report record if report was created
        if report_pdf_path:
            cursor.execute("""
                INSERT OR REPLACE INTO reports (
                    report_id, analysis_id, report_type, pdf_path, generated_at
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                f"REP-{analysis_id}",
                analysis_id,
                analysis_type,
                report_pdf_path,
                timestamp_iso
            ))

        # 5. Insert uploaded file record
        cursor.execute("""
            INSERT INTO uploaded_files (
                analysis_id, filename, file_type, file_size_bytes, sha256, uploaded_at
            ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            analysis_id,
            identifier,
            analysis_type,
            details.get("file_size_bytes", 0),
            details.get("sha256", ""),
            timestamp_iso
        ))
    except Exception as e:
        print(f"[Database] Relational entity insertion error: {e}")

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
