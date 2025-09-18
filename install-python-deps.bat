@echo off
echo Installing Python dependencies for H2Oil Complete...
echo.

echo Checking Python installation...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo.
echo Python found! Installing dependencies...
echo.

cd backend

echo Installing well_profile and dependencies...
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Trying alternative installation method...
    python -m pip install --user -r requirements.txt
)

echo.
echo Testing well_profile installation...
python -c "import well_profile; print('well_profile version:', well_profile.__version__)"

if %errorlevel% neq 0 (
    echo.
    echo ERROR: well_profile installation failed
    echo Please check the error messages above
    pause
    exit /b 1
)

echo.
echo ✅ All Python dependencies installed successfully!
echo.
echo You can now start the backend server with:
echo   cd backend
echo   python run_server.py
echo.
echo Or start both frontend and backend with:
echo   npm run start:full
echo.
pause
