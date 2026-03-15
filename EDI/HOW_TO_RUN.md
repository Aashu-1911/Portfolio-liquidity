# How to Run the Project

## 🚀 Quick Start (Windows)

### Option 1: Interactive Menu (Recommended)

Double-click: **`start_menu.bat`**

This opens an interactive menu where you can:
- Start/stop servers
- Setup markets
- Run tests
- View logs

### Option 2: One-Click Start

Double-click: **`run_project.bat`**

This automatically:
1. Checks Python and Node.js
2. Starts Flask backend
3. Starts React frontend
4. Opens browser to http://localhost:8080

### Option 3: Simple Start

Double-click: **`run_project_simple.bat`**

Simpler version that starts both servers in separate windows.

---

## 📋 Prerequisites

Before running, ensure you have:

1. **Python 3.8+** installed
   ```cmd
   python --version
   ```

2. **Node.js 16+** installed
   ```cmd
   node --version
   ```

3. **Dependencies installed**
   ```cmd
   pip install -r requirements.txt
   cd portfolio-liquidity-insight-main
   npm install
   ```

4. **At least one market setup** (US or India)
   ```cmd
   python data_ingestion.py historical US
   ```

---

## 🎯 First Time Setup

### Complete Setup (Both Markets)

1. Double-click **`setup_dual_market.bat`**
   - OR run: `python data_ingestion.py both`

2. Wait 20-40 minutes for data fetching and model training

3. Run the project: Double-click **`run_project.bat`**

### Quick Test Setup (5 stocks only)

```cmd
python data_ingestion.py test US
python data_ingestion.py test INDIA
```

---

## 🌐 Access the Application

Once running, open your browser to:

### US Market (S&P 500)
**http://localhost:8080/**

### Indian Market (NIFTY 50)
**http://localhost:8080/india**

### Backend API
**http://localhost:5000/health**

---

## 🛑 Stopping the Servers

### Option 1: Stop Script
Double-click: **`stop_project.bat`**

### Option 2: Manual
Close the server windows (Flask Backend and React Frontend)

### Option 3: Task Manager
1. Press `Ctrl+Shift+Esc`
2. Find `python.exe` and `node.exe`
3. End tasks

---

## 📁 Batch Files Reference

| File | Purpose |
|------|---------|
| `start_menu.bat` | Interactive menu (recommended) |
| `run_project.bat` | Full startup with checks |
| `run_project_simple.bat` | Simple startup |
| `stop_project.bat` | Stop all servers |
| `setup_dual_market.bat` | Setup both markets |

---

## 🔧 Manual Start (Advanced)

### Start Backend
```cmd
python app.py
```
Backend runs on: http://localhost:5000

### Start Frontend
```cmd
cd portfolio-liquidity-insight-main
npm run dev
```
Frontend runs on: http://localhost:8080

---

## 🧪 Testing

### Test if servers are running
```cmd
curl http://localhost:5000/health
curl http://localhost:8080
```

### Run system tests
```cmd
python test_system.py
```

---

## 🚨 Troubleshooting

### "Python not found"
- Install Python from https://www.python.org/downloads/
- Make sure to check "Add Python to PATH" during installation

### "Node.js not found"
- Install Node.js from https://nodejs.org/
- Restart your terminal after installation

### "Port already in use"
**Backend (Port 5000):**
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Frontend (Port 8080):**
```cmd
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### "Models not found"
Run setup first:
```cmd
python data_ingestion.py historical US
```

### Frontend won't start
```cmd
cd portfolio-liquidity-insight-main
npm install
npm run dev
```

---

## 📊 What Each Server Does

### Flask Backend (Port 5000)
- Loads ML models
- Provides API endpoints
- Handles predictions
- Serves both US and Indian markets

### React Frontend (Port 8080)
- User interface
- Portfolio builder
- Results visualization
- Market switcher

---

## 🔄 Daily Updates

To update market data:

```cmd
python data_ingestion.py update US
python data_ingestion.py update INDIA
```

Or use the interactive menu: `start_menu.bat` → Option 5 or 6

---

## 📈 Performance

### Startup Time
- Backend: ~5-10 seconds
- Frontend: ~10-20 seconds
- Total: ~15-30 seconds

### Resource Usage
- Backend: ~200-500 MB RAM
- Frontend: ~300-600 MB RAM
- Total: ~500-1100 MB RAM

---

## 🎨 Browser Compatibility

Tested on:
- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (Not supported)

---

## 📝 Logs

View logs:
- Pipeline logs: `pipeline.log`
- Backend logs: Check Flask window
- Frontend logs: Check React window

---

## 🆘 Need Help?

1. Check `TROUBLESHOOTING.md`
2. Review `INSTALLATION_GUIDE.md`
3. Check logs in `pipeline.log`
4. Ensure all prerequisites are installed

---

## ✅ Quick Checklist

Before running:
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] At least one market setup (US or India)

To run:
- [ ] Double-click `run_project.bat`
- [ ] Wait for servers to start
- [ ] Browser opens automatically
- [ ] Access http://localhost:8080

---

## 🎉 Success!

If you see:
- ✅ Flask backend running on port 5000
- ✅ React frontend running on port 8080
- ✅ Browser opens to the application
- ✅ Can select stocks and analyze portfolio

**You're all set! 🚀**

---

## 📚 Additional Resources

- **Full Documentation:** `README_UPGRADE.md`
- **Dual Market Guide:** `DUAL_MARKET_SETUP.md`
- **Quick Reference:** `QUICK_REFERENCE_DUAL_MARKET.md`
- **API Documentation:** See `README_UPGRADE.md`

---

**Enjoy using the Portfolio Liquidity Prediction System! 🌍📊**
