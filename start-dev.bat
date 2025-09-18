@echo off
echo Starting H2Oil Complete Development Environment...
echo.

echo Starting Python Backend Server...
start "H2Oil Backend" cmd /k "cd backend && python run_server.py"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting React Frontend...
start "H2Oil Frontend" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:8081
echo.
echo Press any key to exit...
pause > nul
