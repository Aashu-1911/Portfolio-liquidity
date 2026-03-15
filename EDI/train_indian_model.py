import pandas as pd
import numpy as np
import pickle
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# Load Indian features
df = pd.read_csv('liquidity_features_india.csv', parse_dates=['date'])
print(f"Loaded {len(df)} rows")

# Features and target
FEATURES = ['volume', 'spread_proxy', 'volatility', 'amihud_ratio']
TARGET = 'liquidity_score'

df_model = df[FEATURES + [TARGET]].dropna()
X = df_model[FEATURES].values
y = df_model[TARGET].values

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)

# Train model
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

print("Training Indian market model...")
pipeline.fit(X_train, y_train)

# Evaluate
y_pred = pipeline.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)

print(f"MAE: {mae:.5f}")
print(f"R²: {r2:.5f}")

# Save model
with open('model_india.pkl', 'wb') as f:
    pickle.dump({
        "model": pipeline,
        "model_name": "Gradient Boosting",
        "features": FEATURES,
        "target": TARGET,
        "metrics": {"MAE": mae, "R2": r2},
    }, f)

print("✓ Model saved to model_india.pkl")
