@echo off
REM ============================================================================
REM Portfolio Liquidity Prediction System - Startup Script
REM Starts both Flask backend and React frontend servers
REM ============================================================================

title Portfolio Liquidity Prediction System

echo ============================================================================
echo   PORTFOLIO LIQUIDITY PREDICTION SYSTEM
echo   Starting Backend (Flask) and Frontend (React)
echo ============================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

echo [OK] Python found: 
python --version
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 16+
    pause
    exit /b 1
)

echo [OK] Node.js found:
node --version
echo.

REM Check if required files exist
if not exist "app.py" (
    echo [ERROR] app.py not found. Are you in the EDI directory?
    pause
    exit /b 1
)

if not exist "portfolio-liquidity-insight-main" (
    echo [ERROR] Frontend directory not found.
    pause
    exit /b 1
)

echo [OK] Project files found
echo.

REM Check if models exist
set MODELS_EXIST=0
if exist "model.pkl" set MODELS_EXIST=1
if exist "model_india.pkl" set /a MODELS_EXIST+=1

if %MODELS_EXIST%==0 (
    echo [WARNING] No models found. Please run setup first:
    echo   - For US market: python data_ingestion.py historical US
    echo   - For Indian market: python data_ingestion.py historical INDIA
    echo   - Or run: setup_dual_market.bat
    echo.
    echo Press any key to continue anyway, or Ctrl+C to exit...
    pause >nul
)

echo ============================================================================
echo   STARTING SERVERS
echo ============================================================================
echo.

REM Create a temporary VBS script to open new windows
echo Set WshShell = CreateObject("WScript.Shell") > "%temp%\open_window.vbs"
echo WshShell.Run "cmd /k cd /d ""%CD%"" && python app.py", 1, False >> "%temp%\open_window.vbs"

REM Start Flask backend in new window
echo [1/2] Starting Flask Backend Server...
echo   - URL: http://localhost:5000
echo   - Opening in new window...
cscript //nologo "%temp%\open_window.vbs"
timeout /t 3 /nobreak >nul
echo   [OK] Backend started
echo.

REM Start React frontend in new window
echo [2/2] Starting React Frontend Server...
echo   - URL: http://localhost:8080
echo   - Opening in new window...

REM Create VBS script for frontend
echo Set WshShell = CreateObject("WScript.Shell") > "%temp%\open_frontend.vbs"
echo WshShell.Run "cmd /k cd /d ""%CD%\portfolio-liquidity-insight-main"" && npm run dev", 1, False >> "%temp%\open_frontend.vbs"
cscript //nologo "%temp%\open_frontend.vbs"

timeout /t 5 /nobreak >nul
echo   [OK] Frontend starting...
echo.

REM Wait a bit for servers to start
echo Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

echo ============================================================================
echo   SERVERS STARTED SUCCESSFULLY!
echo ============================================================================
echo.
echo Backend API:  http://localhost:5000
echo   - Health:   http://localhost:5000/health
echo   - US API:   http://localhost:5000/health?market=US
echo   - India API: http://localhost:5000/health?market=INDIA
echo.
echo Frontend:
echo   - US Market:     http://localhost:8080/
echo   - Indian Market: http://localhost:8080/india
echo.
echo ============================================================================
echo   OPENING BROWSER...
echo ============================================================================
echo.

REM Wait a bit more for frontend to be ready
timeout /t 10 /nobreak >nul

REM Open browser to US market page
start http://localhost:8080/

echo Browser opened to US Market page
echo.
echo ============================================================================
echo   SYSTEM RUNNING
echo ============================================================================
echo.
echo The system is now running in separate windows:
echo   - Window 1: Flask Backend (Python)
echo   - Window 2: React Frontend (Node.js)
echo.
echo To stop the servers:
echo   1. Close both server windows, OR
echo   2. Press Ctrl+C in each window
echo.
echo To switch markets in browser:
echo   - US Market:     http://localhost:8080/
echo   - Indian Market: http://localhost:8080/india
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul

REM Cleanup temp files
del "%temp%\open_window.vbs" 2>nul
del "%temp%\open_frontend.vbs" 2>nul

exit /b 0
