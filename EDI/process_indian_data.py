import pandas as pd
import numpy as np

# Load raw Indian data
df = pd.read_csv('raw_nifty_data.csv', parse_dates=['date'])
print(f"Loaded {len(df)} rows")

# Sort
df = df.sort_values(['symbol', 'date']).reset_index(drop=True)

# Handle missing values
df[['open', 'high', 'low', 'close', 'volume']] = (
    df.groupby('symbol')[['open', 'high', 'low', 'close', 'volume']]
    .transform(lambda x: x.ffill().bfill())
)

# Drop remaining NaN
df.dropna(subset=['close', 'volume'], inplace=True)

# Compute daily returns
df['daily_return'] = df.groupby('symbol')['close'].transform(lambda x: x.pct_change())

# Rolling 30-day volatility
df['volatility_30d'] = df.groupby('symbol')['daily_return'].transform(
    lambda x: x.rolling(window=30, min_periods=5).std()
)

# Normalize volume
df['volume_normalized'] = df.groupby('symbol')['volume'].transform(
    lambda x: (x - x.mean()) / x.std()
)

# Save
df.to_csv('cleaned_nifty.csv', index=False)
print(f"Saved {len(df)} rows to cleaned_nifty.csv")
