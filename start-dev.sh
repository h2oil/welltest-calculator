#!/bin/bash

echo "Starting H2Oil Complete Development Environment..."
echo

echo "Starting Python Backend Server..."
cd backend
python run_server.py &
BACKEND_PID=$!

echo "Waiting for backend to start..."
sleep 3

echo "Starting React Frontend..."
cd ..
npm run dev &
FRONTEND_PID=$!

echo
echo "Both servers are starting..."
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:8081"
echo
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C
trap cleanup SIGINT

# Wait for processes
wait
