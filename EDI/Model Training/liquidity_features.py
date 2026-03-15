import pandas as pd
import numpy as np

# 1. Load the dataset
print("Loading cleaned_sp500.csv...")
df = pd.read_csv('C:/Users/HP/Downloads/EDI/cleaned_sp500.csv', parse_dates=['date'])
print(f"Shape: {df.shape}")

# Sort by symbol and date (ensure correct ordering)
df = df.sort_values(['symbol', 'date']).reset_index(drop=True)

# ─────────────────────────────────────────────
# 2. COMPUTE RAW LIQUIDITY FEATURES
# ─────────────────────────────────────────────

# Spread Proxy: (high - low) / close
df['spread_proxy'] = (df['high'] - df['low']) / df['close']

# Volatility: rolling 30-day std of daily returns (already in dataset, recompute cleanly)
df['daily_return'] = df.groupby('symbol')['close'].transform(lambda x: x.pct_change())
df['volatility'] = df.groupby('symbol')['daily_return'].transform(
    lambda x: x.rolling(window=30, min_periods=5).std()
)

# Volume Normalization: volume / mean volume per stock
df['volume_norm'] = df.groupby('symbol')['volume'].transform(
    lambda x: x / x.mean()
)

# Amihud Illiquidity Ratio: |return| / volume  (scale by 1e6 for readability)
df['amihud_ratio'] = (df['daily_return'].abs() / df['volume'].replace(0, np.nan)) * 1e6

# ─────────────────────────────────────────────
# 3. NORMALIZE ALL FEATURES TO [0, 1] PER STOCK
#    Using min-max scaling within each symbol
# ─────────────────────────────────────────────

def minmax_scale(series):
    mn, mx = series.min(), series.max()
    if mx == mn:
        return pd.Series(0.0, index=series.index)
    return (series - mn) / (mx - mn)

print("Normalizing features per stock...")
for feat in ['volume_norm', 'spread_proxy', 'volatility', 'amihud_ratio']:
    df[f'norm_{feat}'] = df.groupby('symbol')[feat].transform(minmax_scale)

# ─────────────────────────────────────────────
# 4. LIQUIDITY SCORE
#    High volume  → more liquid   (+)
#    High spread  → less liquid   (1 - spread)
#    High vol     → less liquid   (1 - volatility)
#    High amihud  → less liquid   (1 - amihud)
# ─────────────────────────────────────────────

df['liquidity_score'] = (
    0.4 * df['norm_volume_norm'] +
    0.3 * (1 - df['norm_spread_proxy']) +
    0.2 * (1 - df['norm_volatility']) +
    0.1 * (1 - df['norm_amihud_ratio'])
)

# ─────────────────────────────────────────────
# 5. SELECT & SAVE FINAL COLUMNS
# ─────────────────────────────────────────────

output_cols = ['symbol', 'date', 'volume', 'spread_proxy', 'volatility', 'amihud_ratio', 'liquidity_score']
result = df[output_cols].copy()

# Drop rows where any key feature is NaN (early rows with insufficient rolling window)
result.dropna(subset=['volatility', 'amihud_ratio', 'liquidity_score'], inplace=True)

output_path = 'C:/Users/HP/Downloads/EDI/liquidity_features.csv'
result.to_csv(output_path, index=False)
print(f"Saved to: {output_path}")

# ─────────────────────────────────────────────
# 6. SUMMARY STATISTICS & PREVIEW
# ─────────────────────────────────────────────

print("\n=== Summary Statistics ===")
print(result[['spread_proxy', 'volatility', 'amihud_ratio', 'liquidity_score']].describe().round(6).to_string())

print("\n=== First 10 Rows ===")
print(result.head(10).to_string())

print("\n=== Top 10 Most Liquid Stocks (avg liquidity score) ===")
top_liquid = result.groupby('symbol')['liquidity_score'].mean().nlargest(10).round(4)
print(top_liquid.to_string())

print("\n=== Top 10 Least Liquid Stocks (avg liquidity score) ===")
low_liquid = result.groupby('symbol')['liquidity_score'].mean().nsmallest(10).round(4)
print(low_liquid.to_string())

print("\n=== Liquidity Score Distribution ===")
bins = [0, 0.2, 0.4, 0.6, 0.8, 1.0]
labels = ['0.0–0.2', '0.2–0.4', '0.4–0.6', '0.6–0.8', '0.8–1.0']
result['score_bin'] = pd.cut(result['liquidity_score'], bins=bins, labels=labels)
dist = result['score_bin'].value_counts().sort_index()
for label, count in dist.items():
    pct = count / len(result) * 100
    bar = '█' * int(pct / 2)
    print(f"  {label}: {bar} {count:>7,} rows ({pct:.1f}%)")

print(f"\nFinal dataset: {len(result):,} rows, {result['symbol'].nunique()} stocks")