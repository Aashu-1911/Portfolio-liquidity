# Testing Guide - AI Features

## ✅ Backend Status
Both servers are running:
- **Flask Backend**: http://localhost:5000 ✅
- **React Frontend**: http://localhost:8080 ✅

## 🎯 New Features Available

### 1. Future Liquidity Predictions
The system now predicts liquidity for:
- **t+1**: Tomorrow
- **t+3**: 3 days ahead
- **t+7**: 7 days ahead

### 2. AI Explanations
Rule-based AI explanations analyze:
- Liquidity trends
- Market factors (volume, spread, volatility)
- Investment recommendations

## 🧪 How to Test

### Step 1: Open the US Market Page
1. Open browser: http://localhost:8080/
2. You should see "Portfolio Liquidity Prediction 🇺🇸 US Market"

### Step 2: Build a Portfolio
1. Click "Add Position" button
2. Search for stocks (e.g., AAPL, MSFT, GOOGL)
3. Enter quantities (e.g., 10, 5, 8)
4. Click "Analyze Liquidity"

### Step 3: View Basic Analysis
You'll see:
- Overall liquidity score
- Risk level
- Liquidation time
- Price impact
- Asset breakdown table
- Charts

### Step 4: Get AI Predictions
1. Click the **"Get Future Predictions & AI Analysis"** button
2. Wait 2-3 seconds for processing
3. You should see TWO new cards appear:

#### Card 1: Future Liquidity Predictions
Shows 3 boxes with predictions:
- Tomorrow (t+1): Score with trend arrow (↗↘→)
- In 3 Days (t+3): Score with trend arrow
- In 7 Days (t+7): Score with trend arrow

Colors indicate trend:
- Green: Improving liquidity
- Red: Declining liquidity
- Yellow: Stable liquidity

#### Card 2: AI Analysis
Shows natural language explanation like:
> "Liquidity for Portfolio is gradually declining over the next week. This trend is driven by increasing trading volume, widening bid-ask spreads. Investors may face higher transaction costs and should consider timing their trades carefully."

### Step 5: Test Indian Market
1. Click "Switch to Indian Market 🇮🇳" link at top right
2. Repeat steps 2-4 with Indian stocks:
   - RELIANCE.NS
   - TCS.NS
   - INFY.NS
   - HDFCBANK.NS
   - ICICIBANK.NS

## 🔍 Backend API Testing

You can also test the API directly:

### Test Single Stock Prediction
```bash
curl -X POST http://localhost:5000/explain \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL"}'
```

### Test Portfolio Prediction
```bash
curl -X POST http://localhost:5000/explain \
  -H "Content-Type: application/json" \
  -d '{"portfolio":[{"symbol":"AAPL","qty":10},{"symbol":"MSFT","qty":5}]}'
```

## 📊 Expected Response Format

```json
{
  "portfolio_size": 2,
  "current_liquidity": 0.547,
  "predicted_liquidity_tomorrow": 0.5362,
  "predicted_liquidity_3_days": 0.5387,
  "predicted_liquidity_7_days": 0.5377,
  "ai_explanation": "Liquidity for Portfolio is remaining stable...",
  "asset_predictions": [...]
}
```

## ⚠️ Troubleshooting

### If you don't see the AI button:
1. Hard refresh browser: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Check browser console (F12) for errors
3. Verify both servers are running

### If the button doesn't work:
1. Open browser console (F12)
2. Click the button
3. Check for error messages
4. Verify Flask backend is responding: http://localhost:5000/health

### If predictions show errors:
1. Check Flask terminal for error messages
2. Verify forecast_model.pkl exists in EDI folder
3. Restart Flask server: Stop and run `python app.py` again

## 🎨 What You Should See

The new features add:
1. A prominent button with sparkle icon ✨
2. Two beautiful cards with predictions and AI analysis
3. Color-coded trend indicators
4. Professional explanations of liquidity trends

## 📝 Notes

- The AI explanations use rule-based logic (no OpenAI API key needed)
- To enable LLM-powered explanations, set OPENAI_API_KEY environment variable
- Predictions are based on historical patterns from 5 years of data
- Indian market currently has 5 stocks (can be expanded to full NIFTY 50)
