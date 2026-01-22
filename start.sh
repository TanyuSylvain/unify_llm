#!/bin/bash

cd "$(dirname "$0")"

cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

echo "Starting backend server on port 8000..."
python3 -m backend.main &
BACKEND_PID=$!

echo "Starting frontend server on port 8080..."
python3 -m http.server 8080 --directory frontend/src &
FRONTEND_PID=$!

echo ""
echo "Backend API: http://localhost:8000"
echo "Frontend:    http://localhost:8080/index.html"
echo ""
echo "Press Ctrl+C to stop both servers"

wait
