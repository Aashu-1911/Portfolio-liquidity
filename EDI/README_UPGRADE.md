# Portfolio Liquidity Prediction System — AI Upgrade

## 🚀 Overview

This is an **AI-powered, self-updating liquidity forecasting engine** that:

- ✅ Trains on **5 years of historical stock data**
- ✅ **Automatically updates** dataset every 24 hours
- ✅ **Retrains ML models** when new data arrives
- ✅ **Predicts future liquidity** (t+1, t+3, t+7 days)
- ✅ Uses **LangChain + LLM** to explain predictions

---

## 📁 Project Structure

```
EDI/
├── app.py                      # Flask API (extended with /explain endpoint)
├── data_ingestion.py           # NEW: Fetch market data via yfinance
├── feature_engineering.py      # NEW: Automated feature computation
├── prediction_engine.py        # NEW: Future liquidity forecasting
├── llm_reasoning.py            # NEW: LangChain LLM explanations
├── pipeline_scheduler.py       # NEW: Daily automation orchestrator
├── requirements.txt            # NEW: All dependencies
│
├── Model Training/
│   ├── train_liquidity_model.py   # Updated: Now callable as function
│   ├── process_sp500.py           # Updated: Reusable data processing
│   ├── liquidity_features.py      # Original feature script
│   └── Portfolio_liquidity.py     # Original portfolio analysis
│
├── model.pkl                   # Trained ML model (current liquidity)
├── forecast_model.pkl          # NEW: Future prediction models
├── cleaned_sp500.csv           # Processed stock data
├── liquidity_features.csv      # Computed features
└── raw_sp500_data.csv          # NEW: Raw historical data
```

---

## 🔧 Installation

### 1. Install Dependencies

```bash
cd EDI
pip install -r requirements.txt
```

### 2. Set Up OpenAI API Key (Optional, for LLM features)

```bash
# Windows
set OPENAI_API_KEY=your_api_key_here

# Linux/Mac
export OPENAI_API_KEY=your_api_key_here
```

Or create a `.env` file:
```
OPENAI_API_KEY=your_api_key_here
```

---

## 🎯 Quick Start

### Initial Setup (Run Once)

Fetch 5 years of historical data and train models:

```bash
python pipeline_scheduler.py --setup
```

This will:
1. Download 5 years of S&P 500 data via yfinance
2. Process and clean the data
3. Compute liquidity features
4. Train ML models (current + forecasting)

**Note:** This may take 10-30 minutes depending on your connection.

---

## 🔄 Daily Automation

### Option 1: Run Once Manually

```bash
python pipeline_scheduler.py --once
```

### Option 2: Schedule Daily at 5 PM (After Market Close)

```bash
python pipeline_scheduler.py --schedule 17:00
```

### Option 3: Run as Background Daemon (Every 24 Hours)

```bash
python pipeline_scheduler.py --daemon
```

---

## 🌐 API Endpoints

### Start Flask Server

```bash
python app.py
```

Server runs on `http://localhost:5000`

### 1. Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "model": "Gradient Boosting",
  "model_r2": 0.8542,
  "symbols_count": 503
}
```

### 2. Get Available Stocks

```bash
GET /stocks
```

Response:
```json
{
  "count": 503,
  "symbols": ["AAPL", "MSFT", "GOOGL", ...]
}
```

### 3. Current Liquidity Prediction (Original)

```bash
POST /predict
Content-Type: application/json

{
  "portfolio": [
    {"symbol": "AAPL", "qty": 50},
    {"symbol": "MSFT", "qty": 30}
  ]
}
```

Response:
```json
{
  "liquidity_score": 0.7234,
  "risk_level": "Moderate Risk",
  "liquidation_time": "2.3 hrs",
  "price_impact": "1.8%",
  "portfolio_value": "$24,326.00",
  "asset_breakdown": [...]
}
```

### 4. Future Liquidity Prediction + AI Explanation (NEW)

```bash
POST /explain
Content-Type: application/json

{
  "symbol": "AAPL"
}
```

Response:
```json
{
  "symbol": "AAPL",
  "current_liquidity": 0.7500,
  "predicted_liquidity_tomorrow": 0.7300,
  "predicted_liquidity_3_days": 0.7000,
  "predicted_liquidity_7_days": 0.6800,
  "ai_explanation": "Liquidity for AAPL is gradually declining over the next week. This trend is driven by decreasing trading volume, rising price volatility. Investors may face higher transaction costs and should consider timing their trades carefully.",
  "market_context": {
    "volume_trend_pct": -12.5,
    "volatility_trend_pct": 18.3,
    "spread_trend_pct": 5.2
  }
}
```

**Portfolio Prediction:**

```bash
POST /explain
Content-Type: application/json

{
  "portfolio": [
    {"symbol": "AAPL", "qty": 50},
    {"symbol": "MSFT", "qty": 30}
  ]
}
```

---

## 🧠 How It Works

### Data Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    DAILY PIPELINE                           │
└─────────────────────────────────────────────────────────────┘

1. Fetch Latest Market Data (yfinance)
   ↓
2. Update Dataset (append new rows)
   ↓
3. Process & Clean Data (handle missing values)
   ↓
4. Compute Liquidity Features
   - spread_proxy = (high - low) / close
   - volatility = 30-day rolling std
   - amihud_ratio = |return| / volume
   - liquidity_score = weighted composite
   ↓
5. Retrain ML Model (Gradient Boosting)
   ↓
6. Train Forecasting Models (t+1, t+3, t+7)
   ↓
7. Ready for Predictions
```

### ML Models

**Current Liquidity Model:**
- Algorithm: Gradient Boosting Regressor
- Features: volume, spread_proxy, volatility, amihud_ratio
- Target: liquidity_score (0-1)
- Saved as: `model.pkl`

**Forecasting Models:**
- 3 separate models for t+1, t+3, t+7 days
- Uses shifted target variables
- Saved as: `forecast_model.pkl`

### LLM Reasoning

Uses LangChain to generate explanations:

1. Extract recent market context (30-day trends)
2. Analyze prediction direction
3. Identify key drivers (volume, volatility, spread)
4. Generate natural language explanation
5. Provide investor guidance

**Fallback:** If OpenAI API key not set, uses rule-based explanations.

---

## 📊 Module Details

### `data_ingestion.py`

**Functions:**
- `fetch_historical_data(period="5y")` — Download historical data
- `fetch_latest_market_data(days_back=5)` — Get recent data
- `update_dataset()` — Append new data to existing CSV
- `get_sp500_symbols()` — Fetch S&P 500 ticker list

**CLI:**
```bash
python data_ingestion.py historical  # Fetch 5 years
python data_ingestion.py update      # Fetch latest
python data_ingestion.py test        # Test with 5 stocks
```

### `feature_engineering.py`

**Functions:**
- `compute_liquidity_features(df)` — Calculate all features
- `run_feature_pipeline()` — Complete pipeline

**CLI:**
```bash
python feature_engineering.py
```

### `prediction_engine.py`

**Functions:**
- `train_forecasting_model()` — Train t+1, t+3, t+7 models
- `predict_future_liquidity(symbol)` — Single stock forecast
- `predict_portfolio_future(portfolio)` — Portfolio forecast
- `get_latest_features(symbol)` — Extract current features

**CLI:**
```bash
python prediction_engine.py
```

### `llm_reasoning.py`

**Functions:**
- `explain_liquidity_prediction(prediction_data)` — Generate explanation
- `get_market_context(symbol, days_back=30)` — Extract trends
- `analyze_liquidity_trend(symbol, days_back=90)` — Long-term analysis

**CLI:**
```bash
python llm_reasoning.py
```

### `pipeline_scheduler.py`

**Functions:**
- `run_complete_pipeline()` — Execute full pipeline
- `run_initial_setup()` — First-time setup
- `schedule_daily_pipeline(run_time)` — Schedule automation

**CLI:**
```bash
python pipeline_scheduler.py --setup              # Initial setup
python pipeline_scheduler.py --once               # Run once
python pipeline_scheduler.py --daemon             # Every 24h
python pipeline_scheduler.py --schedule 17:00     # Daily at 5 PM
```

---

## 🔍 Testing

### Test Individual Modules

```bash
# Test data ingestion
python data_ingestion.py test

# Test feature engineering
python feature_engineering.py

# Test prediction engine
python prediction_engine.py

# Test LLM reasoning
python llm_reasoning.py
```

### Test API Endpoints

```bash
# Start server
python app.py

# Test in another terminal
curl http://localhost:5000/health

curl -X POST http://localhost:5000/explain \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

---

## 📈 Performance

**Model Metrics (Example):**
- Current Liquidity Model: R² = 0.85, MAE = 0.042
- Forecasting Models:
  - t+1: R² = 0.82, MAE = 0.048
  - t+3: R² = 0.78, MAE = 0.055
  - t+7: R² = 0.74, MAE = 0.063

**Data Coverage:**
- 500+ S&P 500 stocks
- 5 years of historical data
- ~600,000+ data points

---

## 🛠️ Troubleshooting

### Issue: "No module named 'yfinance'"

```bash
pip install yfinance
```

### Issue: "LangChain not available"

```bash
pip install langchain langchain-openai openai
```

### Issue: "Symbol not found in dataset"

Run initial setup to fetch data:
```bash
python pipeline_scheduler.py --setup
```

### Issue: "Forecast model not found"

Train forecasting models:
```bash
python prediction_engine.py
```

### Issue: Rate limiting from yfinance

Add delays in `data_ingestion.py` or reduce number of symbols.

---

## 🔐 Security Notes

- **API Keys:** Never commit `.env` files or API keys to version control
- **CORS:** Current setup allows all origins (`*`). Restrict in production.
- **Rate Limiting:** Consider adding rate limiting for production APIs

---

## 🚀 Production Deployment

### Using systemd (Linux)

Create `/etc/systemd/system/liquidity-pipeline.service`:

```ini
[Unit]
Description=Portfolio Liquidity Pipeline
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/EDI
ExecStart=/usr/bin/python3 pipeline_scheduler.py --daemon
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable liquidity-pipeline
sudo systemctl start liquidity-pipeline
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "pipeline_scheduler.py", "--daemon"]
```

Build and run:
```bash
docker build -t liquidity-pipeline .
docker run -d --name pipeline liquidity-pipeline
```

---

## 📝 Future Enhancements

- [ ] Add more data sources (Polygon, Alpha Vantage)
- [ ] Implement incremental model updates (online learning)
- [ ] Add real-time WebSocket streaming
- [ ] Create admin dashboard for monitoring
- [ ] Add email/Slack alerts for pipeline failures
- [ ] Implement A/B testing for model versions
- [ ] Add support for international markets

---

## 📄 License

Same as original project.

---

## 🤝 Contributing

Contributions welcome! Please test thoroughly before submitting PRs.

---

## 📧 Support

For issues or questions, please check the troubleshooting section first.

---

**Built with ❤️ using Flask, Scikit-learn, LangChain, and yfinance**
