# Quick Reference - Dual Market System

## 🚀 Setup (One-Time)

```bash
# Automated setup (recommended)
./setup_dual_market.sh        # Linux/Mac
setup_dual_market.bat          # Windows

# OR Manual setup
python data_ingestion.py both
```

---

## 🌐 Web Pages

| Market | URL | Stocks |
|--------|-----|--------|
| 🇺🇸 US | `http://localhost:8080/` | S&P 500 (~500) |
| 🇮🇳 India | `http://localhost:8080/india` | NIFTY 50 (~50) |

---

## 📡 API Endpoints

### Health Check
```bash
curl "http://localhost:5000/health?market=US"
curl "http://localhost:5000/health?market=INDIA"
```

### Get Stocks
```bash
curl "http://localhost:5000/stocks?market=US"
curl "http://localhost:5000/stocks?market=INDIA"
```

### Predict
```bash
# US
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"market":"US","portfolio":[{"symbol":"AAPL","qty":50}]}'

# India
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"market":"INDIA","portfolio":[{"symbol":"RELIANCE.NS","qty":100}]}'
```

---

## 🔄 Daily Updates

```bash
python data_ingestion.py update US      # Update US data
python data_ingestion.py update INDIA   # Update Indian data
```

---

## 🧪 Testing

```bash
python data_ingestion.py test US        # Test with 5 US stocks
python data_ingestion.py test INDIA     # Test with 5 Indian stocks
```

---

## 📊 Symbol Format

| Market | Format | Examples |
|--------|--------|----------|
| US | Plain | `AAPL`, `MSFT`, `GOOGL` |
| India | .NS suffix | `RELIANCE.NS`, `TCS.NS`, `INFY.NS` |

---

## 🗂️ Data Files

| Market | Raw Data | Cleaned | Features | Model |
|--------|----------|---------|----------|-------|
| US | `raw_sp500_data.csv` | `cleaned_sp500.csv` | `liquidity_features.csv` | `model.pkl` |
| India | `raw_nifty_data.csv` | `cleaned_nifty.csv` | `liquidity_features_india.csv` | `model_india.pkl` |

---

## 🎯 Popular Stocks

### US (S&P 500)
```
AAPL, MSFT, GOOGL, AMZN, META, TSLA, NVDA, JPM, V, JNJ
```

### India (NIFTY 50)
```
RELIANCE.NS, TCS.NS, HDFCBANK.NS, INFY.NS, ICICIBANK.NS,
HINDUNILVR.NS, ITC.NS, SBIN.NS, BHARTIARTL.NS, KOTAKBANK.NS
```

---

## 🚦 Start Servers

```bash
# Backend
python app.py

# Frontend
cd portfolio-liquidity-insight-main
npm run dev
```

---

## 📚 Documentation

- Full Setup: `DUAL_MARKET_SETUP.md`
- Summary: `DUAL_MARKET_SUMMARY.md`
- Original Docs: `README_UPGRADE.md`

---

## ✅ Quick Check

```bash
# Check if both markets are ready
curl "http://localhost:5000/health?market=US" | grep "ok"
curl "http://localhost:5000/health?market=INDIA" | grep "ok"
```

---

**Both Markets Ready! 🌍**
