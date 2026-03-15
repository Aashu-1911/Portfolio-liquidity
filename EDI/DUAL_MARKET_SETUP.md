# Dual Market Setup Guide (US + India)

## 🌍 Overview

The system now supports **two separate markets**:
- **US Market:** S&P 500 stocks
- **Indian Market:** NIFTY 50 and NSE stocks

Each market has:
- Separate datasets
- Separate ML models
- Separate API endpoints
- Separate frontend pages

---

## 📁 File Structure

```
EDI/
├── US Market Files
│   ├── raw_sp500_data.csv
│   ├── cleaned_sp500.csv
│   ├── liquidity_features.csv
│   └── model.pkl
│
├── Indian Market Files
│   ├── raw_nifty_data.csv
│   ├── cleaned_nifty.csv
│   ├── liquidity_features_india.csv
│   └── model_india.pkl
│
└── Shared Files
    ├── app.py (handles both markets)
    ├── data_ingestion.py (supports both)
    └── ... (other modules)
```

---

## 🚀 Setup Instructions

### 1. Fetch US Market Data

```bash
python data_ingestion.py historical US
```

### 2. Fetch Indian Market Data

```bash
python data_ingestion.py historical INDIA
```

### 3. Fetch Both Markets at Once

```bash
python data_ingestion.py both
```

### 4. Process and Train Models

```bash
# US Market
python feature_engineering.py --market US
python train_liquidity_model.py --market US

# Indian Market
python feature_engineering.py --market INDIA
python train_liquidity_model.py --market INDIA
```

---

## 🌐 API Usage

### Health Check

**US Market:**
```bash
curl "http://localhost:5000/health?market=US"
```

**Indian Market:**
```bash
curl "http://localhost:5000/health?market=INDIA"
```

### Get Stocks

**US Market:**
```bash
curl "http://localhost:5000/stocks?market=US"
```

**Indian Market:**
```bash
curl "http://localhost:5000/stocks?market=INDIA"
```

### Predict Liquidity

**US Portfolio:**
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "market": "US",
    "portfolio": [
      {"symbol": "AAPL", "qty": 50},
      {"symbol": "MSFT", "qty": 30}
    ]
  }'
```

**Indian Portfolio:**
```bash
curl -X POST http://localhost:5000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "market": "INDIA",
    "portfolio": [
      {"symbol": "RELIANCE.NS", "qty": 100},
      {"symbol": "TCS.NS", "qty": 50}
    ]
  }'
```

---

## 🔄 Daily Updates

### Update US Market

```bash
python data_ingestion.py update US
```

### Update Indian Market

```bash
python data_ingestion.py update INDIA
```

### Automated Pipeline

The pipeline scheduler now supports both markets:

```bash
# Schedule both markets
python pipeline_scheduler.py --schedule 17:00 --markets both
```

---

## 🎨 Frontend Pages

### US Market Page
- URL: `http://localhost:8080/`
- Shows S&P 500 stocks
- Uses US market API endpoints

### Indian Market Page
- URL: `http://localhost:8080/india`
- Shows NIFTY stocks
- Uses Indian market API endpoints

---

## 📊 Indian Stock Symbols

Indian stocks use NSE (National Stock Exchange) format with `.NS` suffix:

**Examples:**
- `RELIANCE.NS` — Reliance Industries
- `TCS.NS` — Tata Consultancy Services
- `HDFCBANK.NS` — HDFC Bank
- `INFY.NS` — Infosys
- `ICICIBANK.NS` — ICICI Bank

**Full NIFTY 50 List:**
The system automatically fetches the current NIFTY 50 constituents from Wikipedia.

---

## 🧪 Testing

### Test US Market

```bash
python data_ingestion.py test US
```

### Test Indian Market

```bash
python data_ingestion.py test INDIA
```

---

## 🔧 Configuration

Edit `config.py` to customize:

```python
# Market-specific settings
US_SYMBOL_LIMIT = None  # None = all S&P 500
INDIA_SYMBOL_LIMIT = None  # None = all NIFTY 50

# Data sources
US_DATA_SOURCE = "S&P500"
INDIA_DATA_SOURCE = "NIFTY50"
```

---

## 📈 Performance Notes

### Data Fetching Times

**US Market (S&P 500):**
- ~500 stocks
- ~15-30 minutes for 5 years

**Indian Market (NIFTY 50):**
- ~50 stocks
- ~5-10 minutes for 5 years

### API Response Times

Both markets have similar performance:
- `/health`: <10ms
- `/stocks`: <50ms
- `/predict`: 50-200ms

---

## 🚨 Important Notes

1. **Symbol Format:**
   - US: Plain symbols (e.g., `AAPL`, `MSFT`)
   - India: NSE format with `.NS` suffix (e.g., `RELIANCE.NS`)

2. **Market Hours:**
   - US: 9:30 AM - 4:00 PM EST
   - India: 9:15 AM - 3:30 PM IST

3. **Currency:**
   - US: USD ($)
   - India: INR (₹)

4. **Data Source:**
   - Both markets use yfinance API
   - Indian data from NSE (National Stock Exchange)

---

## 🔄 Migration from Single Market

If you have existing US market data:

1. Your existing files remain unchanged
2. Indian market uses separate files
3. API is backward compatible (defaults to US)
4. Frontend can switch between markets

---

## 📝 Next Steps

1. ✅ Fetch data for both markets
2. ✅ Train models for both markets
3. ✅ Test API endpoints
4. ✅ Update frontend to show both pages
5. ✅ Schedule daily updates for both

---

**Both Markets Ready! 🌍🇺🇸🇮🇳**
