@echo off
REM Stop all Flask and Node.js servers

title Stop Portfolio Liquidity System

echo ============================================================================
echo   STOPPING PORTFOLIO LIQUIDITY PREDICTION SYSTEM
echo ============================================================================
echo.

echo Stopping Flask Backend (Python)...
taskkill /F /FI "WINDOWTITLE eq Flask Backend*" 2>nul
taskkill /F /FI "IMAGENAME eq python.exe" /FI "MEMUSAGE gt 50000" 2>nul

echo Stopping React Frontend (Node.js)...
taskkill /F /FI "WINDOWTITLE eq React Frontend*" 2>nul
taskkill /F /FI "IMAGENAME eq node.exe" /FI "MEMUSAGE gt 50000" 2>nul

timeout /t 2 /nobreak >nul

echo.
echo ============================================================================
echo   SERVERS STOPPED
echo ============================================================================
echo.
echo All servers have been stopped.
echo.
pause
