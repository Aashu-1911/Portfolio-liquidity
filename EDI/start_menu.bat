@echo off
REM Main menu for Portfolio Liquidity Prediction System

:MENU
cls
echo ============================================================================
echo   PORTFOLIO LIQUIDITY PREDICTION SYSTEM
echo   Main Menu
echo ============================================================================
echo.
echo   1. Start System (Backend + Frontend)
echo   2. Start Backend Only (Flask API)
echo   3. Start Frontend Only (React)
echo   4. Stop All Servers
echo.
echo   5. Setup US Market Data
echo   6. Setup Indian Market Data
echo   7. Setup Both Markets
echo.
echo   8. Test System
echo   9. View Logs
echo.
echo   0. Exit
echo.
echo ============================================================================
echo.

set /p choice="Enter your choice (0-9): "

if "%choice%"=="1" goto START_ALL
if "%choice%"=="2" goto START_BACKEND
if "%choice%"=="3" goto START_FRONTEND
if "%choice%"=="4" goto STOP_ALL
if "%choice%"=="5" goto SETUP_US
if "%choice%"=="6" goto SETUP_INDIA
if "%choice%"=="7" goto SETUP_BOTH
if "%choice%"=="8" goto TEST
if "%choice%"=="9" goto LOGS
if "%choice%"=="0" goto EXIT

echo Invalid choice. Please try again.
timeout /t 2 /nobreak >nul
goto MENU

:START_ALL
cls
echo Starting Backend and Frontend...
call run_project_simple.bat
goto MENU

:START_BACKEND
cls
echo Starting Flask Backend...
start "Flask Backend" cmd /k "python app.py"
echo Backend started at http://localhost:5000
timeout /t 3 /nobreak >nul
goto MENU

:START_FRONTEND
cls
echo Starting React Frontend...
start "React Frontend" cmd /k "cd portfolio-liquidity-insight-main && npm run dev"
echo Frontend starting at http://localhost:8080
timeout /t 3 /nobreak >nul
goto MENU

:STOP_ALL
cls
echo Stopping all servers...
call stop_project.bat
goto MENU

:SETUP_US
cls
echo ============================================================================
echo   SETUP US MARKET (S^&P 500)
echo ============================================================================
echo.
echo This will:
echo   1. Fetch 5 years of S^&P 500 data (~500 stocks)
echo   2. Process and clean the data
echo   3. Compute liquidity features
echo   4. Train ML model
echo.
echo This may take 15-30 minutes.
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" goto MENU

echo.
echo Fetching US market data...
python data_ingestion.py historical US

echo Processing data...
python feature_engineering.py --market US

echo Training model...
cd "Model Training"
python train_liquidity_model.py --market US
cd ..

echo.
echo US Market setup complete!
pause
goto MENU

:SETUP_INDIA
cls
echo ============================================================================
echo   SETUP INDIAN MARKET (NIFTY 50)
echo ============================================================================
echo.
echo This will:
echo   1. Fetch 5 years of NIFTY 50 data (~50 stocks)
echo   2. Process and clean the data
echo   3. Compute liquidity features
echo   4. Train ML model
echo.
echo This may take 5-10 minutes.
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" goto MENU

echo.
echo Fetching Indian market data...
python data_ingestion.py historical INDIA

echo Processing data...
python feature_engineering.py --market INDIA

echo Training model...
cd "Model Training"
python train_liquidity_model.py --market INDIA
cd ..

echo.
echo Indian Market setup complete!
pause
goto MENU

:SETUP_BOTH
cls
echo ============================================================================
echo   SETUP BOTH MARKETS
echo ============================================================================
echo.
echo This will setup both US and Indian markets.
echo This may take 20-40 minutes.
echo.
set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" goto MENU

call setup_dual_market.bat
pause
goto MENU

:TEST
cls
echo ============================================================================
echo   TESTING SYSTEM
echo ============================================================================
echo.
echo Running system tests...
python test_system.py
echo.
pause
goto MENU

:LOGS
cls
echo ============================================================================
echo   SYSTEM LOGS
echo ============================================================================
echo.
if exist "pipeline.log" (
    type pipeline.log | more
) else (
    echo No logs found.
)
echo.
pause
goto MENU

:EXIT
cls
echo ============================================================================
echo   EXITING
echo ============================================================================
echo.
echo Thank you for using Portfolio Liquidity Prediction System!
echo.
timeout /t 2 /nobreak >nul
exit /b 0
