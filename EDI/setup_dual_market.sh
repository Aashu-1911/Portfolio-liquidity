#!/bin/bash

# Dual Market Setup Script
# Sets up both US and Indian markets

echo "=========================================="
echo "  DUAL MARKET SETUP"
echo "  US (S&P 500) + India (NIFTY 50)"
echo "=========================================="
echo ""

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.8+"
    exit 1
fi

echo "✓ Python found: $(python --version)"
echo ""

# Install dependencies
echo "[1/5] Installing dependencies..."
pip install -r requirements.txt
echo ""

# Fetch US market data
echo "[2/5] Fetching US market data (S&P 500)..."
echo "This may take 15-30 minutes..."
python data_ingestion.py historical US
echo ""

# Fetch Indian market data
echo "[3/5] Fetching Indian market data (NIFTY 50)..."
echo "This may take 5-10 minutes..."
python data_ingestion.py historical INDIA
echo ""

# Process and train US models
echo "[4/5] Training US market models..."
python feature_engineering.py --market US
cd "Model Training"
python train_liquidity_model.py --market US
cd ..
echo ""

# Process and train Indian models
echo "[5/5] Training Indian market models..."
python feature_engineering.py --market INDIA
cd "Model Training"
python train_liquidity_model.py --market INDIA
cd ..
echo ""

echo "=========================================="
echo "  ✅ DUAL MARKET SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start API server: python app.py"
echo "2. Start frontend: cd portfolio-liquidity-insight-main && npm run dev"
echo "3. Visit:"
echo "   - US Market: http://localhost:8080/"
echo "   - Indian Market: http://localhost:8080/india"
echo ""
