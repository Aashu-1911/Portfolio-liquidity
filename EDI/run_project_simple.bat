@echo off
REM Simple startup script - runs backend and frontend in same window

title Portfolio Liquidity System

echo ============================================================================
echo   PORTFOLIO LIQUIDITY PREDICTION SYSTEM - SIMPLE START
echo ============================================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found
    pause
    exit /b 1
)

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    pause
    exit /b 1
)

echo Starting Backend...
start "Flask Backend" cmd /k "python app.py"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "React Frontend" cmd /k "cd portfolio-liquidity-insight-main && npm run dev"

timeout /t 8 /nobreak >nul

echo.
echo ============================================================================
echo   SERVERS STARTED!
echo ============================================================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:8080
echo.
echo Opening browser...
start http://localhost:8080/

echo.
echo Press any key to exit (servers will keep running)...
pause >nul
