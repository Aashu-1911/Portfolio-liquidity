# Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd EDI
pip install -r requirements.txt
```

### Step 2: Run Automated Setup

```bash
python setup.py
```

This will guide you through the complete setup process.

### Step 3: Start the API Server

```bash
python app.py
```

Server runs on `http://localhost:5000`

### Step 4: Test the API

```bash
# Health check
curl http://localhost:5000/health

# Get available stocks
curl http://localhost:5000/stocks

# Predict future liquidity
curl -X POST http://localhost:5000/explain \
  -H "Content-Type: application/json" \
  -d '{"symbol": "AAPL"}'
```

---

## 📋 Common Commands

### Initial Setup (Run Once)

```bash
python pipeline_scheduler.py --setup
```

### Daily Pipeline

```bash
# Run once manually
python pipeline_scheduler.py --once

# Schedule daily at 5 PM
python pipeline_scheduler.py --schedule 17:00

# Run as daemon (every 24 hours)
python pipeline_scheduler.py --daemon
```

### Test Individual Modules

```bash
python data_ingestion.py test
python feature_engineering.py
python prediction_engine.py
python llm_reasoning.py
```

---

## 🔑 Optional: Enable LLM Features

1. Get an OpenAI API key from https://platform.openai.com/api-keys

2. Set environment variable:

```bash
# Windows
set OPENAI_API_KEY=your_key_here

# Linux/Mac
export OPENAI_API_KEY=your_key_here
```

Or add to `.env` file:
```
OPENAI_API_KEY=your_key_here
```

---

## 📊 API Examples

### Current Liquidity (Original Feature)

```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": [
      {"symbol": "AAPL", "qty": 50},
      {"symbol": "MSFT", "qty": 30}
    ]
  }'
```

### Future Liquidity + AI Explanation (New Feature)

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

## 🐛 Troubleshooting

### "No module named 'yfinance'"
```bash
pip install yfinance
```

### "Symbol not found in dataset"
```bash
python pipeline_scheduler.py --setup
```

### "Forecast model not found"
```bash
python prediction_engine.py
```

---

## 📚 Full Documentation

See `README_UPGRADE.md` for complete documentation.

---

## 🎯 What's New?

✅ **5 years of historical data** (vs. 3 years before)  
✅ **Automatic daily updates** (fetch new data every 24h)  
✅ **Future predictions** (t+1, t+3, t+7 days)  
✅ **AI explanations** (LangChain + LLM)  
✅ **Automated pipeline** (scheduled retraining)  
✅ **New API endpoint** (`/explain`)  

---

**Ready to go! 🚀**
