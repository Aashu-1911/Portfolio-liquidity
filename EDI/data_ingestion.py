"""
data_ingestion.py — Automated Market Data Fetching & Dataset Updates
=====================================================================
Fetches historical and daily market data using yfinance API.
Appends new data to existing datasets for continuous learning.

Functions:
  fetch_historical_data()  — Download 5 years of data for initial training
  fetch_latest_market_data() — Get latest daily data for updates
  update_dataset()         — Append new data to existing CSV
  get_sp500_symbols()      — Fetch current S&P 500 ticker list
"""

import os
import pandas as pd
import numpy as np
import yfinance as yf
from datetime import datetime, timedelta
import logging
import time

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# US Market paths
RAW_DATA_PATH_US = os.path.join(BASE_DIR, "raw_sp500_data.csv")
CLEANED_DATA_PATH_US = os.path.join(BASE_DIR, "cleaned_sp500.csv")

# Indian Market paths
RAW_DATA_PATH_INDIA = os.path.join(BASE_DIR, "raw_nifty_data.csv")
CLEANED_DATA_PATH_INDIA = os.path.join(BASE_DIR, "cleaned_nifty.csv")

# Legacy paths (for backward compatibility)
RAW_DATA_PATH = RAW_DATA_PATH_US
CLEANED_DATA_PATH = CLEANED_DATA_PATH_US


# ══════════════════════════════════════════════════════════════════════════════
# SYMBOL FETCHING — US & INDIA
# ══════════════════════════════════════════════════════════════════════════════

def get_sp500_symbols(limit=None):
    """
    Fetch current S&P 500 ticker symbols from Wikipedia.
    
    Parameters
    ----------
    limit : int, optional
        Limit number of symbols (for testing). None = all symbols.
    
    Returns
    -------
    list of str
        S&P 500 ticker symbols
    """
    try:
        log.info("Fetching S&P 500 symbols from Wikipedia...")
        url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
        tables = pd.read_html(url)
        df = tables[0]
        symbols = df['Symbol'].str.replace('.', '-').tolist()
        
        if limit:
            symbols = symbols[:limit]
        
        log.info(f"✓ Found {len(symbols)} symbols")
        return symbols
    except Exception as e:
        log.error(f"Failed to fetch S&P 500 symbols: {e}")
        # Fallback to common symbols
        fallback = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "NVDA", 
                   "JPM", "V", "JNJ", "WMT", "PG", "MA", "HD", "DIS"]
        log.warning(f"Using fallback symbols: {len(fallback)} stocks")
        return fallback[:limit] if limit else fallback


def get_nifty_symbols(limit=None):
    """
    Fetch NIFTY 50 and popular Indian stock symbols.
    
    Parameters
    ----------
    limit : int, optional
        Limit number of symbols (for testing). None = all symbols.
    
    Returns
    -------
    list of str
        Indian stock symbols with .NS suffix for NSE
    """
    try:
        log.info("Fetching NIFTY 50 symbols from Wikipedia...")
        url = "https://en.wikipedia.org/wiki/NIFTY_50"
        tables = pd.read_html(url)
        df = tables[1]  # Second table contains the list
        
        # Get symbols and add .NS suffix for NSE
        symbols = [sym + ".NS" for sym in df['Symbol'].tolist()]
        
        if limit:
            symbols = symbols[:limit]
        
        log.info(f"✓ Found {len(symbols)} NIFTY symbols")
        return symbols
    except Exception as e:
        log.error(f"Failed to fetch NIFTY symbols: {e}")
        # Fallback to popular Indian stocks
        fallback = [
            "RELIANCE.NS", "TCS.NS", "HDFCBANK.NS", "INFY.NS", "ICICIBANK.NS",
            "HINDUNILVR.NS", "ITC.NS", "SBIN.NS", "BHARTIARTL.NS", "KOTAKBANK.NS",
            "LT.NS", "AXISBANK.NS", "ASIANPAINT.NS", "MARUTI.NS", "TITAN.NS",
            "SUNPHARMA.NS", "BAJFINANCE.NS", "WIPRO.NS", "ULTRACEMCO.NS", "NESTLEIND.NS",
            "HCLTECH.NS", "TECHM.NS", "POWERGRID.NS", "NTPC.NS", "ONGC.NS",
            "TATAMOTORS.NS", "TATASTEEL.NS", "ADANIPORTS.NS", "COALINDIA.NS", "DRREDDY.NS"
        ]
        log.warning(f"Using fallback symbols: {len(fallback)} stocks")
        return fallback[:limit] if limit else fallback


# ══════════════════════════════════════════════════════════════════════════════
# HISTORICAL DATA FETCHING (5 YEARS)
# ══════════════════════════════════════════════════════════════════════════════

def fetch_historical_data(symbols=None, period="5y", save=True, market="US"):
    """
    Download 5 years of historical data for stocks.
    
    Parameters
    ----------
    symbols : list, optional
        List of ticker symbols. If None, fetches based on market.
    period : str
        Time period (default: "5y")
    save : bool
        Whether to save to CSV
    market : str
        Market to fetch: "US" (S&P 500) or "INDIA" (NIFTY)
    
    Returns
    -------
    pd.DataFrame
        Historical stock data with columns: symbol, date, open, high, low, close, volume
    """
    if symbols is None:
        if market.upper() == "INDIA":
            symbols = get_nifty_symbols(limit=50)  # Start with 50 for faster testing
        else:
            symbols = get_sp500_symbols(limit=50)  # Start with 50 for faster testing
    
    log.info(f"Fetching {period} historical data for {len(symbols)} {market} symbols...")
    
    all_data = []
    failed = []
    
    # Determine save path based on market
    if market.upper() == "INDIA":
        save_path = RAW_DATA_PATH_INDIA
    else:
        save_path = RAW_DATA_PATH_US
    
    for i, symbol in enumerate(symbols, 1):
        try:
            log.info(f"  [{i}/{len(symbols)}] Downloading {symbol}...")
            
            ticker = yf.Ticker(symbol)
            df = ticker.history(period=period, interval="1d")
            
            if df.empty:
                log.warning(f"    ⚠ No data for {symbol}")
                failed.append(symbol)
                continue
            
            # Reset index to get date as column
            df = df.reset_index()
            df['symbol'] = symbol
            
            # Rename columns to match existing format
            df = df.rename(columns={
                'Date': 'date',
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            })
            
            # Select only needed columns
            df = df[['symbol', 'date', 'open', 'high', 'low', 'close', 'volume']]
            
            all_data.append(df)
            log.info(f"    ✓ {len(df)} rows")
            
            # Rate limiting
            time.sleep(0.1)
            
        except Exception as e:
            log.error(f"    ✗ Failed to download {symbol}: {e}")
            failed.append(symbol)
            continue
    
    if not all_data:
        raise ValueError("No data was successfully downloaded!")
    
    # Combine all data
    combined = pd.concat(all_data, ignore_index=True)
    combined = combined.sort_values(['symbol', 'date']).reset_index(drop=True)
    
    log.info(f"\n{'='*60}")
    log.info(f"✓ Downloaded data for {len(symbols) - len(failed)} symbols")
    log.info(f"✓ Total rows: {len(combined):,}")
    log.info(f"✓ Date range: {combined['date'].min()} to {combined['date'].max()}")
    
    if failed:
        log.warning(f"⚠ Failed symbols ({len(failed)}): {', '.join(failed[:10])}")
    
    if save:
        combined.to_csv(save_path, index=False)
        log.info(f"✓ Saved to: {save_path}")
    
    return combined


# ══════════════════════════════════════════════════════════════════════════════
# DAILY DATA FETCHING
# ══════════════════════════════════════════════════════════════════════════════

def fetch_latest_market_data(symbols=None, days_back=5, market="US"):
    """
    Fetch latest market data (last N days) for incremental updates.
    
    Parameters
    ----------
    symbols : list, optional
        Ticker symbols to fetch. If None, uses existing dataset symbols.
    days_back : int
        Number of days to fetch (default: 5 for safety)
    market : str
        Market: "US" or "INDIA"
    
    Returns
    -------
    pd.DataFrame
        Latest market data
    """
    if symbols is None:
        # Determine which dataset to load
        if market.upper() == "INDIA":
            data_path = CLEANED_DATA_PATH_INDIA
        else:
            data_path = CLEANED_DATA_PATH_US
        
        # Load existing dataset to get symbols
        if os.path.exists(data_path):
            existing = pd.read_csv(data_path)
            symbols = existing['symbol'].unique().tolist()
            log.info(f"Using {len(symbols)} symbols from existing {market} dataset")
        else:
            if market.upper() == "INDIA":
                symbols = get_nifty_symbols(limit=50)
            else:
                symbols = get_sp500_symbols(limit=50)
    
    log.info(f"Fetching latest {days_back} days of data...")
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days_back)
    
    all_data = []
    
    for i, symbol in enumerate(symbols, 1):
        try:
            ticker = yf.Ticker(symbol)
            df = ticker.history(start=start_date, end=end_date, interval="1d")
            
            if df.empty:
                continue
            
            df = df.reset_index()
            df['symbol'] = symbol
            df = df.rename(columns={
                'Date': 'date',
                'Open': 'open',
                'High': 'high',
                'Low': 'low',
                'Close': 'close',
                'Volume': 'volume'
            })
            df = df[['symbol', 'date', 'open', 'high', 'low', 'close', 'volume']]
            
            all_data.append(df)
            
            if i % 50 == 0:
                log.info(f"  Progress: {i}/{len(symbols)}")
            
            time.sleep(0.05)
            
        except Exception as e:
            log.warning(f"Failed to fetch {symbol}: {e}")
            continue
    
    if not all_data:
        log.warning("No new data fetched!")
        return pd.DataFrame()
    
    combined = pd.concat(all_data, ignore_index=True)
    combined = combined.sort_values(['symbol', 'date']).reset_index(drop=True)
    
    log.info(f"✓ Fetched {len(combined):,} rows for {len(all_data)} symbols")
    
    return combined


# ══════════════════════════════════════════════════════════════════════════════
# DATASET UPDATE
# ══════════════════════════════════════════════════════════════════════════════

def update_dataset(new_data=None, deduplicate=True, market="US"):
    """
    Append new market data to existing dataset.
    
    Parameters
    ----------
    new_data : pd.DataFrame, optional
        New data to append. If None, fetches latest data automatically.
    deduplicate : bool
        Remove duplicate (symbol, date) pairs
    market : str
        Market: "US" or "INDIA"
    
    Returns
    -------
    pd.DataFrame
        Updated dataset
    """
    log.info(f"Updating {market} dataset...")
    
    # Determine paths based on market
    if market.upper() == "INDIA":
        raw_path = RAW_DATA_PATH_INDIA
    else:
        raw_path = RAW_DATA_PATH_US
    
    # Fetch new data if not provided
    if new_data is None:
        new_data = fetch_latest_market_data(market=market)
    
    if new_data.empty:
        log.warning("No new data to append")
        return None
    
    # Load existing dataset
    if os.path.exists(raw_path):
        existing = pd.read_csv(raw_path, parse_dates=['date'])
        log.info(f"Loaded existing dataset: {len(existing):,} rows")
    else:
        log.warning("No existing dataset found, creating new one")
        existing = pd.DataFrame()
    
    # Append new data
    if not existing.empty:
        updated = pd.concat([existing, new_data], ignore_index=True)
    else:
        updated = new_data
    
    # Remove duplicates
    if deduplicate:
        before = len(updated)
        updated = updated.drop_duplicates(subset=['symbol', 'date'], keep='last')
        after = len(updated)
        if before > after:
            log.info(f"Removed {before - after} duplicate rows")
    
    # Sort
    updated = updated.sort_values(['symbol', 'date']).reset_index(drop=True)
    
    # Save
    updated.to_csv(raw_path, index=False)
    log.info(f"✓ Updated {market} dataset saved: {len(updated):,} rows")
    log.info(f"✓ Date range: {updated['date'].min()} to {updated['date'].max()}")
    
    return updated


# ══════════════════════════════════════════════════════════════════════════════
# MAIN — CLI INTERFACE
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    print("="*60)
    print("  DATA INGESTION MODULE")
    print("="*60)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        market = sys.argv[2] if len(sys.argv) > 2 else "US"
        
        if command == "historical":
            # Fetch 5 years of historical data
            fetch_historical_data(period="5y", save=True, market=market)
        
        elif command == "update":
            # Fetch and append latest data
            update_dataset(market=market)
        
        elif command == "test":
            # Test with limited symbols
            if market.upper() == "INDIA":
                symbols = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS"]
            else:
                symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]
            fetch_historical_data(symbols=symbols, period="1y", save=True, market=market)
        
        elif command == "both":
            # Fetch data for both markets
            log.info("\n" + "="*60)
            log.info("FETCHING US MARKET DATA")
            log.info("="*60)
            fetch_historical_data(period="5y", save=True, market="US")
            
            log.info("\n" + "="*60)
            log.info("FETCHING INDIAN MARKET DATA")
            log.info("="*60)
            fetch_historical_data(period="5y", save=True, market="INDIA")
        
        else:
            print(f"Unknown command: {command}")
            print("Usage: python data_ingestion.py [command] [market]")
    
    else:
        print("\nUsage:")
        print("  python data_ingestion.py historical US     — Fetch 5 years US data")
        print("  python data_ingestion.py historical INDIA  — Fetch 5 years Indian data")
        print("  python data_ingestion.py both              — Fetch both markets")
        print("  python data_ingestion.py update US         — Update US data")
        print("  python data_ingestion.py update INDIA      — Update Indian data")
        print("  python data_ingestion.py test US           — Test with 5 US stocks")
        print("  python data_ingestion.py test INDIA        — Test with 5 Indian stocks")
