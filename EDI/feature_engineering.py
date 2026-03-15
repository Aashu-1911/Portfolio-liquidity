"""
feature_engineering.py — Liquidity Feature Computation
=======================================================
Computes liquidity features from raw stock data.
Extends existing liquidity_features.py with automated pipeline support.

Features computed:
  - spread_proxy: (high - low) / close
  - volatility: 30-day rolling std of returns
  - amihud_ratio: |return| / volume (illiquidity measure)
  - liquidity_score: composite score (0-1)
"""

import os
import pandas as pd
import numpy as np
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CLEANED_DATA_PATH = os.path.join(BASE_DIR, "cleaned_sp500.csv")
FEATURES_OUTPUT_PATH = os.path.join(BASE_DIR, "liquidity_features.csv")


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE COMPUTATION
# ══════════════════════════════════════════════════════════════════════════════

def compute_liquidity_features(df, save=True):
    """
    Compute liquidity features from cleaned stock data.
    
    Parameters
    ----------
    df : pd.DataFrame
        Cleaned stock data with columns: symbol, date, open, high, low, close, volume
    save : bool
        Whether to save output to CSV
    
    Returns
    -------
    pd.DataFrame
        Features with columns: symbol, date, volume, spread_proxy, volatility, 
        amihud_ratio, liquidity_score
    """
    log.info("Computing liquidity features...")
    log.info(f"Input shape: {df.shape}")
    
    # Ensure sorted
    df = df.sort_values(['symbol', 'date']).reset_index(drop=True)
    
    # ── 1. Spread Proxy ────────────────────────────────────────────────────────
    df['spread_proxy'] = (df['high'] - df['low']) / df['close']
    
    # ── 2. Daily Returns ───────────────────────────────────────────────────────
    df['daily_return'] = df.groupby('symbol')['close'].transform(lambda x: x.pct_change())
    
    # ── 3. Volatility (30-day rolling std) ────────────────────────────────────
    df['volatility'] = df.groupby('symbol')['daily_return'].transform(
        lambda x: x.rolling(window=30, min_periods=5).std()
    )
    
    # ── 4. Amihud Illiquidity Ratio ────────────────────────────────────────────
    df['amihud_ratio'] = (
        df['daily_return'].abs() / df['volume'].replace(0, np.nan)
    ) * 1e6
    
    # ── 5. Normalize features per stock (min-max scaling) ─────────────────────
    def minmax_scale(series):
        mn, mx = series.min(), series.max()
        if mx == mn or pd.isna(mn) or pd.isna(mx):
            return pd.Series(0.5, index=series.index)
        return (series - mn) / (mx - mn)
    
    log.info("Normalizing features per stock...")
    df['norm_volume'] = df.groupby('symbol')['volume'].transform(minmax_scale)
    df['norm_spread'] = df.groupby('symbol')['spread_proxy'].transform(minmax_scale)
    df['norm_volatility'] = df.groupby('symbol')['volatility'].transform(minmax_scale)
    df['norm_amihud'] = df.groupby('symbol')['amihud_ratio'].transform(minmax_scale)
    
    # ── 6. Composite Liquidity Score ──────────────────────────────────────────
    # High volume → more liquid (+)
    # Low spread → more liquid (1 - spread)
    # Low volatility → more liquid (1 - volatility)
    # Low amihud → more liquid (1 - amihud)
    
    df['liquidity_score'] = (
        0.4 * df['norm_volume'] +
        0.3 * (1 - df['norm_spread']) +
        0.2 * (1 - df['norm_volatility']) +
        0.1 * (1 - df['norm_amihud'])
    )
    
    # Clip to [0, 1]
    df['liquidity_score'] = df['liquidity_score'].clip(0, 1)
    
    # ── 7. Select output columns ──────────────────────────────────────────────
    output_cols = [
        'symbol', 'date', 'volume', 'spread_proxy', 
        'volatility', 'amihud_ratio', 'liquidity_score'
    ]
    result = df[output_cols].copy()
    
    # Drop rows with NaN in critical features
    before = len(result)
    result = result.dropna(subset=['volatility', 'amihud_ratio', 'liquidity_score'])
    after = len(result)
    
    if before > after:
        log.info(f"Dropped {before - after} rows with NaN values")
    
    log.info(f"Output shape: {result.shape}")
    
    # ── 8. Save ────────────────────────────────────────────────────────────────
    if save:
        result.to_csv(FEATURES_OUTPUT_PATH, index=False)
        log.info(f"✓ Saved features to: {FEATURES_OUTPUT_PATH}")
    
    # ── 9. Summary stats ───────────────────────────────────────────────────────
    log.info("\n" + "="*60)
    log.info("FEATURE SUMMARY")
    log.info("="*60)
    log.info(f"Total rows: {len(result):,}")
    log.info(f"Unique stocks: {result['symbol'].nunique()}")
    log.info(f"Date range: {result['date'].min()} to {result['date'].max()}")
    log.info(f"\nLiquidity Score Distribution:")
    log.info(f"  Mean: {result['liquidity_score'].mean():.4f}")
    log.info(f"  Std:  {result['liquidity_score'].std():.4f}")
    log.info(f"  Min:  {result['liquidity_score'].min():.4f}")
    log.info(f"  Max:  {result['liquidity_score'].max():.4f}")
    
    return result


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE WRAPPER
# ══════════════════════════════════════════════════════════════════════════════

def run_feature_pipeline(input_path=None, market="US"):
    """
    Run complete feature engineering pipeline.
    
    Parameters
    ----------
    input_path : str, optional
        Path to cleaned data CSV. If None, uses default path.
    market : str
        Market: "US" or "INDIA"
    
    Returns
    -------
    pd.DataFrame
        Computed features
    """
    if input_path is None:
        if market.upper() == "INDIA":
            input_path = os.path.join(BASE_DIR, "cleaned_nifty.csv")
        else:
            input_path = CLEANED_DATA_PATH
    
    log.info(f"Loading {market} data from: {input_path}")
    
    if not os.path.exists(input_path):
        log.error(f"Input file not found: {input_path}")
        return None
    
    df = pd.read_csv(input_path, parse_dates=['date'])
    
    # Set output path based on market
    if market.upper() == "INDIA":
        global FEATURES_OUTPUT_PATH
        FEATURES_OUTPUT_PATH = os.path.join(BASE_DIR, "liquidity_features_india.csv")
    
    features = compute_liquidity_features(df, save=True)
    
    return features


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    print("="*60)
    print("  FEATURE ENGINEERING MODULE")
    print("="*60)
    
    market = sys.argv[1] if len(sys.argv) > 1 else "US"
    
    run_feature_pipeline(market=market)
    
    print(f"\n✅ Feature engineering complete for {market} market")
