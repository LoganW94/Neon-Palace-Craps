@echo off
setlocal
cd /d "%~dp0"

if "%PORT%"=="" set PORT=4173
if "%HOST%"=="" set HOST=127.0.0.1

echo Starting Neon Palace Craps...
echo Opening http://%HOST%:%PORT%
echo.
echo Keep this window open while you play.
echo Press Control-C to stop the app.
echo.

start "" /b node backend/src/server.mjs
timeout /t 1 /nobreak >nul
start "" "http://%HOST%:%PORT%"
echo Server is running in this window. Close this window or press Control-C to stop.
pause >nul
