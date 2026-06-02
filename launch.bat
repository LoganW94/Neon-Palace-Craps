@echo off
setlocal
cd /d "%~dp0"

if "%PORT%"=="" set PORT=4173
set HOST=127.0.0.1

echo Starting Neon Palace Craps...
echo Opening http://%HOST%:%PORT%
echo.
echo Keep this window open while you play.
echo Press Control-C to stop the app.
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required but was not found.
  echo Install Node.js from https://nodejs.org, then launch again.
  pause
  exit /b 1
)

curl -fsS "http://%HOST%:%PORT%/api/health" >nul 2>nul
if not errorlevel 1 (
  echo Neon Palace Craps is already running.
  start "" "http://%HOST%:%PORT%"
  exit /b 0
)

start "" /b node backend/src/server.mjs

for /l %%i in (1,1,40) do (
  curl -fsS "http://%HOST%:%PORT%/api/health" >nul 2>nul
  if not errorlevel 1 (
    start "" "http://%HOST%:%PORT%"
    goto running
  )
  timeout /t 1 /nobreak >nul
)

echo The server started, but did not respond at http://%HOST%:%PORT%.
pause
exit /b 1

:running
echo Server is running in this window. Close this window or press Control-C to stop.
pause >nul
