@echo off
echo ========================================
echo H2Oil Complete - Python Auto Installer
echo ========================================
echo.

echo This script will automatically install Python and all dependencies.
echo.

echo Step 1: Downloading Python installer...
echo Please wait while we download Python 3.11...

:: Create temp directory
if not exist "%TEMP%\h2oil-setup" mkdir "%TEMP%\h2oil-setup"
cd /d "%TEMP%\h2oil-setup"

:: Download Python installer
echo Downloading Python 3.11.7 (64-bit)...
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.python.org/ftp/python/3.11.7/python-3.11.7-amd64.exe' -OutFile 'python-installer.exe'}"

if not exist "python-installer.exe" (
    echo ❌ Failed to download Python installer!
    echo Please install Python manually from: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo ✅ Python installer downloaded successfully!

echo.
echo Step 2: Installing Python...
echo Please follow the installation wizard:
echo 1. Check "Add Python to PATH" 
echo 2. Click "Install Now"
echo 3. Wait for installation to complete

:: Run Python installer
python-installer.exe /quiet InstallAllUsers=1 PrependPath=1 Include_test=0

echo.
echo Step 3: Verifying Python installation...
timeout /t 5 /nobreak >nul

:: Refresh environment variables
call refreshenv.cmd 2>nul || (
    echo Refreshing environment variables...
    setx PATH "%PATH%;C:\Program Files\Python311;C:\Program Files\Python311\Scripts" /M
)

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Python installation may need a restart to work properly
    echo Please restart your computer and run setup-everything.bat
    pause
    exit /b 1
)

echo ✅ Python installed successfully!
python --version

echo.
echo Step 4: Running complete setup...
cd /d "%~dp0"
call setup-everything.bat

echo.
echo Cleaning up...
cd /d "%TEMP%\h2oil-setup"
del python-installer.exe 2>nul
cd /d "%~dp0"

echo.
echo 🎉 Installation complete!
echo You can now use H2Oil Complete with full well_profile integration.
pause
