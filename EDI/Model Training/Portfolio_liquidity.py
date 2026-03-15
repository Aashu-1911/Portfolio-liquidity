"""
portfolio_liquidity.py
======================
Calculates portfolio-level liquidity metrics using a pre-trained ML model.

Usage
-----
from portfolio_liquidity import analyze_portfolio

result = analyze_portfolio({
    "portfolio": [
        {"symbol": "AAPL", "qty": 50},
        {"symbol": "MSFT", "qty": 30}
    ]
})
print(result)
"""

import pickle
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings("ignore")

# ── Paths ──────────────────────────────────────────────────────────────────────
MODEL_PATH    = "model.pkl"
FEATURES_PATH = "liquidity_features.csv"
PRICES_PATH   = "cleaned_sp500.csv"

# ── Constants ──────────────────────────────────────────────────────────────────
TRADING_HOURS_PER_DAY = 6.5          # NYSE hours
FEATURES = ["volume", "spread_proxy", "volatility", "amihud_ratio"]


# ══════════════════════════════════════════════════════════════════════════════
# INTERNAL HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def _load_artifacts():
    """Load model and feature data once; cache in module-level dict."""
    if not hasattr(_load_artifacts, "_cache"):
        with open(MODEL_PATH, 'rb') as f:
            artifact = pickle.load(f)
        features_df = pd.read_csv(FEATURES_PATH, parse_dates=["date"])
        prices_df   = pd.read_csv(PRICES_PATH,   parse_dates=["date"])[["symbol", "date", "close"]]

        # Merge close price into features
        features_df = features_df.merge(prices_df, on=["symbol", "date"], how="left")

        # Pre-build a lookup: symbol → latest row
        latest = (
            features_df
            .sort_values("date")
            .groupby("symbol")
            .last()
            .reset_index()
        )
        _load_artifacts._cache = {
            "model":      artifact["model"],
            "model_name": artifact["model_name"],
            "latest":     latest.set_index("symbol"),
            "features_df": features_df,
        }
    return _load_artifacts._cache


def _risk_label(score: float) -> str:
    if score >= 0.70:
        return "Low Risk"
    elif score >= 0.50:
        return "Moderate Risk"
    elif score >= 0.30:
        return "High Risk"
    else:
        return "Very High Risk"


def _fmt_time(hours: float) -> str:
    """Format decimal hours into human-readable string."""
    if hours < 1/60:
        return "< 1 minute"
    elif hours < 1:
        minutes = hours * 60
        return f"{minutes:.0f} minute{'s' if minutes >= 2 else ''}"
    elif hours < 24:
        return f"{hours:.1f} hour{'s' if hours >= 2 else ''}"
    else:
        days = hours / TRADING_HOURS_PER_DAY
        return f"{days:.1f} trading day{'s' if days >= 2 else ''}"


# ══════════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════════

def analyze_portfolio(portfolio_input: dict) -> dict:
    """
    Analyze portfolio liquidity using the trained ML model.

    Parameters
    ----------
    portfolio_input : dict
        {
            "portfolio": [
                {"symbol": "AAPL", "qty": 50},
                ...
            ]
        }

    Returns
    -------
    dict with keys:
        liquidity_score, risk_level, estimated_liquidation_time,
        price_impact, most_illiquid_asset, asset_breakdown
    """
    cache   = _load_artifacts()
    model   = cache["model"]
    latest  = cache["latest"]
    holdings = portfolio_input.get("portfolio", [])

    if not holdings:
        raise ValueError("Portfolio is empty.")

    # ── Per-asset analysis ─────────────────────────────────────────────────────
    asset_records = []
    missing = []

    for holding in holdings:
        symbol = holding["symbol"].upper()
        qty    = float(holding["qty"])

        if symbol not in latest.index:
            missing.append(symbol)
            continue

        row = latest.loc[symbol]

        # Latest close price (use open as fallback)
        close = row.get("close", row.get("open", np.nan))
        if pd.isna(close):
            missing.append(symbol)
            continue

        position_value    = qty * close
        avg_daily_volume  = float(row["volume"])          # already the latest-day volume
        daily_volume_usd  = avg_daily_volume * close

        # Build feature vector and predict
        feat_vec = np.array([[row[f] for f in FEATURES]])
        liq_score = float(model.predict(feat_vec)[0])
        liq_score = float(np.clip(liq_score, 0.0, 1.0))

        # Single-asset liquidation time (hours) = position_value / daily_value_traded * hours/day
        liq_time_hours = (
            (position_value / daily_volume_usd) * TRADING_HOURS_PER_DAY
            if daily_volume_usd > 0 else np.inf
        )

        asset_records.append({
            "symbol":           symbol,
            "qty":              qty,
            "close":            round(close, 4),
            "position_value":   round(position_value, 2),
            "liquidity_score":  round(liq_score, 4),
            "daily_volume_usd": round(daily_volume_usd, 2),
            "liq_time_hours":   liq_time_hours,
            # raw features for reference
            "spread_proxy":     round(float(row["spread_proxy"]), 6),
            "volatility":       round(float(row["volatility"]),   6),
            "amihud_ratio":     round(float(row["amihud_ratio"]),  6),
        })

    if not asset_records:
        raise ValueError(
            f"None of the requested symbols were found in the dataset. "
            f"Missing: {missing}"
        )

    df = pd.DataFrame(asset_records)
    total_value          = df["position_value"].sum()
    df["weight"]         = df["position_value"] / total_value

    # ── Portfolio liquidity score (value-weighted average) ─────────────────────
    portfolio_liq_score  = float((df["liquidity_score"] * df["weight"]).sum())

    # ── Liquidation time ───────────────────────────────────────────────────────
    # Weighted harmonic-mean-like: time needed to unwind whole portfolio
    total_daily_vol_usd  = df["daily_volume_usd"].sum()
    liquidation_hours    = (
        (total_value / total_daily_vol_usd) * TRADING_HOURS_PER_DAY
        if total_daily_vol_usd > 0 else np.inf
    )

    # ── Price impact (Amihud-based) ────────────────────────────────────────────
    # price_impact = portfolio_value / total_market_volume  (in %)
    total_market_volume  = df["daily_volume_usd"].sum()
    price_impact_pct     = (
        (total_value / total_market_volume) * 100
        if total_market_volume > 0 else np.inf
    )

    # ── Most illiquid asset ────────────────────────────────────────────────────
    most_illiquid_row    = df.loc[df["liquidity_score"].idxmin()]
    most_illiquid_symbol = most_illiquid_row["symbol"]

    # ── Per-asset breakdown (clean output) ────────────────────────────────────
    breakdown = []
    for _, r in df.iterrows():
        breakdown.append({
            "symbol":          r["symbol"],
            "qty":             int(r["qty"]),
            "close":           r["close"],
            "position_value":  r["position_value"],
            "weight":          f"{r['weight']*100:.1f}%",
            "liquidity_score": r["liquidity_score"],
            "risk_level":      _risk_label(r["liquidity_score"]),
            "est_liq_time":    _fmt_time(r["liq_time_hours"]),
        })

    # ── Warnings ───────────────────────────────────────────────────────────────
    warnings_list = []
    if missing:
        warnings_list.append(f"Symbols not found in dataset (skipped): {', '.join(missing)}")
    low_liq = df[df["liquidity_score"] < 0.30]["symbol"].tolist()
    if low_liq:
        warnings_list.append(f"Very illiquid positions detected: {', '.join(low_liq)}")
    if price_impact_pct > 5:
        warnings_list.append(
            f"High price impact ({price_impact_pct:.1f}%) — portfolio may move the market."
        )

    return {
        "liquidity_score":             round(portfolio_liq_score, 4),
        "risk_level":                  _risk_label(portfolio_liq_score),
        "estimated_liquidation_time":  _fmt_time(liquidation_hours),
        "price_impact":                f"{price_impact_pct:.2f}%",
        "most_illiquid_asset":         most_illiquid_symbol,
        "portfolio_value":             f"${total_value:,.2f}",
        "total_daily_market_volume":   f"${total_market_volume:,.0f}",
        "asset_breakdown":             breakdown,
        "model_used":                  cache["model_name"],
        **({"warnings": warnings_list} if warnings_list else {}),
    }


# ══════════════════════════════════════════════════════════════════════════════
# CLI / DEMO
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import json

    # ── Test portfolios ────────────────────────────────────────────────────────
    test_portfolios = [
        {
            "name": "Large-Cap Blue Chips",
            "input": {
                "portfolio": [
                    {"symbol": "AAPL", "qty": 500},
                    {"symbol": "MSFT", "qty": 300},
                    {"symbol": "JPM",  "qty": 200},
                    {"symbol": "JNJ",  "qty": 150},
                ]
            }
        },
        {
            "name": "Mixed Liquidity Portfolio",
            "input": {
                "portfolio": [
                    {"symbol": "AAPL", "qty": 50},
                    {"symbol": "MSFT", "qty": 30},
                    {"symbol": "CHK",  "qty": 1000},   # volatile energy
                    {"symbol": "FRT",  "qty": 40},     # low-liquidity REIT
                ]
            }
        },
        {
            "name": "Concentrated High-Risk",
            "input": {
                "portfolio": [
                    {"symbol": "AMD",  "qty": 2000},
                    {"symbol": "FCX",  "qty": 1500},
                ]
            }
        },
    ]

    separator = "═" * 62

    for test in test_portfolios:
        print(f"\n{separator}")
        print(f"  PORTFOLIO: {test['name']}")
        print(separator)

        result = analyze_portfolio(test["input"])

        # Top-level metrics
        print(f"\n  📊 Liquidity Score         : {result['liquidity_score']}")
        print(f"  ⚠️  Risk Level              : {result['risk_level']}")
        print(f"  ⏱️  Est. Liquidation Time   : {result['estimated_liquidation_time']}")
        print(f"  📉 Price Impact            : {result['price_impact']}")
        print(f"  🔴 Most Illiquid Asset     : {result['most_illiquid_asset']}")
        print(f"  💼 Portfolio Value         : {result['portfolio_value']}")
        print(f"  🤖 Model Used              : {result['model_used']}")

        if "warnings" in result:
            print(f"\n  ⚡ Warnings:")
            for w in result["warnings"]:
                print(f"     • {w}")

        # Per-asset breakdown
        print(f"\n  {'Symbol':<8} {'Qty':>6}  {'Close':>8}  {'Value':>12}  {'Wt':>6}  {'Score':>7}  {'Risk':<16}  {'Liq.Time'}")
        print(f"  {'-'*7}  {'-'*6}  {'-'*8}  {'-'*12}  {'-'*6}  {'-'*7}  {'-'*16}  {'-'*12}")
        for a in result["asset_breakdown"]:
            print(
                f"  {a['symbol']:<8} {a['qty']:>6}  "
                f"${a['close']:>7.2f}  "
                f"${a['position_value']:>11,.2f}  "
                f"{a['weight']:>6}  "
                f"{a['liquidity_score']:>7.4f}  "
                f"{a['risk_level']:<16}  "
                f"{a['est_liq_time']}"
            )

    print(f"\n{separator}")
    print("  ✅  Module test complete.")
    print(separator)