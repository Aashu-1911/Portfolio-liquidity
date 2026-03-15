# import pandas as pd
# import numpy as np
# from sklearn.preprocessing import MinMaxScaler
# import warnings
# warnings.filterwarnings('ignore')

# # 1. Load the dataset
# print("Loading dataset...")
# df = pd.read_csv('SP 500 Stock Prices 2014-2017.csv')
# print(f"Dataset shape: {df.shape}\n")

# # 2. Convert date column to datetime format
# print("Converting date column to datetime...")
# df['date'] = pd.to_datetime(df['date'])

# # 3. Sort data by symbol and date
# print("Sorting data by symbol and date...")
# df = df.sort_values(['symbol', 'date']).reset_index(drop=True)

# # 4. Check for missing values and handle them
# print("\nChecking for missing values before handling:")
# print(df.isnull().sum())
# print()

# # Display rows with missing values
# missing_rows = df[df.isnull().any(axis=1)]
# if len(missing_rows) > 0:
#     print("Rows with missing values:")
#     print(missing_rows)
#     print()

# # Handle missing values: Fill with forward fill then backward fill per symbol
# print("Handling missing values (forward fill per symbol, then backward fill)...")
# for symbol in df['symbol'].unique():
#     mask = df['symbol'] == symbol
#     df.loc[mask, ['open', 'high', 'low']] = df.loc[mask, ['open', 'high', 'low']].ffill().bfill()

# print("Missing values after handling:")
# print(df.isnull().sum())
# print()

# # 5. Compute daily returns: (close - previous_close) / previous_close
# print("Computing daily returns...")
# df['daily_return'] = df.groupby('symbol')['close'].pct_change()

# # 6. Create rolling 30-day volatility (standard deviation of returns)
# print("Creating rolling 30-day volatility...")
# df['volatility_30d'] = df.groupby('symbol')['daily_return'].transform(
#     lambda x: x.rolling(window=30, min_periods=1).std()
# )

# # 7. Normalize volume per stock (using MinMaxScaler per symbol)
# print("Normalizing volume per stock...")
# scaler = MinMaxScaler()
# df['volume_normalized'] = df.groupby('symbol')['volume'].transform(
#     lambda x: scaler.fit_transform(x.values.reshape(-1, 1)).flatten()
# )

# # Summary statistics before saving
# print("\n" + "="*80)
# print("SUMMARY STATISTICS")
# print("="*80)
# print("\nDataset shape:", df.shape)
# print("\nData types:")
# print(df.dtypes)
# print("\nDescriptive statistics:")
# print(df[['open', 'high', 'low', 'close', 'volume', 'daily_return', 'volatility_30d', 'volume_normalized']].describe())

# # 8. Display first few rows
# print("\n" + "="*80)
# print("FIRST 10 ROWS OF PROCESSED DATA")
# print("="*80)
# print(df.head(10).to_string())

# # Show data for different symbols
# print("\n" + "="*80)
# print("SAMPLE DATA BY SYMBOL (First 3 rows per symbol)")
# print("="*80)
# for symbol in df['symbol'].unique()[:5]:  # Show first 5 symbols
#     print(f"\n{symbol}:")
#     print(df[df['symbol'] == symbol].head(3).to_string())

# # Check for any remaining null values in important columns
# print("\n" + "="*80)
# print("FINAL DATA QUALITY CHECK")
# print("="*80)
# print("\nMissing values in final dataset:")
# print(df.isnull().sum())
# print(f"\nTotal rows: {len(df)}")
# print(f"Unique symbols: {df['symbol'].nunique()}")
# print(f"Date range: {df['date'].min()} to {df['date'].max()}")

# # 9. Save the cleaned dataset
# output_path = 'cleaned_sp500.csv'
# print(f"\nSaving cleaned dataset to {output_path}...")
# df.to_csv(output_path, index=False)
# print(f"Successfully saved! ✓")

# print("\n" + "="*80)
# print("Processing completed successfully!")
# print("="*80)


import pandas as pd
import numpy as np
import os

def process_data(df=None, input_path=None, output_path=None):
    """
    Process and clean stock data.
    
    Parameters
    ----------
    df : pd.DataFrame, optional
        Input dataframe. If None, loads from input_path.
    input_path : str, optional
        Path to input CSV
    output_path : str, optional
        Path to save cleaned data
    
    Returns
    -------
    pd.DataFrame
        Cleaned and processed data
    """
    # Load data if not provided
    if df is None:
        if input_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            input_path = os.path.join(os.path.dirname(base_dir), 'raw_sp500_data.csv')
        
        print(f"Loading dataset from {input_path}...")
        df = pd.read_csv(input_path)
    
    print(f"Shape: {df.shape}")
    print(f"Columns: {df.columns.tolist()}")

# 2. Convert date column to datetime
df['date'] = pd.to_datetime(df['date'])

# 3. Sort by symbol and date
df = df.sort_values(['symbol', 'date']).reset_index(drop=True)

# 4. Check for missing values and handle them
print("\n--- Missing Values Before ---")
print(df.isnull().sum())

# Forward-fill within each stock symbol group (carry last known price)
df[['open', 'high', 'low', 'close', 'volume']] = (
    df.groupby('symbol')[['open', 'high', 'low', 'close', 'volume']]
    .transform(lambda x: x.ffill().bfill())
)

print("\n--- Missing Values After ---")
print(df.isnull().sum())

# Drop rows that are still missing (no valid data for symbol at all)
df.dropna(subset=['close', 'volume'], inplace=True)

# 5. Compute daily returns per stock
df['daily_return'] = df.groupby('symbol')['close'].transform(
    lambda x: x.pct_change()
)

# 6. Rolling 30-day volatility (std of daily returns)
df['volatility_30d'] = df.groupby('symbol')['daily_return'].transform(
    lambda x: x.rolling(window=30, min_periods=5).std()
)

# 7. Normalize volume per stock (z-score normalization)
df['volume_normalized'] = df.groupby('symbol')['volume'].transform(
    lambda x: (x - x.mean()) / x.std()
)

    # Save cleaned dataset
    if output_path is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        output_path = os.path.join(base_dir, '..', 'cleaned_sp500.csv')
    
    df.to_csv(output_path, index=False)
    print(f"\nCleaned dataset saved to: {output_path}")
    
    return df


# ══════════════════════════════════════════════════════════════════════════════
# MAIN — CLI INTERFACE
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Original standalone execution
    process_data(
        input_path='C:/Users/HP/Downloads/EDI/SP 500 Stock Prices 2014-2017.csv',
        output_path='C:/Users/HP/Downloads/EDI/cleaned_sp500.csv'
    )

# Summary statistics
print("\n=== Summary Statistics ===")
print(df[['open', 'high', 'low', 'close', 'volume', 'daily_return', 'volatility_30d', 'volume_normalized']].describe().round(4))

print("\n=== First Few Rows ===")
print(df.head(10).to_string())

print(f"\n=== Dataset Info ===")
print(f"Total rows: {len(df):,}")
print(f"Unique stocks: {df['symbol'].nunique()}")
print(f"Date range: {df['date'].min().date()} to {df['date'].max().date()}")
print(f"Stocks with highest avg volatility:")
top_vol = df.groupby('symbol')['volatility_30d'].mean().nlargest(5).round(4)
print(top_vol.to_string())