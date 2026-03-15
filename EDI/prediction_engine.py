"""
prediction_engine.py — Future Liquidity Forecasting
====================================================
Extends the ML model to predict future liquidity at t+1, t+3, t+7 days.
Uses time-series features and trained model for multi-horizon forecasting.

Functions:
  train_forecasting_model()  — Train model with future targets
  predict_future_liquidity() — Predict liquidity for next 1, 3, 7 days
  get_latest_features()      — Extract latest features for a symbol
"""

import os
import pickle
import pandas as pd
import numpy as np
import logging
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# US Market
FEATURES_PATH_US = os.path.join(BASE_DIR, "liquidity_features.csv")
MODEL_PATH_US = os.path.join(BASE_DIR, "model.pkl")
FORECAST_MODEL_PATH_US = os.path.join(BASE_DIR, "forecast_model.pkl")

# Indian Market
FEATURES_PATH_INDIA = os.path.join(BASE_DIR, "liquidity_features_india.csv")
MODEL_PATH_INDIA = os.path.join(BASE_DIR, "model_india.pkl")
FORECAST_MODEL_PATH_INDIA = os.path.join(BASE_DIR, "forecast_model_india.pkl")

# Legacy (default to US)
FEATURES_PATH = FEATURES_PATH_US
MODEL_PATH = MODEL_PATH_US
FORECAST_MODEL_PATH = FORECAST_MODEL_PATH_US

# ── Constants ──────────────────────────────────────────────────────────────────
FEATURES = ["volume", "spread_proxy", "volatility", "amihud_ratio"]
FORECAST_HORIZONS = [1, 3, 7]  # days ahead


# ══════════════════════════════════════════════════════════════════════════════
# FORECASTING MODEL TRAINING
# ══════════════════════════════════════════════════════════════════════════════

def train_forecasting_model(market="US", save=True):
    """
    Train a model to predict future liquidity at t+1, t+3, t+7 days.
    
    Parameters
    ----------
    market : str
        "US" or "INDIA"
    save : bool
        Whether to save the trained models
    
    Creates shifted target variables for multi-horizon forecasting.
    
    Returns
    -------
    dict
        Trained models for each horizon
    """
    log.info("="*60)
    log.info(f"TRAINING FORECASTING MODEL - {market} MARKET")
    log.info("="*60)
    
    # Select paths based on market
    if market.upper() == "INDIA":
        features_path = FEATURES_PATH_INDIA
        forecast_model_path = FORECAST_MODEL_PATH_INDIA
    else:
        features_path = FEATURES_PATH_US
        forecast_model_path = FORECAST_MODEL_PATH_US
    
    # Load features
    if not os.path.exists(features_path):
        log.error(f"Features file not found: {features_path}")
        return {}
    
    df = pd.read_csv(features_path, parse_dates=['date'])
    log.info(f"Loaded {len(df):,} rows")
    
    # Sort by symbol and date
    df = df.sort_values(['symbol', 'date']).reset_index(drop=True)
    
    # Create future targets (shifted liquidity scores)
    models = {}
    
    for horizon in FORECAST_HORIZONS:
        log.info(f"\n── Training model for t+{horizon} days ──")
        
        # Shift liquidity score by horizon days (within each symbol)
        df[f'target_t{horizon}'] = df.groupby('symbol')['liquidity_score'].shift(-horizon)
        
        # Prepare training data
        train_df = df[FEATURES + [f'target_t{horizon}']].dropna()
        
        X = train_df[FEATURES].values
        y = train_df[f'target_t{horizon}'].values
        
        log.info(f"Training samples: {len(X):,}")
        
        # Train/test split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Build pipeline
        pipeline = Pipeline([
            ("scaler", StandardScaler()),
            ("model", GradientBoostingRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.05,
                subsample=0.8,
                random_state=42
            ))
        ])
        
        # Train
        pipeline.fit(X_train, y_train)
        
        # Evaluate
        y_pred = pipeline.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        log.info(f"  MAE: {mae:.5f}")
        log.info(f"  R²:  {r2:.5f}")
        
        models[f't{horizon}'] = {
            'model': pipeline,
            'mae': mae,
            'r2': r2,
            'horizon': horizon
        }
    
    # Save all models
    if save:
        with open(forecast_model_path, 'wb') as f:
            pickle.dump({
                'models': models,
                'features': FEATURES,
                'horizons': FORECAST_HORIZONS,
                'market': market
            }, f)
        log.info(f"\n✓ Forecast models saved to: {forecast_model_path}")
    
    return models


# ══════════════════════════════════════════════════════════════════════════════
# PREDICTION FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

def get_latest_features(symbol, market="US"):
    """
    Get the most recent feature values for a symbol.
    
    Parameters
    ----------
    symbol : str
        Stock ticker symbol
    market : str
        "US" or "INDIA"
    
    Returns
    -------
    dict or None
        Latest feature values, or None if symbol not found
    """
    # Select features path based on market
    if market.upper() == "INDIA":
        features_path = FEATURES_PATH_INDIA
    else:
        features_path = FEATURES_PATH_US
    
    if not os.path.exists(features_path):
        log.warning(f"Features file not found: {features_path}")
        return None
    
    df = pd.read_csv(features_path, parse_dates=['date'])
    
    symbol_data = df[df['symbol'] == symbol.upper()]
    
    if symbol_data.empty:
        return None
    
    latest = symbol_data.sort_values('date').iloc[-1]
    
    return {
        'symbol': symbol,
        'date': latest['date'],
        'volume': float(latest['volume']),
        'spread_proxy': float(latest['spread_proxy']),
        'volatility': float(latest['volatility']),
        'amihud_ratio': float(latest['amihud_ratio']),
        'current_liquidity': float(latest['liquidity_score'])
    }


def predict_future_liquidity(symbol, market="US"):
    """
    Predict future liquidity for a symbol at t+1, t+3, t+7 days.
    
    Parameters
    ----------
    symbol : str
        Stock ticker symbol
    market : str
        "US" or "INDIA"
    
    Returns
    -------
    dict
        Predictions for each horizon
    """
    # Get latest features
    features = get_latest_features(symbol, market)
    
    if features is None:
        raise ValueError(f"Symbol {symbol} not found in {market} dataset")
    
    # Select forecast model path based on market
    if market.upper() == "INDIA":
        forecast_model_path = FORECAST_MODEL_PATH_INDIA
    else:
        forecast_model_path = FORECAST_MODEL_PATH_US
    
    # Load forecast models
    if not os.path.exists(forecast_model_path):
        log.warning(f"Forecast model not found for {market}, training now...")
        train_forecasting_model(market=market)
    
    with open(forecast_model_path, 'rb') as f:
        artifact = pickle.load(f)
    
    models = artifact['models']
    
    # Prepare feature vector
    X = np.array([[
        features['volume'],
        features['spread_proxy'],
        features['volatility'],
        features['amihud_ratio']
    ]])
    
    # Predict for each horizon
    predictions = {
        'symbol': symbol,
        'current_date': str(features['date']),
        'current_liquidity': round(features['current_liquidity'], 4),
        'predictions': {}
    }
    
    for horizon_key, model_info in models.items():
        model = model_info['model']
        horizon = model_info['horizon']
        
        pred = float(model.predict(X)[0])
        pred = np.clip(pred, 0.0, 1.0)  # Ensure [0, 1] range
        
        predictions['predictions'][f't_plus_{horizon}'] = {
            'days_ahead': horizon,
            'predicted_liquidity': round(pred, 4),
            'model_mae': round(model_info['mae'], 5),
            'model_r2': round(model_info['r2'], 5)
        }
    
    return predictions


def predict_portfolio_future(portfolio, market="US"):
    """
    Predict future liquidity for an entire portfolio.
    
    Parameters
    ----------
    portfolio : list of dict
        [{"symbol": "AAPL", "qty": 50}, ...]
    market : str
        "US" or "INDIA"
    
    Returns
    -------
    dict
        Portfolio-level future predictions
    """
    predictions = []
    weights = []
    
    for holding in portfolio:
        symbol = holding['symbol']
        qty = holding['qty']
        
        try:
            pred = predict_future_liquidity(symbol, market)
            predictions.append(pred)
            weights.append(qty)
        except Exception as e:
            log.warning(f"Failed to predict {symbol}: {e}")
            continue
    
    if not predictions:
        raise ValueError("No valid predictions for portfolio")
    
    # Calculate weighted average predictions
    total_qty = sum(weights)
    
    portfolio_pred = {
        'portfolio_size': len(predictions),
        'current_liquidity': 0,
        'predictions': {}
    }
    
    # Weighted average for each horizon
    for horizon in FORECAST_HORIZONS:
        key = f't_plus_{horizon}'
        weighted_sum = sum(
            p['predictions'][key]['predicted_liquidity'] * w 
            for p, w in zip(predictions, weights)
        )
        portfolio_pred['predictions'][key] = {
            'days_ahead': horizon,
            'predicted_liquidity': round(weighted_sum / total_qty, 4)
        }
    
    # Current liquidity
    current_weighted = sum(
        p['current_liquidity'] * w 
        for p, w in zip(predictions, weights)
    )
    portfolio_pred['current_liquidity'] = round(current_weighted / total_qty, 4)
    
    portfolio_pred['asset_predictions'] = predictions
    
    return portfolio_pred


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("="*60)
    print("  PREDICTION ENGINE — FUTURE LIQUIDITY FORECASTING")
    print("="*60)
    
    # Train forecasting models
    train_forecasting_model()
    
    # Test prediction
    print("\n" + "="*60)
    print("TEST PREDICTION")
    print("="*60)
    
    test_symbols = ["AAPL", "MSFT", "GOOGL"]
    
    for symbol in test_symbols:
        try:
            result = predict_future_liquidity(symbol)
            print(f"\n{symbol}:")
            print(f"  Current: {result['current_liquidity']}")
            for key, pred in result['predictions'].items():
                print(f"  t+{pred['days_ahead']}: {pred['predicted_liquidity']}")
        except Exception as e:
            print(f"\n{symbol}: {e}")
    
    print("\n✅ Prediction engine ready")
