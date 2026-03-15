"""
config.py — Centralized Configuration
======================================
All configurable parameters in one place.
"""

import os
from datetime import time

# ══════════════════════════════════════════════════════════════════════════════
# PATHS
# ══════════════════════════════════════════════════════════════════════════════

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Data files
RAW_DATA_PATH = os.path.join(BASE_DIR, "raw_sp500_data.csv")
CLEANED_DATA_PATH = os.path.join(BASE_DIR, "cleaned_sp500.csv")
FEATURES_PATH = os.path.join(BASE_DIR, "liquidity_features.csv")

# Model files
MODEL_PATH = os.path.join(BASE_DIR, "model.pkl")
FORECAST_MODEL_PATH = os.path.join(BASE_DIR, "forecast_model.pkl")

# Logs
LOG_FILE = os.path.join(BASE_DIR, "pipeline.log")


# ══════════════════════════════════════════════════════════════════════════════
# DATA INGESTION
# ══════════════════════════════════════════════════════════════════════════════

# Historical data period
HISTORICAL_PERIOD = "5y"  # Options: "1y", "2y", "5y", "10y", "max"

# Number of symbols to fetch (None = all S&P 500)
SYMBOL_LIMIT = None  # Set to 50 for testing, None for production

# Days to fetch for daily updates
DAILY_UPDATE_DAYS = 5

# Rate limiting (seconds between API calls)
API_DELAY = 0.1


# ══════════════════════════════════════════════════════════════════════════════
# FEATURE ENGINEERING
# ══════════════════════════════════════════════════════════════════════════════

# Feature list
FEATURES = ["volume", "spread_proxy", "volatility", "amihud_ratio"]

# Liquidity score weights
LIQUIDITY_WEIGHTS = {
    "volume": 0.4,
    "spread": 0.3,
    "volatility": 0.2,
    "amihud": 0.1
}

# Rolling window for volatility calculation
VOLATILITY_WINDOW = 30  # days


# ══════════════════════════════════════════════════════════════════════════════
# MODEL TRAINING
# ══════════════════════════════════════════════════════════════════════════════

# Train/test split ratio
TEST_SIZE = 0.20

# Random seed for reproducibility
RANDOM_SEED = 42

# Model hyperparameters
MODEL_PARAMS = {
    "n_estimators": 100,
    "max_depth": 5,
    "learning_rate": 0.05,
    "subsample": 0.8
}


# ══════════════════════════════════════════════════════════════════════════════
# FORECASTING
# ══════════════════════════════════════════════════════════════════════════════

# Forecast horizons (days ahead)
FORECAST_HORIZONS = [1, 3, 7]  # Can add more: [1, 3, 7, 14, 30]


# ══════════════════════════════════════════════════════════════════════════════
# LLM REASONING
# ══════════════════════════════════════════════════════════════════════════════

# OpenAI model
LLM_MODEL = "gpt-3.5-turbo"  # Options: "gpt-3.5-turbo", "gpt-4"

# LLM temperature (0 = deterministic, 1 = creative)
LLM_TEMPERATURE = 0.3

# Max tokens for explanation
LLM_MAX_TOKENS = 200

# Market context analysis period
MARKET_CONTEXT_DAYS = 30


# ══════════════════════════════════════════════════════════════════════════════
# PIPELINE SCHEDULING
# ══════════════════════════════════════════════════════════════════════════════

# Default schedule time (after market close)
PIPELINE_RUN_TIME = "17:00"  # 5 PM EST

# Pipeline execution interval (hours)
PIPELINE_INTERVAL_HOURS = 24


# ══════════════════════════════════════════════════════════════════════════════
# FLASK API
# ══════════════════════════════════════════════════════════════════════════════

# Server configuration
FLASK_HOST = "0.0.0.0"
FLASK_PORT = 5000
FLASK_DEBUG = True

# CORS settings
CORS_ALLOW_ORIGIN = "*"  # Change to specific domain in production

# Trading hours per day (for liquidation time calculation)
TRADING_HOURS_PER_DAY = 6.5  # NYSE hours


# ══════════════════════════════════════════════════════════════════════════════
# LOGGING
# ══════════════════════════════════════════════════════════════════════════════

LOG_LEVEL = "INFO"  # Options: "DEBUG", "INFO", "WARNING", "ERROR"
LOG_FORMAT = "%(asctime)s  %(levelname)-7s  %(message)s"
LOG_DATE_FORMAT = "%H:%M:%S"


# ══════════════════════════════════════════════════════════════════════════════
# ENVIRONMENT VARIABLES
# ══════════════════════════════════════════════════════════════════════════════

# Load from .env file if available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")


# ══════════════════════════════════════════════════════════════════════════════
# VALIDATION
# ══════════════════════════════════════════════════════════════════════════════

def validate_config():
    """Validate configuration settings."""
    issues = []
    
    # Check forecast horizons
    if not FORECAST_HORIZONS or not all(h > 0 for h in FORECAST_HORIZONS):
        issues.append("FORECAST_HORIZONS must be a list of positive integers")
    
    # Check weights sum to 1
    weight_sum = sum(LIQUIDITY_WEIGHTS.values())
    if abs(weight_sum - 1.0) > 0.01:
        issues.append(f"LIQUIDITY_WEIGHTS must sum to 1.0 (current: {weight_sum})")
    
    # Check test size
    if not 0 < TEST_SIZE < 1:
        issues.append("TEST_SIZE must be between 0 and 1")
    
    if issues:
        raise ValueError("Configuration errors:\n" + "\n".join(f"  - {i}" for i in issues))
    
    return True


# Validate on import
validate_config()
