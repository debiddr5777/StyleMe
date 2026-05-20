@echo off
echo ========================================
echo StyleAI - Running Without Docker
echo ========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed
    pause
    exit /b 1
)

echo [1/3] Installing server dependencies...
cd /d C:\PERSONAL\server
if not exist node_modules call npm install

echo [2/3] Installing client dependencies...
cd /d C:\PERSONAL\client
if not exist node_modules call npm install

echo.
echo ========================================
echo Starting services...
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press Ctrl+C to stop all services
echo.

 REM Start backend in background
start "StyleAI Server" cmd /c "cd /d C:\PERSONAL\server && npm run dev"

 REM Start frontend
cd /d C:\PERSONAL\client
npm run dev