@echo off
echo ========================================
echo StyleAI - Starting Application
echo ========================================

echo.
echo [1/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from nodejs.org
    pause
    exit
)

echo [2/4] Server dependencies...
cd /d C:\PERSONAL\server
if not exist node_modules call npm install

echo [3/4] Client dependencies...
cd /d C:\PERSONAL\client
if not exist node_modules call npm install

echo [4/4] Starting services...
echo.
echo Server:   http://localhost:3001
echo Client:  http://localhost:5173
echo.
echo Press Ctrl+C to stop
echo.

cd /d C:\PERSONAL\server
start "StyleAI-Server" cmd /c "node src/index.js"

timeout /t 3 /nobreak >nul

cd /d C:\PERSONAL\client
npm run dev

pause