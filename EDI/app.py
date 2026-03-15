"""
app.py — Integrated Flask Backend · Portfolio Liquidity Prediction
==================================================================
Endpoints:
  GET  /health   — Liveness probe (API status + model info)
  GET  /stocks   — All unique ticker symbols
  POST /predict  — Portfolio liquidity analysis
  POST /explain  — Future liquidity prediction with AI explanation

CORS is handled via after_request hooks (no external dependency).
Run:  python app.py
"""

import os
import time
import logging
import pickle
import io
import numpy as np
import pandas as pd
from datetime import datetime
from flask import Flask, jsonify, request, g, send_file

# Import new modules
try:
    from prediction_engine import predict_future_liquidity, predict_portfolio_future
    from llm_reasoning import explain_liquidity_prediction, get_market_context
    ADVANCED_FEATURES = True
except ImportError:
    ADVANCED_FEATURES = False
    logging.warning("Advanced features not available. Install dependencies.")

# PDF report generation support
try:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import cm
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.graphics.shapes import Drawing, Rect, String
    from reportlab.graphics.charts.linecharts import HorizontalLineChart
    from reportlab.graphics.charts.piecharts import Pie
    REPORT_FEATURES = True
except ImportError:
    REPORT_FEATURES = False
    logging.warning("PDF report generation not available. Install reportlab.")

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))

# US Market
MODEL_PATH_US    = os.path.join(BASE_DIR, "model.pkl")
FEATURES_PATH_US = os.path.join(BASE_DIR, "liquidity_features.csv")
PRICES_PATH_US   = os.path.join(BASE_DIR, "cleaned_sp500.csv")

# Indian Market
MODEL_PATH_INDIA    = os.path.join(BASE_DIR, "model_india.pkl")
FEATURES_PATH_INDIA = os.path.join(BASE_DIR, "liquidity_features_india.csv")
PRICES_PATH_INDIA   = os.path.join(BASE_DIR, "cleaned_nifty.csv")

# Legacy paths (backward compatibility)
MODEL_PATH    = MODEL_PATH_US
FEATURES_PATH = FEATURES_PATH_US
PRICES_PATH   = PRICES_PATH_US

# ── Constants ──────────────────────────────────────────────────────────────────
FEATURES      = ["volume", "spread_proxy", "volatility", "amihud_ratio"]
TRADING_HOURS = 6.5          # NYSE hours per day

# ══════════════════════════════════════════════════════════════════════════════
# APP FACTORY
# ══════════════════════════════════════════════════════════════════════════════
app = Flask(__name__)


# ── CORS — allow all origins (restrict in prod) ────────────────────────────────
@app.after_request
def apply_cors(response):
    response.headers["Access-Control-Allow-Origin"]  = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

# Pre-flight OPTIONS handler for every route
@app.route("/<path:path>", methods=["OPTIONS"])
@app.route("/", methods=["OPTIONS"])
def options_handler(path=""):
    return jsonify({}), 200


# ── Request timing ─────────────────────────────────────────────────────────────
@app.before_request
def start_timer():
    g.start = time.perf_counter()

@app.after_request
def log_request(response):
    if hasattr(g, "start"):
        ms = (time.perf_counter() - g.start) * 1000
        log.info("%-6s %-20s %d  %.1fms",
                 request.method, request.path, response.status_code, ms)
    return response


# ══════════════════════════════════════════════════════════════════════════════
# STARTUP — load artifacts once for both markets
# ══════════════════════════════════════════════════════════════════════════════
def _build_lookup(features_path, prices_path) -> pd.DataFrame:
    """Merge liquidity features with close prices; return latest row per symbol."""
    log.info(f"Loading feature data from {features_path}...")
    
    if not os.path.exists(features_path):
        log.warning(f"Features file not found: {features_path}")
        return pd.DataFrame()
    
    feats  = pd.read_csv(features_path, parse_dates=["date"])
    
    if os.path.exists(prices_path):
        prices = pd.read_csv(prices_path, parse_dates=["date"])[
            ["symbol", "date", "close", "open"]
        ]
        merged = feats.merge(prices, on=["symbol", "date"], how="left")
    else:
        merged = feats
        merged['close'] = merged.get('close', 0)
        merged['open'] = merged.get('open', 0)
    
    latest = (
        merged.sort_values("date")
              .groupby("symbol")
              .last()
              .reset_index()
    )
    return latest.set_index("symbol")


def _load_model(model_path):
    """Load model artifact."""
    if not os.path.exists(model_path):
        log.warning(f"Model not found: {model_path}")
        return None, "No Model", {}
    
    with open(model_path, 'rb') as f:
        artifact = pickle.load(f)
    return artifact["model"], artifact["model_name"], artifact.get("metrics", {})


# Load US Market
log.info("Loading US market data...")
_model_us, _model_name_us, _metrics_us = _load_model(MODEL_PATH_US)
_lookup_us = _build_lookup(FEATURES_PATH_US, PRICES_PATH_US)
_all_symbols_us = sorted(_lookup_us.index.tolist()) if not _lookup_us.empty else []

if _model_us:
    log.info(f"✅  US Market Ready — {len(_all_symbols_us)} symbols · model: {_model_name_us} · R²={_metrics_us.get('R2', 0):.4f}")
else:
    log.warning("⚠  US Market model not loaded")

# Load Indian Market
log.info("Loading Indian market data...")
_model_india, _model_name_india, _metrics_india = _load_model(MODEL_PATH_INDIA)
_lookup_india = _build_lookup(FEATURES_PATH_INDIA, PRICES_PATH_INDIA)
_all_symbols_india = sorted(_lookup_india.index.tolist()) if not _lookup_india.empty else []

if _model_india:
    log.info(f"✅  Indian Market Ready — {len(_all_symbols_india)} symbols · model: {_model_name_india} · R²={_metrics_india.get('R2', 0):.4f}")
else:
    log.warning("⚠  Indian Market model not loaded")


# ══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _risk_label(score: float) -> str:
    if score >= 0.70: return "Low Risk"
    if score >= 0.50: return "Moderate Risk"
    if score >= 0.30: return "High Risk"
    return "Very High Risk"


def _fmt_time(hours: float) -> str:
    if not np.isfinite(hours):  return "N/A"
    if hours < 1 / 60:          return "< 1 minute"
    if hours < 1:               return f"{hours * 60:.0f} min"
    if hours < 24:              return f"{hours:.1f} hr{'s' if hours >= 2 else ''}"
    days = hours / TRADING_HOURS
    return f"{days:.1f} day{'s' if days >= 2 else ''}"


def _predict_score(row, model) -> float:
    X = np.array([[float(row[f]) for f in FEATURES]])
    return float(np.clip(model.predict(X)[0], 0.0, 1.0))


def _err(msg: str, code: int = 400):
    log.warning("Client error %d: %s", code, msg)
    return jsonify({"error": msg, "status": code}), code


def _to_float(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_money(value: str) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    if not value:
        return 0.0
    cleaned = str(value).replace("$", "").replace(",", "").strip()
    return _to_float(cleaned, 0.0)


def _parse_pct(value: str) -> float:
    if isinstance(value, (int, float)):
        return float(value)
    if not value:
        return 0.0
    cleaned = str(value).replace("%", "").strip()
    return _to_float(cleaned, 0.0)


def _derive_ai_sections(ai_text: str, risk_level: str, warnings: list) -> dict:
    text = (ai_text or "").strip()
    if not text:
        trend = "Portfolio liquidity is stable based on the latest computed signal."
        risk_factors = ["No AI explanation supplied. Using model-driven summary only."]
        recommendation = "Monitor concentration and rebalance if liquidity score declines."
        return {
            "summary": "This portfolio was analyzed using market microstructure features and liquidity forecasting.",
            "market_trend": trend,
            "risk_factors": risk_factors,
            "recommendation": recommendation,
        }

    sentences = [s.strip() for s in text.replace("\n", " ").split(".") if s.strip()]
    summary = sentences[0] + "." if sentences else text[:220]
    market_trend = sentences[1] + "." if len(sentences) > 1 else "Liquidity is being monitored against near-term volatility dynamics."

    risk_factors = []
    lower = text.lower()
    if "concentr" in lower:
        risk_factors.append("Portfolio concentration may elevate liquidation risk.")
    if "volatil" in lower:
        risk_factors.append("Elevated volatility can reduce execution quality.")
    if "spread" in lower or "illiquid" in lower:
        risk_factors.append("Wider spreads and thinner books may increase slippage.")
    if risk_level in ["High", "Very High", "Very High Risk"]:
        risk_factors.append("Current portfolio risk level is elevated.")
    if warnings:
        risk_factors.extend(warnings[:2])
    if not risk_factors:
        risk_factors.append("No critical liquidity risks detected from current feature set.")

    recommendation = sentences[-1] + "." if len(sentences) > 2 else "Maintain diversification and stage larger orders to reduce market impact."

    return {
        "summary": summary,
        "market_trend": market_trend,
        "risk_factors": risk_factors[:4],
        "recommendation": recommendation,
    }


def _build_report_pdf(payload: dict) -> io.BytesIO:
    user_name = payload.get("user_name") or "Analyst"
    market = payload.get("market") or "US"
    portfolio_result = payload.get("portfolio_result") or {}
    ai = payload.get("ai_insights") or {}
    warnings = portfolio_result.get("warnings") or payload.get("warnings") or []
    assets = portfolio_result.get("assets") or []

    liquidity_score = _to_float(portfolio_result.get("liquidity_score"), 0.0)
    risk_level = portfolio_result.get("risk_level") or "Moderate"
    liquidation_time = portfolio_result.get("estimated_liquidation_time") or "N/A"
    portfolio_value = portfolio_result.get("portfolio_value") or "$0.00"
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    ai_sections = _derive_ai_sections(ai.get("ai_explanation", ""), risk_level, warnings)
    forecast_points = [
        max(0.0, min(1.0, _to_float(ai.get("current_liquidity"), liquidity_score))),
        max(0.0, min(1.0, _to_float(ai.get("predicted_liquidity_tomorrow"), liquidity_score))),
        max(0.0, min(1.0, _to_float(ai.get("predicted_liquidity_3_days"), liquidity_score))),
        max(0.0, min(1.0, _to_float(ai.get("predicted_liquidity_7_days"), liquidity_score))),
    ]

    avg_spread = np.mean([_to_float(a.get("spread_proxy")) for a in assets]) if assets else 0.0
    avg_amihud = np.mean([_to_float(a.get("amihud_ratio")) for a in assets]) if assets else 0.0
    avg_volatility = np.mean([_to_float(a.get("volatility")) for a in assets]) if assets else 0.0
    market_depth = sum([_to_float(a.get("value")) for a in assets]) * max(liquidity_score, 0.01)
    slippage_est = _parse_pct(portfolio_result.get("price_impact", "0%")) * max(1.0 - liquidity_score, 0.15)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=1.5 * cm,
        leftMargin=1.5 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.4 * cm,
        title="Portfolio Liquidity Analysis Report",
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=18, textColor=colors.HexColor("#111827"), spaceAfter=8)
    section_style = ParagraphStyle("Section", parent=styles["Heading2"], fontSize=12, textColor=colors.HexColor("#0F172A"), spaceBefore=8, spaceAfter=6)
    body_style = ParagraphStyle("Body", parent=styles["BodyText"], fontSize=9.5, leading=14, textColor=colors.HexColor("#1F2937"))
    small_style = ParagraphStyle("Small", parent=styles["BodyText"], fontSize=8.5, leading=12, textColor=colors.HexColor("#4B5563"))

    story = []

    story.append(Paragraph("Portfolio Liquidity Analysis Report", title_style))
    story.append(Paragraph("EXECUTIVE SUMMARY", section_style))

    executive = [
        ["User Name", user_name, "Market", market],
        ["Date Generated", generated_at, "Portfolio Value", portfolio_value],
        ["Liquidity Score", f"{liquidity_score * 100:.1f}/100", "Risk Level", risk_level],
        ["Estimated Liquidation Time", liquidation_time, "Model Used", portfolio_result.get("model_used", "ML Model")],
    ]
    exec_tbl = Table(executive, colWidths=[3.2 * cm, 6.1 * cm, 3.2 * cm, 5.0 * cm])
    exec_tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E2E8F0")),
        ("BACKGROUND", (0, 2), (-1, 2), colors.HexColor("#F1F5F9")),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(exec_tbl)
    story.append(Spacer(1, 8))
    story.append(Paragraph(f"<b>AI Summary:</b> {ai_sections['summary']}", body_style))

    story.append(Paragraph("PORTFOLIO COMPOSITION TABLE", section_style))
    comp_data = [["Symbol", "Shares", "Price", "Portfolio Value", "Portfolio Weight", "Liquidity Score"]]
    for a in assets:
        comp_data.append([
            str(a.get("symbol", "-")),
            str(a.get("qty", 0)),
            f"${_to_float(a.get('close')):,.2f}",
            f"${_to_float(a.get('value')):,.2f}",
            f"{_to_float(a.get('weight')) * 100:.1f}%",
            f"{_to_float(a.get('liquidity_score')) * 100:.1f}",
        ])
    comp_tbl = Table(comp_data, repeatRows=1, colWidths=[2.3 * cm, 2.0 * cm, 2.5 * cm, 3.1 * cm, 3.1 * cm, 2.8 * cm])
    comp_tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(comp_tbl)

    story.append(Paragraph("ADVANCED LIQUIDITY METRICS", section_style))
    metrics_rows = [
        ["Bid Ask Spread", f"{avg_spread:.6f}", "Average spread proxy across holdings."],
        ["Amihud Illiquidity Ratio", f"{avg_amihud:.6f}", "Price impact sensitivity to traded volume."],
        ["Market Depth", f"${market_depth:,.0f}", "Estimated executable depth based on position size and score."],
        ["Volume Volatility", f"{avg_volatility:.6f}", "Cross-asset volatility proxy for execution risk."],
        ["Slippage Estimate", f"{slippage_est:.2f}%", "Expected slippage under current liquidity conditions."],
    ]
    metrics_tbl = Table([["Metric Name", "Value", "Short Explanation"]] + metrics_rows, repeatRows=1, colWidths=[4.4 * cm, 2.9 * cm, 8.5 * cm])
    metrics_tbl.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    story.append(metrics_tbl)

    story.append(Paragraph("VISUAL ANALYSIS CHARTS", section_style))

    # Liquidity score bar (0-100)
    gauge = Drawing(460, 45)
    gauge.add(Rect(0, 18, 320, 12, strokeColor=colors.HexColor("#1E293B"), fillColor=colors.HexColor("#E2E8F0")))
    gauge.add(Rect(0, 18, max(0, min(320, liquidity_score * 320)), 12, strokeColor=None, fillColor=colors.HexColor("#0EA5E9")))
    gauge.add(String(0, 34, "Liquidity Score Visualization (0-100)", fontSize=8, fillColor=colors.HexColor("#334155")))
    gauge.add(String(328, 20, f"{liquidity_score * 100:.1f}", fontSize=9, fillColor=colors.HexColor("#0F172A")))
    story.append(gauge)

    # Forecast line chart
    line_drawing = Drawing(460, 150)
    line = HorizontalLineChart()
    line.x = 45
    line.y = 30
    line.height = 90
    line.width = 320
    line.data = [[round(v * 100, 2) for v in forecast_points]]
    line.categoryAxis.categoryNames = ["Today", "Tomorrow", "3 Days", "7 Days"]
    line.valueAxis.valueMin = 0
    line.valueAxis.valueMax = 100
    line.valueAxis.valueStep = 20
    line.lines[0].strokeColor = colors.HexColor("#0284C7")
    line.lines[0].strokeWidth = 2
    line_drawing.add(String(0, 130, "Liquidity Forecast Chart", fontSize=8, fillColor=colors.HexColor("#334155")))
    line_drawing.add(line)
    story.append(line_drawing)

    # Portfolio allocation donut/pie chart
    pie_drawing = Drawing(460, 165)
    pie = Pie()
    pie.x = 45
    pie.y = 10
    pie.width = 180
    pie.height = 130
    pie.sideLabels = True
    pie.data = [max(0.1, _to_float(a.get("weight"), 0.0) * 100) for a in assets[:8]] or [100]
    pie.labels = [str(a.get("symbol")) for a in assets[:8]] or ["No Data"]
    palette = [
        colors.HexColor("#0EA5E9"), colors.HexColor("#06B6D4"), colors.HexColor("#14B8A6"),
        colors.HexColor("#22C55E"), colors.HexColor("#84CC16"), colors.HexColor("#F59E0B"),
        colors.HexColor("#F97316"), colors.HexColor("#EF4444"),
    ]
    for i in range(len(pie.data)):
        pie.slices[i].fillColor = palette[i % len(palette)]
    pie_drawing.add(String(0, 145, "Portfolio Allocation Chart", fontSize=8, fillColor=colors.HexColor("#334155")))
    pie_drawing.add(pie)
    story.append(pie_drawing)

    story.append(Paragraph("AI LIQUIDITY INSIGHTS", section_style))
    story.append(Paragraph(f"<b>Market Trend:</b> {ai_sections['market_trend']}", body_style))
    risk_bullets = "<br/>".join([f"• {r}" for r in ai_sections["risk_factors"]])
    story.append(Paragraph(f"<b>Risk Factors:</b><br/>{risk_bullets}", body_style))
    story.append(Paragraph(f"<b>Recommendation:</b> {ai_sections['recommendation']}", body_style))

    story.append(Paragraph("RISK WARNINGS", section_style))
    if warnings:
        for w in warnings:
            story.append(Paragraph(f"• {w}", small_style))
    else:
        story.append(Paragraph("No explicit warnings reported by the current analysis run.", small_style))

    def _footer(canvas, _doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
        canvas.line(1.5 * cm, 1.0 * cm, A4[0] - 1.5 * cm, 1.0 * cm)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#64748B"))
        canvas.drawString(1.5 * cm, 0.62 * cm, "Generated by LiquidityAI | Portfolio Liquidity Intelligence System")
        canvas.drawRightString(A4[0] - 1.5 * cm, 0.62 * cm, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        canvas.restoreState()

    doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
    buf.seek(0)
    return buf


# ══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/health", methods=["GET"])
@app.route("/",       methods=["GET"])
def health():
    """Liveness probe — tells the React app the backend is up."""
    market = request.args.get('market', 'US').upper()
    
    if market == "INDIA":
        return jsonify({
            "status":       "ok" if _model_india else "no_model",
            "market":       "INDIA",
            "model":        _model_name_india,
            "model_r2":     round(_metrics_india.get("R2", 0), 4),
            "model_mae":    round(_metrics_india.get("MAE", 0), 6),
            "symbols_count": len(_all_symbols_india),
            "features":     FEATURES,
        })
    else:
        return jsonify({
            "status":       "ok" if _model_us else "no_model",
            "market":       "US",
            "model":        _model_name_us,
            "model_r2":     round(_metrics_us.get("R2", 0), 4),
            "model_mae":    round(_metrics_us.get("MAE", 0), 6),
            "symbols_count": len(_all_symbols_us),
            "features":     FEATURES,
        })


@app.route("/stocks", methods=["GET"])
def get_stocks():
    """Return all unique ticker symbols available for analysis."""
    market = request.args.get('market', 'US').upper()
    
    if market == "INDIA":
        return jsonify({
            "market":  "INDIA",
            "count":   len(_all_symbols_india),
            "symbols": _all_symbols_india,
        })
    else:
        return jsonify({
            "market":  "US",
            "count":   len(_all_symbols_us),
            "symbols": _all_symbols_us,
        })


@app.route("/predict", methods=["POST"])
def predict():
    """
    Main prediction endpoint.

    Request:
        POST /predict
        Content-Type: application/json
        { 
          "portfolio": [{"symbol": "AAPL", "qty": 50}, ...],
          "market": "US"  // or "INDIA" (optional, defaults to US)
        }

    Response:
        {
          "market": "US",
          "liquidity_score":     0.73,
          "risk_level":         "Moderate Risk",
          "liquidation_time":   "1.5 hrs",
          "price_impact":       "2.3%",
          "most_illiquid_asset":"XYZ",
          "portfolio_value":    "$152,000.00",
          "model_used":         "Gradient Boosting",
          "asset_breakdown":    [...],
          "warnings":           [...]   // optional
        }
    """

    # ── 1. Parse + validate ────────────────────────────────────────────────────
    body = request.get_json(silent=True)
    if not body:
        return _err("Request body must be valid JSON with Content-Type: application/json")

    portfolio = body.get("portfolio")
    market = body.get("market", "US").upper()
    
    # Select appropriate model and lookup based on market
    if market == "INDIA":
        model = _model_india
        model_name = _model_name_india
        lookup = _lookup_india
        if model is None:
            return _err("Indian market model not available. Run setup for INDIA market.", 503)
    else:
        model = _model_us
        model_name = _model_name_us
        lookup = _lookup_us
        if model is None:
            return _err("US market model not available. Run setup for US market.", 503)
    if not portfolio or not isinstance(portfolio, list):
        return _err("'portfolio' must be a non-empty list of {symbol, qty} objects.")
    if len(portfolio) > 50:
        return _err("Maximum 50 positions per request.")

    validated = []
    for i, item in enumerate(portfolio):
        if not isinstance(item, dict):
            return _err(f"Item {i}: expected an object, got {type(item).__name__}.")
        sym = item.get("symbol")
        qty = item.get("qty")
        if not sym or not isinstance(sym, str) or not sym.strip():
            return _err(f"Item {i}: 'symbol' must be a non-empty string.")
        if qty is None or not isinstance(qty, (int, float)) or qty <= 0:
            return _err(f"Item {i} ({sym}): 'qty' must be a positive number.")
        validated.append({"symbol": sym.strip().upper(), "qty": float(qty)})

    # Deduplicate (sum qty for repeated symbols)
    seen = {}
    for h in validated:
        seen[h["symbol"]] = seen.get(h["symbol"], 0) + h["qty"]
    validated = [{"symbol": s, "qty": q} for s, q in seen.items()]

    # ── 2. Fetch latest features ───────────────────────────────────────────────
    records, missing = [], []

    for holding in validated:
        sym = holding["symbol"]
        qty = holding["qty"]

        if sym not in lookup.index:
            missing.append(sym)
            continue

        row   = lookup.loc[sym]
        close = row.get("close", row.get("open", np.nan))
        if pd.isna(close):
            missing.append(sym)
            continue

        close            = float(close)
        position_value   = qty * close
        daily_volume_usd = float(row["volume"]) * close

        # ── 3. Predict ─────────────────────────────────────────────────────────
        liq_score      = _predict_score(row, model)
        liq_time_hours = (
            (position_value / daily_volume_usd) * TRADING_HOURS
            if daily_volume_usd > 0 else float("inf")
        )

        records.append({
            "symbol":           sym,
            "qty":              qty,
            "close":            round(close, 4),
            "position_value":   round(position_value, 2),
            "daily_volume_usd": round(daily_volume_usd, 2),
            "liquidity_score":  round(liq_score, 4),
            "liq_time_hours":   liq_time_hours,
            "spread_proxy":     round(float(row["spread_proxy"]), 6),
            "volatility":       round(float(row["volatility"]),   6),
            "amihud_ratio":     round(float(row["amihud_ratio"]),  6),
        })

    if not records:
        return _err(
            f"None of the provided symbols were found in the dataset. "
            f"Unknown: {', '.join(missing)}",
            code=404
        )

    # ── 4. Portfolio-level aggregation ─────────────────────────────────────────
    df              = pd.DataFrame(records)
    total_value     = df["position_value"].sum()
    df["weight"]    = df["position_value"] / total_value
    total_vol_usd   = df["daily_volume_usd"].sum()

    portfolio_score = float((df["liquidity_score"] * df["weight"]).sum())
    liq_hours       = (
        (total_value / total_vol_usd) * TRADING_HOURS
        if total_vol_usd > 0 else float("inf")
    )
    price_impact_pct = (
        (total_value / total_vol_usd) * 100
        if total_vol_usd > 0 else float("inf")
    )
    most_illiquid = df.loc[df["liquidity_score"].idxmin(), "symbol"]

    # ── 5. Build response ──────────────────────────────────────────────────────
    breakdown = []
    for _, r in df.iterrows():
        breakdown.append({
            "symbol":           r["symbol"],
            "qty":              int(r["qty"]),
            "close":            r["close"],
            "position_value":   r["position_value"],
            "weight":           f"{r['weight'] * 100:.1f}%",
            "weight_num":       round(float(r["weight"]) * 100, 1),
            "liquidity_score":  r["liquidity_score"],
            "risk_level":       _risk_label(r["liquidity_score"]),
            "liquidation_time": _fmt_time(r["liq_time_hours"]),
            "spread_proxy":     r["spread_proxy"],
            "volatility":       r["volatility"],
            "amihud_ratio":     r["amihud_ratio"],
        })

    warnings = []
    if missing:
        warnings.append(f"Symbols not found (skipped): {', '.join(missing)}")
    very_illiquid = df[df["liquidity_score"] < 0.30]["symbol"].tolist()
    if very_illiquid:
        warnings.append(f"Very illiquid positions: {', '.join(very_illiquid)}")
    if np.isfinite(price_impact_pct) and price_impact_pct > 5:
        warnings.append(
            f"High market impact ({price_impact_pct:.1f}%) — order may move prices."
        )

    response = {
        "market":             market,
        "liquidity_score":    round(portfolio_score, 4),
        "risk_level":         _risk_label(portfolio_score),
        "liquidation_time":   _fmt_time(liq_hours),
        "price_impact":       f"{price_impact_pct:.2f}%" if np.isfinite(price_impact_pct) else "N/A",
        "most_illiquid_asset": most_illiquid,
        "portfolio_value":    f"${total_value:,.2f}",
        "total_positions":    len(df),
        "model_used":         model_name,
        "asset_breakdown":    breakdown,
    }
    if warnings:
        response["warnings"] = warnings

    return jsonify(response)


@app.route("/explain", methods=["POST"])
def explain():
    """
    Future liquidity prediction with AI explanation.
    
    Request:
        POST /explain
        Content-Type: application/json
        {
          "symbol": "AAPL"  // single stock
          OR
          "portfolio": [{"symbol": "AAPL", "qty": 50}, ...]  // portfolio
        }
    
    Response:
        {
          "symbol": "AAPL",
          "current_liquidity": 0.75,
          "predicted_liquidity_tomorrow": 0.73,
          "predicted_liquidity_3_days": 0.70,
          "predicted_liquidity_7_days": 0.68,
          "ai_explanation": "Liquidity is expected to decline...",
          "market_context": {...}
        }
    """
    if not ADVANCED_FEATURES:
        return _err("Advanced prediction features not available. Run pipeline setup first.", 503)
    
    # ── 1. Parse request ───────────────────────────────────────────────────────
    body = request.get_json(silent=True)
    if not body:
        return _err("Request body must be valid JSON")
    
    symbol = body.get("symbol")
    portfolio = body.get("portfolio")
    market = body.get("market", "US").upper()
    
    if not symbol and not portfolio:
        return _err("Either 'symbol' or 'portfolio' must be provided")
    
    try:
        # ── 2. Single stock prediction ────────────────────────────────────────
        if symbol:
            log.info(f"Generating explanation for {symbol} ({market} market)")
            
            # Get future predictions
            prediction = predict_future_liquidity(symbol, market)
            
            # Get market context
            context = get_market_context(symbol, market, days_back=30)
            
            # Generate AI explanation
            explanation = explain_liquidity_prediction(
                prediction, 
                market_context=context,
                use_llm=True
            )
            
            # Build response
            preds = prediction['predictions']
            response = {
                "symbol": symbol,
                "current_liquidity": prediction['current_liquidity'],
                "predicted_liquidity_tomorrow": preds['t_plus_1']['predicted_liquidity'],
                "predicted_liquidity_3_days": preds['t_plus_3']['predicted_liquidity'],
                "predicted_liquidity_7_days": preds['t_plus_7']['predicted_liquidity'],
                "ai_explanation": explanation,
                "market_context": context,
                "prediction_details": prediction
            }
        
        # ── 3. Portfolio prediction ───────────────────────────────────────────
        else:
            log.info(f"Generating explanation for portfolio ({len(portfolio)} positions, {market} market)")
            
            # Validate portfolio
            if not isinstance(portfolio, list) or len(portfolio) == 0:
                return _err("'portfolio' must be a non-empty list")
            
            # Get portfolio predictions
            prediction = predict_portfolio_future(portfolio, market)
            
            # Generate explanation
            explanation = explain_liquidity_prediction(
                {
                    'symbol': 'Portfolio',
                    'current_liquidity': prediction['current_liquidity'],
                    'predictions': prediction['predictions']
                },
                market_context=None,
                use_llm=True
            )
            
            # Build response
            preds = prediction['predictions']
            response = {
                "portfolio_size": prediction['portfolio_size'],
                "current_liquidity": prediction['current_liquidity'],
                "predicted_liquidity_tomorrow": preds['t_plus_1']['predicted_liquidity'],
                "predicted_liquidity_3_days": preds['t_plus_3']['predicted_liquidity'],
                "predicted_liquidity_7_days": preds['t_plus_7']['predicted_liquidity'],
                "ai_explanation": explanation,
                "asset_predictions": prediction.get('asset_predictions', [])
            }
        
        return jsonify(response)
    
    except ValueError as e:
        return _err(str(e), 404)
    except Exception as e:
        log.error(f"Explanation generation failed: {e}", exc_info=True)
        return _err(f"Prediction failed: {str(e)}", 500)


@app.route("/generate-liquidity-report", methods=["POST"])
def generate_liquidity_report():
    """
    Generate downloadable portfolio liquidity report in PDF format.

    Request:
      {
        "user_name": "Ashis",
        "market": "US",
        "portfolio_result": {...predict response mapped by frontend...},
        "ai_insights": {...explain response...}
      }
    """
    if not REPORT_FEATURES:
        return _err("PDF report features unavailable. Install reportlab in backend environment.", 503)

    body = request.get_json(silent=True)
    if not body:
        return _err("Request body must be valid JSON")

    portfolio_result = body.get("portfolio_result")
    if not portfolio_result or not isinstance(portfolio_result, dict):
        return _err("'portfolio_result' is required and must be an object")

    try:
        pdf_bytes = _build_report_pdf(body)
        market = str(body.get("market", "US")).upper()
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"liquidity_report_{market.lower()}_{stamp}.pdf"
        return send_file(
            pdf_bytes,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename,
        )
    except Exception as e:
        log.error("Report generation failed: %s", str(e), exc_info=True)
        return _err(f"Failed to generate report: {str(e)}", 500)


# ══════════════════════════════════════════════════════════════════════════════
# ERROR HANDLERS
# ══════════════════════════════════════════════════════════════════════════════

@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found.", "status": 404}), 404

@app.errorhandler(405)
def method_not_allowed(e):
    return jsonify({"error": "Method not allowed.", "status": 405}), 405

@app.errorhandler(500)
def server_error(e):
    log.error("Unhandled exception: %s", str(e))
    return jsonify({"error": "Internal server error.", "detail": str(e), "status": 500}), 500


# ══════════════════════════════════════════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    log.info("Starting Flask on http://0.0.0.0:5000")
    app.run(debug=True, host="0.0.0.0", port=5000, use_reloader=False)