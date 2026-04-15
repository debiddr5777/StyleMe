#!/bin/bash

echo "================================"
echo "StyleAI - Starting Application"
echo "================================"
echo

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
cd "$(dirname "$0")/server" && npm install
cd "$(dirname "$0")/client" && npm install

echo
echo "Starting services..."
echo "Server: http://localhost:3001"
echo "Client: http://localhost:5173"
echo

# Start server in background
cd "$(dirname "$0")/server" 
node src/index.js &
SERVER_PID=$!

# Wait for server
sleep 2

# Start client
cd "$(dirname "$0")/client"
npm run dev

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT