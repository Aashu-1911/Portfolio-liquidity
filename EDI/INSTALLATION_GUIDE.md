# Complete Installation & Usage Guide

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Initial Setup](#initial-setup)
5. [Running the System](#running-the-system)
6. [API Usage](#api-usage)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required
- Python 3.8 or higher
- pip (Python package manager)
- Internet connection (for data fetching)

### Optional
- OpenAI API key (for LLM explanations)
- Git (for version control)

### Check Python Version
```bash
python --version
# Should show Python 3.8.x or higher
```

---

## Installation

### Method 1: Automated Setup (Recommended)

```bash
# Navigate to project directory
cd EDI

# Run automated setup
python setup.py
```

This will:
- Check Python version
- Install all dependencies
- Create .env template
- Optionally fetch historical data
- Verify installation

### Method 2: Manual Installation

```bash
# Navigate to project directory
cd EDI

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your settings
# (Optional) Add OpenAI API key
```

---

## Configuration

### 1. Environment Variables (.env)

Edit the `.env` file:

```bash
# Required for LLM features (optional)
OPENAI_API_KEY=your_key_here

# Flask settings
FLASK_ENV=development
FLASK_DEBUG=True
FLASK_PORT=5000

# Pipeline settings
PIPELINE_RUN_TIME=17:00
```

### 2. System Configuration (config.py)

Advanced users can modify `config.py`:

```python
# Data settings
HISTORICAL_PERIOD = "5y"
SYMBOL_LIMIT = None  # None = all S&P 500

# Model settings
FORECAST_HORIZONS = [1, 3, 7]  # Days ahead

# LLM settings
LLM_MODEL = "gpt-3.5-turbo"
```

---

## Initial Setup

### Fetch Historical Data (Required)

This downloads 5 years of S&P 500 data and trains models:

```bash
python pipeline_scheduler.py --setup
```

**Time:** 10-30 minutes  
**Data:** ~500 stocks, 5 years  
**Output:** 
- `raw_sp500_data.csv`
- `cleaned_sp500.csv`
- `liquidity_features.csv`
- `model.pkl`
- `forecast_model.pkl`

### Quick Test (Optional)

Test with limited data (5 stocks, 1 year):

```bash
python data_ingestion.py test
python feature_engineering.py
python prediction_engine.py
```

---

## Running the System

### 1. Start API Server

```bash
python app.py
```

Server runs on `http://localhost:5000`

**Endpoints:**
- `GET /health` — API status
- `GET /stocks` — Available symbols
- `POST /predict` — Current liquidity
- `POST /explain` — Future predictions + AI explanation

### 2. Daily Pipeline Automation

Choose one option:

#### Option A: Run Once Manually
```bash
python pipeline_scheduler.py --once
```

#### Option B: Schedule Daily (5 PM)
```bash
python pipeline_scheduler.py --schedule 17:00
```

#### Option C: Background Daemon (Every 24h)
```bash
python pipeline_scheduler.py --daemon
```

#### Option D: System Service (Linux)

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

Enable:
```bash
sudo systemctl enable liquidity-pipeline
sudo systemctl start liquidity-pipeline
```

---

## API Usage

### Test Connection

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "model": "Gradient Boosting",
  "model_r2": 0.8542,
  "symbols_count": 503
}
```

### Get Available Stocks

```bash
curl http://localhost:5000/stocks
```

### Current Liquidity Analysis

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      {"symbol": "AAPL", "qty": 50},
      {"symbol": "MSFT", "qty": 30},
      {"symbol": "GOOGL", "qty": 10}
    ]
  }'
```

### Future Predictions + AI Explanation

**Single Stock:**
```bash
curl -X POST http://localhost:5000/explain \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

**Portfolio:**
```bash
curl -X POST http://localhost:5000/explain \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      {"symbol": "AAPL", "qty": 50},
      {"symbol": "MSFT", "qty": 30}
    ]
  }'
```

---

## Troubleshooting

### Common Issues

#### 1. "No module named 'yfinance'"

**Solution:**
```bash
pip install yfinance
```

#### 2. "Symbol not found in dataset"

**Solution:** Run initial setup
```bash
python pipeline_scheduler.py --setup
```

#### 3. "Forecast model not found"

**Solution:** Train forecasting models
```bash
python prediction_engine.py
```

#### 4. "Connection refused" (API)

**Solution:** Start Flask server
```bash
python app.py
```

#### 5. Rate limiting from yfinance

**Solution:** Reduce symbols or add delays in `config.py`:
```python
SYMBOL_LIMIT = 50  # Instead of None
API_DELAY = 0.2    # Increase delay
```

#### 6. LLM features not working

**Solution:** Check API key
```bash
# Windows
echo %OPENAI_API_KEY%

# Linux/Mac
echo $OPENAI_API_KEY
```

If not set:
```bash
# Windows
set OPENAI_API_KEY=your_key_here

# Linux/Mac
export OPENAI_API_KEY=your_key_here
```

### Check Logs

```bash
# View pipeline logs
cat pipeline.log

# Follow logs in real-time
tail -f pipeline.log
```

### Run Tests

```bash
python test_system.py
```

### Verify Installation

```bash
# Check all files exist
ls -la *.py *.md *.txt

# Test imports
python -c "import data_ingestion, feature_engineering, prediction_engine"

# Check data files
ls -lh *.csv *.pkl
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERFACE                           │
│                  (React Frontend)                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    FLASK API (app.py)                       │
│  /health  /stocks  /predict  /explain                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  PREDICTION ENGINE                          │
│  • Current Liquidity Model (model.pkl)                      │
│  • Forecasting Models (forecast_model.pkl)                  │
│  • LLM Reasoning (llm_reasoning.py)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  DATA PIPELINE                              │
│  1. Data Ingestion (yfinance)                               │
│  2. Data Processing (cleaning)                              │
│  3. Feature Engineering (liquidity metrics)                 │
│  4. Model Training (ML)                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  AUTOMATION                                 │
│  • Daily Updates (pipeline_scheduler.py)                    │
│  • Scheduled Retraining                                     │
│  • Logging & Monitoring                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Performance Expectations

### Initial Setup
- Data fetch: 10-30 minutes
- Feature computation: 1-2 minutes
- Model training: 2-3 minutes
- **Total:** ~15-35 minutes

### Daily Updates
- Data fetch: 2-5 minutes
- Processing: 30 seconds
- Retraining: 1-2 minutes
- **Total:** ~4-8 minutes

### API Response Times
- `/health`: <10ms
- `/stocks`: <50ms
- `/predict`: 50-200ms
- `/explain`: 200-500ms (with LLM)

---

## Next Steps

1. ✅ Complete installation
2. ✅ Run initial setup
3. ✅ Start API server
4. ✅ Test endpoints
5. ✅ Schedule daily pipeline
6. 📊 Monitor logs
7. 🚀 Deploy to production

---

## Additional Resources

- **Quick Start:** `QUICK_START.md`
- **Full Documentation:** `README_UPGRADE.md`
- **Upgrade Summary:** `UPGRADE_SUMMARY.md`
- **Configuration:** `config.py`
- **Tests:** `test_system.py`

---

## Support

### Documentation
- Installation: This file
- Quick reference: `QUICK_START.md`
- Complete guide: `README_UPGRADE.md`

### Testing
```bash
python test_system.py
```

### Logs
```bash
tail -f pipeline.log
```

### Community
- Check existing issues
- Review documentation
- Test with small dataset first

---

**Installation Complete! 🎉**

Start the API server:
```bash
python app.py
```

Then visit: `http://localhost:5000/health`
