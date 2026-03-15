import pandas as pd
import numpy as np
import pickle
import warnings
warnings.filterwarnings('ignore')

from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, HistGradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

# ─────────────────────────────────────────────
# CONFIGURE PATHS HERE
# ─────────────────────────────────────────────
DATA_PATH  = 'liquidity_features.csv'   # ← update to your path
MODEL_PATH = 'model.pkl'                # ← update to your path

# ─────────────────────────────────────────────
# 1. LOAD DATASET
# ─────────────────────────────────────────────
def train_liquidity_model():
    """
    Train liquidity prediction model.
    
    Returns
    -------
    dict
        Model metrics (MAE, RMSE, R2)
    """
    print("=" * 60)
    print("  LIQUIDITY SCORE PREDICTION — ML PIPELINE")
    print("=" * 60)

    df = pd.read_csv(DATA_PATH, parse_dates=['date'])
    print(f"\n✔ Loaded dataset: {df.shape[0]:,} rows, {df.shape[1]} columns")

# ─────────────────────────────────────────────
# 2. FEATURE & TARGET SELECTION
# ─────────────────────────────────────────────
FEATURES = ['volume', 'spread_proxy', 'volatility', 'amihud_ratio']
TARGET   = 'liquidity_score'

df_model = df[FEATURES + [TARGET]].dropna()
print(f"✔ After dropping NaNs: {df_model.shape[0]:,} rows")

X = df_model[FEATURES].values
y = df_model[TARGET].values

print(f"\n── Features ──────────────────────────────────")
for f, mean, std in zip(FEATURES, X.mean(axis=0), X.std(axis=0)):
    print(f"   {f:<20s}  mean={mean:.5f}  std={std:.5f}")
print(f"   {'target: liquidity_score':<20s}  mean={y.mean():.5f}  std={y.std():.5f}")

# ─────────────────────────────────────────────
# 3. TRAIN / TEST SPLIT  (80 / 20)
# ─────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20
)
print(f"\n✔ Train size : {X_train.shape[0]:,}")
print(f"✔ Test  size : {X_test.shape[0]:,}")

# ─────────────────────────────────────────────
# 4. MODEL DEFINITIONS
# ─────────────────────────────────────────────
models = {
    "Random Forest": Pipeline([
        ("scaler", StandardScaler()),
        ("model", RandomForestRegressor(
            n_estimators=50,  # reduced
            max_depth=10,
            min_samples_leaf=5,
            n_jobs=-1
        ))
    ]),
    # "Gradient Boosting": Pipeline([
    #     ("scaler", StandardScaler()),
    #     ("model", GradientBoostingRegressor(
    #         n_estimators=50,
    #         max_depth=5,
    #         learning_rate=0.05,
    #         subsample=0.8
    #     ))
    # ]),
    # "XGBoost (HistGB)": Pipeline([
    #     ("scaler", StandardScaler()),
    #     ("model", HistGradientBoostingRegressor(
    #         max_iter=50,
    #         max_depth=6,
    #         learning_rate=0.05,
    #         min_samples_leaf=20
    #     ))
    # ]),
}

# ─────────────────────────────────────────────
# 5. TRAIN & EVALUATE
# ─────────────────────────────────────────────
print("\n── Training Models ───────────────────────────")

results = {}
trained_models = {}

for name, pipeline in models.items():
    print(f"\n   ▸ {name} ... ", end="", flush=True)
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)

    mae  = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2   = r2_score(y_test, y_pred)

    results[name]        = {"MAE": mae, "RMSE": rmse, "R2": r2}
    trained_models[name] = pipeline
    print(f"done  →  MAE={mae:.5f}  RMSE={rmse:.5f}  R²={r2:.5f}")

# ─────────────────────────────────────────────
# 6. COMPARISON TABLE
# ─────────────────────────────────────────────
print("\n" + "=" * 60)
print("  MODEL COMPARISON")
print("=" * 60)
print(f"{'Model':<22}  {'MAE':>9}  {'RMSE':>9}  {'R²':>9}")
print("-" * 55)

# FIX 1: best_r2 was never updated inside the loop — find best model first,
#         then print the table with the marker applied correctly.
best_name = max(results, key=lambda k: results[k]["R2"])
best_r2   = results[best_name]["R2"]

for name, m in results.items():
    marker = "  ◀ best" if name == best_name else ""
    print(f"  {name:<20}  {m['MAE']:>9.6f}  {m['RMSE']:>9.6f}  {m['R2']:>9.6f}{marker}")

print("-" * 55)
print(f"\n🏆  Best model: {best_name}  (R² = {best_r2:.6f})")

# ─────────────────────────────────────────────
# 7. FEATURE IMPORTANCES (best model)
# ─────────────────────────────────────────────
best_pipeline = trained_models[best_name]
inner_model   = best_pipeline.named_steps["model"]

if hasattr(inner_model, "feature_importances_"):
    importances = inner_model.feature_importances_
    print(f"\n── Feature Importances ({best_name}) ─────────────")
    for feat, imp in sorted(zip(FEATURES, importances), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"   {feat:<20s}  {bar:<40s}  {imp:.4f}")

# ─────────────────────────────────────────────
# 8. SAVE BEST MODEL
# ─────────────────────────────────────────────
with open(MODEL_PATH, 'wb') as f:
    pickle.dump({
        "model":      best_pipeline,
        "model_name": best_name,
        "features":   FEATURES,
        "target":     TARGET,
        "metrics":    results[best_name],
    }, f)
print(f"\n✔ Model saved → {MODEL_PATH}")

# Test load
with open(MODEL_PATH, 'rb') as f:
    test_artifact = pickle.load(f)
print("✔ Model loaded successfully")

# Return metrics for pipeline
return results[best_name]

# Return metrics for pipeline
    return results[best_name]


# ─────────────────────────────────────────────
# 9. PREDICTION FUNCTION
# ─────────────────────────────────────────────
def predict_liquidity(features):
    """
    Predict the liquidity score for one or more observations.

    Parameters
    ----------
    features : dict or list of dicts
        Keys: volume, spread_proxy, volatility, amihud_ratio

    Returns
    -------
    float or list of floats
        Predicted liquidity score(s) in [0, 1]

    Examples
    --------
    >>> predict_liquidity({"volume": 2_500_000, "spread_proxy": 0.015,
    ...                    "volatility": 0.012, "amihud_ratio": 0.003})
    0.5241...
    """
    with open(MODEL_PATH, 'rb') as f:
        artifact = pickle.load(f)
    mdl      = artifact["model"]
    cols     = artifact["features"]

    if isinstance(features, dict):
        X_new = np.array([[features[c] for c in cols]])
    elif isinstance(features, list) and isinstance(features[0], dict):
        X_new = np.array([[row[c] for c in cols] for row in features])
    else:
        # FIX 2: avoid calling np.array() twice; compute once, then reshape
        X_new = np.array(features)
        if X_new.ndim == 1:
            X_new = X_new.reshape(1, -1)

    preds = mdl.predict(X_new)
    return float(preds[0]) if len(preds) == 1 else preds.tolist()


# ─────────────────────────────────────────────
# 10. SMOKE TEST — predict_liquidity()
# ─────────────────────────────────────────────
print("\n── predict_liquidity() — smoke test ─────────")

test_cases = [
    {"label": "High liquidity (large cap, tight spread)",
     "features": {"volume": 10_000_000, "spread_proxy": 0.008,
                  "volatility": 0.008, "amihud_ratio": 0.0005}},
    {"label": "Avg liquidity",
     "features": {"volume": 2_000_000, "spread_proxy": 0.016,
                  "volatility": 0.013, "amihud_ratio": 0.003}},
    {"label": "Low liquidity (thin volume, wide spread)",
     "features": {"volume": 200_000, "spread_proxy": 0.060,
                  "volatility": 0.040, "amihud_ratio": 0.050}},
]

for tc in test_cases:
    score = predict_liquidity(tc["features"])
    print(f"   {tc['label']}")
    print(f"   → predicted liquidity score: {score:.4f}\n")

print("✅  Pipeline complete.")


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    # Run training when executed directly
    train_liquidity_model()
    
    print("\n── predict_liquidity() — smoke test ─────────")
    
    test_cases = [
        {"label": "High liquidity (large cap, tight spread)",
         "features": {"volume": 10_000_000, "spread_proxy": 0.008,
                      "volatility": 0.008, "amihud_ratio": 0.0005}},
        {"label": "Avg liquidity",
         "features": {"volume": 2_000_000, "spread_proxy": 0.016,
                      "volatility": 0.013, "amihud_ratio": 0.003}},
        {"label": "Low liquidity (thin volume, wide spread)",
         "features": {"volume": 200_000, "spread_proxy": 0.060,
                      "volatility": 0.040, "amihud_ratio": 0.050}},
    ]
    
    for tc in test_cases:
        score = predict_liquidity(tc["features"])
        print(f"   {tc['label']}")
        print(f"   → predicted liquidity score: {score:.4f}\n")
    
    print("✅  Pipeline complete.")