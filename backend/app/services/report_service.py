import os
import json
from datetime import datetime, timezone
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from backend.app.config import REPORTS_DIR, PROJECT_ROOT

class ReportService:
    @staticmethod
    def generate_email_pdf(analysis_id: str, data: Dict[str, Any]) -> str:
        pdf_path = REPORTS_DIR / f"report_email_{analysis_id}.pdf"
        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=12
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyDark',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#334155'),
            leading=12
        )

        elements = []

        # Header
        elements.append(Paragraph("DIGITAL FORENSIC EXAMINATION REPORT: EMAIL THREAT ANALYSIS", title_style))
        elements.append(Paragraph(f"Integrated AI and Digital Forensic Framework &bull; Case ID: <b>{analysis_id}</b> &bull; Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3b82f6'), spaceAfter=10))

        # Summary Table
        risk_color = colors.HexColor('#ef4444') if data.get('risk_level') == 'High Risk' else (colors.HexColor('#f59e0b') if data.get('risk_level') == 'Medium Risk' else colors.HexColor('#10b981'))
        summary_table_data = [
            [Paragraph("<b>Target Subject / Identifier</b>", body_style), Paragraph(str(data.get('identifier', 'Pasted Content')), body_style)],
            [Paragraph("<b>Classification</b>", body_style), Paragraph(f"<b>{data.get('prediction', 'Unknown')}</b>", body_style)],
            [Paragraph("<b>Risk Assessment</b>", body_style), Paragraph(f"<font color='{risk_color.hexval()}'><b>{data.get('risk_level', 'Unknown')} (Score: {data.get('overall_risk_score', 0)}/100)</b></font>", body_style)],
            [Paragraph("<b>ML Phishing Probability</b>", body_style), Paragraph(f"{data.get('phishing_probability', 0)*100:.2f}%", body_style)],
            [Paragraph("<b>ML Legitimate Probability</b>", body_style), Paragraph(f"{data.get('safe_probability', 0)*100:.2f}%", body_style)]
        ]
        t = Table(summary_table_data, colWidths=[160, 380])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 10))

        # Evidence Table
        elements.append(Paragraph("Forensic Evidence & Behavioral Indicators", h2_style))
        evidence_list = data.get('evidence', [])
        if evidence_list:
            ev_table_data = [[Paragraph("<b>Category</b>", body_style), Paragraph("<b>Finding</b>", body_style), Paragraph("<b>Severity</b>", body_style), Paragraph("<b>Impact</b>", body_style)]]
            for ev in evidence_list:
                ev_table_data.append([
                    Paragraph(str(ev.get('category', '')), body_style),
                    Paragraph(f"<b>{ev.get('title', '')}</b><br/>{ev.get('description', '')}", body_style),
                    Paragraph(str(ev.get('severity', '')).upper(), body_style),
                    Paragraph(f"+{ev.get('score_impact', 0)}", body_style)
                ])
            ev_table = Table(ev_table_data, colWidths=[90, 310, 70, 70])
            ev_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('PADDING', (0,0), (-1,-1), 4),
            ]))
            elements.append(ev_table)
        else:
            elements.append(Paragraph("No significant behavioral threat indicators flagged.", body_style))

        elements.append(Spacer(1, 10))

        # LIME Feature Explanation
        elements.append(Paragraph("Explainable AI (LIME Text Attribution)", h2_style))
        lime_features = data.get('lime_features', [])
        if lime_features:
            lime_str = " &bull; ".join([f"<b>{f.get('word')}</b> ({'+' if f.get('weight',0)>0 else ''}{f.get('weight'):.3f})" for f in lime_features])
            elements.append(Paragraph(f"Key vocabulary tokens influencing model prediction:<br/>{lime_str}", body_style))
        else:
            elements.append(Paragraph("LIME explanation unavailable for this sample.", body_style))

        elements.append(Spacer(1, 10))

        # Methodologies & Disclaimer
        elements.append(Paragraph("Methodology & Forensic Disclaimer", h2_style))
        disclaimer_text = (
            "This report was generated using a TF-IDF + Logistic Regression statistical pipeline alongside lexical heuristics "
            "and header analysis. Model scores represent empirical probabilities calculated on the training corpus and should not "
            "be considered absolute mathematical certainty. External checks not performed include live DNS SPF/DKIM verification "
            "and live malware sandbox execution."
        )
        elements.append(Paragraph(disclaimer_text, body_style))

        doc.build(elements)
        return f"/reports/report_email_{analysis_id}.pdf"

    @staticmethod
    def generate_image_pdf(analysis_id: str, data: Dict[str, Any]) -> str:
        pdf_path = REPORTS_DIR / f"report_image_{analysis_id}.pdf"
        doc = SimpleDocTemplate(
            str(pdf_path),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#1e293b'),
            spaceAfter=6
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#64748b'),
            spaceAfter=12
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontSize=12,
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=10,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'BodyDark',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#334155'),
            leading=12
        )

        elements = []

        # Header
        elements.append(Paragraph("DIGITAL FORENSIC EXAMINATION REPORT: IMAGE DEEPFAKE FORENSICS", title_style))
        elements.append(Paragraph(f"Integrated AI and Digital Forensic Framework &bull; Case ID: <b>{analysis_id}</b> &bull; Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#8b5cf6'), spaceAfter=10))

        # Summary Table
        summary_table_data = [
            [Paragraph("<b>Target File Name</b>", body_style), Paragraph(str(data.get('filename', 'Unknown')), body_style)],
            [Paragraph("<b>Forensic Classification</b>", body_style), Paragraph(f"<b>{data.get('prediction', 'Unknown')}</b>", body_style)],
            [Paragraph("<b>Deepfake Probability</b>", body_style), Paragraph(f"{data.get('deepfake_probability', 0)*100:.2f}%", body_style)],
            [Paragraph("<b>Authentic Probability</b>", body_style), Paragraph(f"{data.get('pristine_probability', 0)*100:.2f}%", body_style)],
            [Paragraph("<b>Image Dimensions</b>", body_style), Paragraph(f"{data.get('dimensions', [0,0])[0]} x {data.get('dimensions', [0,0])[1]} px", body_style)]
        ]
        t = Table(summary_table_data, colWidths=[160, 380])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 5),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 10))

        # EXIF Findings
        elements.append(Paragraph("EXIF Metadata Analysis", h2_style))
        exif = data.get('exif', {})
        anomalies = exif.get('anomaly_flags', [])
        anom_str = "<br/>&bull; ".join(anomalies) if anomalies else "No EXIF tampering flags detected."
        elements.append(Paragraph(f"<b>Hardware Make/Model:</b> {exif.get('make','N/A')} / {exif.get('model','N/A')}<br/><b>Software Tag:</b> {exif.get('software','None')}<br/><b>Observations:</b><br/>&bull; {anom_str}", body_style))
        elements.append(Spacer(1, 10))

        # Frequency Analysis
        elements.append(Paragraph("Frequency Domain Inspection (2D FFT & DCT)", h2_style))
        freq = data.get('frequency', {})
        freq_text = (
            f"<b>High Frequency Ratio:</b> {freq.get('high_freq_ratio', 0)*100:.2f}%<br/>"
            f"<b>Spectral Centroid:</b> {freq.get('spectral_centroid', 0)}<br/>"
            f"<b>Azimuthal Variation:</b> {freq.get('azimuthal_deviation', 0)}<br/>"
            f"<b>Summary:</b> {freq.get('analysis_summary', 'N/A')}"
        )
        elements.append(Paragraph(freq_text, body_style))
        elements.append(Spacer(1, 10))

        # Explainability & Disclaimer
        elements.append(Paragraph("Grad-CAM Explainability & Forensic Disclaimer", h2_style))
        disclaimer = (
            "Grad-CAM visual attribution highlights convolutional activation maps in the vision backbone, indicating "
            "regions that contributed most heavily toward classification. Visual heatmaps depict model attention rather "
            "than proven spatial boundaries of synthetic editing. Absence of camera EXIF is typical on compressed web platforms."
        )
        elements.append(Paragraph(disclaimer, body_style))

        doc.build(elements)
        return f"/reports/report_image_{analysis_id}.pdf"

report_service = ReportService()
