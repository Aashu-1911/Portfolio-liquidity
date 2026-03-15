"""
pipeline_scheduler.py — Automated Daily Pipeline Execution
===========================================================
Orchestrates the complete data pipeline:
  1. Fetch latest market data
  2. Update dataset
  3. Recompute features
  4. Retrain/update model
  5. Generate predictions

Runs automatically every 24 hours after market close.

Usage:
  python pipeline_scheduler.py --once     # Run once immediately
  python pipeline_scheduler.py --daemon   # Run as background service
  python pipeline_scheduler.py --schedule # Schedule daily at 5 PM EST
"""

import os
import sys
import time
import logging
import schedule
from datetime import datetime, time as dt_time
import subprocess

# Import our modules
import data_ingestion
import feature_engineering
import prediction_engine
from train_liquidity_model import train_liquidity_model

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_FILE = os.path.join(BASE_DIR, "pipeline.log")


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE EXECUTION
# ══════════════════════════════════════════════════════════════════════════════

def run_complete_pipeline():
    """
    Execute the complete data pipeline.
    
    Steps:
      1. Fetch latest market data
      2. Update dataset
      3. Process data (cleaning)
      4. Compute liquidity features
      5. Retrain ML model
      6. Train forecasting models
    
    Returns
    -------
    bool
        True if successful, False otherwise
    """
    log.info("="*70)
    log.info("STARTING DAILY PIPELINE EXECUTION")
    log.info("="*70)
    log.info(f"Timestamp: {datetime.now()}")
    
    try:
        # ── Step 1: Fetch Latest Market Data ──────────────────────────────────
        log.info("\n[1/6] Fetching latest market data...")
        new_data = data_ingestion.fetch_latest_market_data(days_back=5)
        
        if new_data.empty:
            log.warning("No new data fetched. Pipeline aborted.")
            return False
        
        log.info(f"✓ Fetched {len(new_data):,} rows")
        
        # ── Step 2: Update Dataset ────────────────────────────────────────────
        log.info("\n[2/6] Updating dataset...")
        updated_data = data_ingestion.update_dataset(new_data=new_data)
        
        if updated_data is None:
            log.error("Dataset update failed. Pipeline aborted.")
            return False
        
        log.info(f"✓ Dataset updated: {len(updated_data):,} total rows")
        
        # ── Step 3: Process Data (Cleaning) ───────────────────────────────────
        log.info("\n[3/6] Processing and cleaning data...")
        
        # Run process_sp500.py logic
        from process_sp500 import process_data
        cleaned_data = process_data(updated_data)
        
        log.info(f"✓ Data cleaned: {len(cleaned_data):,} rows")
        
        # ── Step 4: Compute Liquidity Features ────────────────────────────────
        log.info("\n[4/6] Computing liquidity features...")
        features = feature_engineering.compute_liquidity_features(
            cleaned_data, save=True
        )
        
        log.info(f"✓ Features computed: {len(features):,} rows")
        
        # ── Step 5: Retrain ML Model ──────────────────────────────────────────
        log.info("\n[5/6] Retraining ML model...")
        model_metrics = train_liquidity_model()
        
        log.info(f"✓ Model retrained: R² = {model_metrics.get('R2', 0):.4f}")
        
        # ── Step 6: Train Forecasting Models ──────────────────────────────────
        log.info("\n[6/6] Training forecasting models...")
        forecast_models = prediction_engine.train_forecasting_model(save=True)
        
        log.info(f"✓ Forecast models trained for {len(forecast_models)} horizons")
        
        # ── Success ────────────────────────────────────────────────────────────
        log.info("\n" + "="*70)
        log.info("✅ PIPELINE COMPLETED SUCCESSFULLY")
        log.info("="*70)
        log.info(f"Completion time: {datetime.now()}")
        
        return True
        
    except Exception as e:
        log.error(f"\n❌ PIPELINE FAILED: {e}", exc_info=True)
        return False


def run_initial_setup():
    """
    Run initial setup: fetch 5 years of historical data and train models.
    
    This should be run once when setting up the system.
    """
    log.info("="*70)
    log.info("INITIAL SETUP — FETCHING HISTORICAL DATA")
    log.info("="*70)
    
    try:
        # Fetch 5 years of historical data
        log.info("\n[1/5] Fetching 5 years of historical data...")
        historical_data = data_ingestion.fetch_historical_data(
            period="5y", 
            save=True
        )
        
        log.info(f"✓ Historical data fetched: {len(historical_data):,} rows")
        
        # Process data
        log.info("\n[2/5] Processing data...")
        from process_sp500 import process_data
        cleaned_data = process_data(historical_data)
        
        # Compute features
        log.info("\n[3/5] Computing features...")
        features = feature_engineering.compute_liquidity_features(
            cleaned_data, save=True
        )
        
        # Train models
        log.info("\n[4/5] Training ML model...")
        train_liquidity_model()
        
        log.info("\n[5/5] Training forecasting models...")
        prediction_engine.train_forecasting_model(save=True)
        
        log.info("\n" + "="*70)
        log.info("✅ INITIAL SETUP COMPLETED")
        log.info("="*70)
        
        return True
        
    except Exception as e:
        log.error(f"\n❌ INITIAL SETUP FAILED: {e}", exc_info=True)
        return False


# ══════════════════════════════════════════════════════════════════════════════
# SCHEDULING
# ══════════════════════════════════════════════════════════════════════════════

def schedule_daily_pipeline(run_time="17:00"):
    """
    Schedule pipeline to run daily at specified time.
    
    Parameters
    ----------
    run_time : str
        Time to run in HH:MM format (24-hour). Default: 17:00 (5 PM EST, after market close)
    """
    log.info(f"Scheduling daily pipeline execution at {run_time}")
    
    schedule.every().day.at(run_time).do(run_complete_pipeline)
    
    log.info("Scheduler started. Press Ctrl+C to stop.")
    log.info(f"Next run: {schedule.next_run()}")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    except KeyboardInterrupt:
        log.info("\nScheduler stopped by user")


def run_daemon():
    """
    Run as a background daemon service.
    Executes pipeline every 24 hours.
    """
    log.info("Starting daemon mode...")
    log.info("Pipeline will run every 24 hours")
    
    # Run immediately on startup
    log.info("\nExecuting initial run...")
    run_complete_pipeline()
    
    # Then schedule for every 24 hours
    schedule.every(24).hours.do(run_complete_pipeline)
    
    log.info(f"\nNext run scheduled: {schedule.next_run()}")
    
    try:
        while True:
            schedule.run_pending()
            time.sleep(3600)  # Check every hour
    except KeyboardInterrupt:
        log.info("\nDaemon stopped by user")


# ══════════════════════════════════════════════════════════════════════════════
# CLI INTERFACE
# ══════════════════════════════════════════════════════════════════════════════

def main():
    """Main CLI interface."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Portfolio Liquidity Pipeline Scheduler"
    )
    parser.add_argument(
        '--once',
        action='store_true',
        help='Run pipeline once immediately'
    )
    parser.add_argument(
        '--daemon',
        action='store_true',
        help='Run as background daemon (every 24 hours)'
    )
    parser.add_argument(
        '--schedule',
        metavar='TIME',
        help='Schedule daily at specific time (HH:MM format, e.g., 17:00)'
    )
    parser.add_argument(
        '--setup',
        action='store_true',
        help='Run initial setup (fetch 5 years of data)'
    )
    
    args = parser.parse_args()
    
    # Setup logging to file
    file_handler = logging.FileHandler(LOG_FILE)
    file_handler.setFormatter(
        logging.Formatter('%(asctime)s  %(levelname)-7s  %(message)s')
    )
    logging.getLogger().addHandler(file_handler)
    
    if args.setup:
        run_initial_setup()
    
    elif args.once:
        success = run_complete_pipeline()
        sys.exit(0 if success else 1)
    
    elif args.daemon:
        run_daemon()
    
    elif args.schedule:
        schedule_daily_pipeline(run_time=args.schedule)
    
    else:
        parser.print_help()
        print("\nExamples:")
        print("  python pipeline_scheduler.py --setup              # Initial setup")
        print("  python pipeline_scheduler.py --once               # Run once now")
        print("  python pipeline_scheduler.py --daemon             # Run every 24h")
        print("  python pipeline_scheduler.py --schedule 17:00     # Daily at 5 PM")


if __name__ == "__main__":
    main()
