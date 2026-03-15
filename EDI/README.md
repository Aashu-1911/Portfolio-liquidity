# Portfolio Liquidity Prediction System

## 🌍 Dual Market AI-Powered Liquidity Forecasting

Predict portfolio liquidity for **US (S&P 500)** and **Indian (NIFTY 50)** markets using machine learning.

---

## ✨ Features

- 🇺🇸 **US Market** - S&P 500 stocks (~500)
- 🇮🇳 **Indian Market** - NIFTY 50 stocks (~50)
- 🤖 **ML-Powered** - Gradient Boosting predictions
- 📈 **Future Forecasting** - Predict t+1, t+3, t+7 days
- 🧠 **AI Explanations** - LangChain + LLM reasoning
- 🔄 **Auto-Updates** - Daily data refresh
- 📊 **Interactive UI** - React dashboard
- 🚀 **Easy Setup** - One-click startup

---

## 🚀 Quick Start (Windows)

### 1. Run the Project

**Double-click:** `run_project.bat`

This starts everything automatically!

### 2. Access the Application

- **US Market:** http://localhost:8080/
- **Indian Market:** http://localhost:8080/india

---

## 📋 First Time Setup

### Option 1: Interactive Menu
**Double-click:** `start_menu.bat`

### Option 2: Automated Setup
**Double-click:** `setup_dual_market.bat`

### Option 3: Manual
```cmd
pip install -r requirements.txt
python data_ingestion.py both
```

---

## 📚 Documentation

- **How to Run:** `HOW_TO_RUN.md` ⭐ START HERE
- **Dual Market Guide:** `DUAL_MARKET_SETUP.md`
- **Full Documentation:** `README_UPGRADE.md`
- **Quick Reference:** `QUICK_REFERENCE_DUAL_MARKET.md`
- **Installation:** `INSTALLATION_GUIDE.md`

---

## 🎯 What You Can Do

✅ Analyze portfolio liquidity  
✅ Predict future liquidity trends  
✅ Get AI-powered explanations  
✅ Compare US vs Indian markets  
✅ Track 500+ US stocks  
✅ Track 50+ Indian stocks  

---

## 🛠️ Tech Stack

**Backend:** Flask, Scikit-learn, yfinance, LangChain  
**Frontend:** React, TypeScript, Tailwind, Recharts  
**ML:** Gradient Boosting, Time-series forecasting  

---

## 📊 Example Usage

```bash
# US Portfolio
curl -X POST http://localhost:5000/predict \
  -d '{"market":"US","portfolio":[{"symbol":"AAPL","qty":50}]}'

# Indian Portfolio
curl -X POST http://localhost:5000/predict \
  -d '{"market":"INDIA","portfolio":[{"symbol":"RELIANCE.NS","qty":100}]}'
```

---

## 🆘 Need Help?

See `HOW_TO_RUN.md` for detailed instructions.

---

**Made with ❤️ for portfolio analysis**
