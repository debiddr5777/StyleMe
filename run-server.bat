@echo off
echo Starting StyleAI Server...

cd /d C:\PERSONAL\server
if not exist node_modules (
    echo Installing server dependencies...
    call npm install
)

echo Starting server on port 3001...
call npm run dev