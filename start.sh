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

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Kill any existing processes on our ports
echo "Cleaning up ports..."
fuser -k 3001/tcp 2>/dev/null || true
fuser -k 5173/tcp 2>/dev/null || true
sleep 1

# Install dependencies
echo "Installing dependencies..."
cd "$SCRIPT_DIR/server" && npm install --silent
cd "$SCRIPT_DIR/client" && npm install --silent

echo
echo "Starting services..."
echo "Server: http://localhost:3001"
echo "Client: http://localhost:5173"
echo

# Start server in background
cd "$SCRIPT_DIR/server"
node src/index.js &
SERVER_PID=$!

# Wait for server to be ready
echo "Waiting for server..."
sleep 2

# Start client (foreground)
cd "$SCRIPT_DIR/client"
npm run dev &
CLIENT_PID=$!

echo
echo "✅ Both services running!"
echo "   Server PID: $SERVER_PID"
echo "   Client PID: $CLIENT_PID"
echo
echo "Press Ctrl+C to stop both services"

# Cleanup on exit
trap "echo 'Stopping...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; fuser -k 3001/tcp 2>/dev/null; fuser -k 5173/tcp 2>/dev/null" EXIT

wait $CLIENT_PID