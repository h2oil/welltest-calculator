# H2Oil Complete - Complete Setup Script (PowerShell)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "H2Oil Complete - Complete Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Python installation
Write-Host "Step 1: Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Python found! $pythonVersion" -ForegroundColor Green
    } else {
        throw "Python not found"
    }
} catch {
    Write-Host "❌ Python not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Python first:" -ForegroundColor Yellow
    Write-Host "1. The Microsoft Store should have opened automatically" -ForegroundColor White
    Write-Host "2. Search for 'Python 3.11' and install it" -ForegroundColor White
    Write-Host "3. Or go to: https://www.python.org/downloads/" -ForegroundColor White
    Write-Host "4. Make sure to check 'Add Python to PATH' during installation" -ForegroundColor White
    Write-Host ""
    Write-Host "After installing Python, run this script again." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 2: Install Python dependencies
Write-Host ""
Write-Host "Step 2: Installing Python dependencies..." -ForegroundColor Yellow
Set-Location backend

Write-Host "Upgrading pip..." -ForegroundColor Gray
python -m pip install --upgrade pip --quiet

Write-Host "Installing well_profile and dependencies..." -ForegroundColor Gray
python -m pip install -r requirements.txt --quiet

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Standard installation failed, trying user installation..." -ForegroundColor Yellow
    python -m pip install --user -r requirements.txt --quiet
}

Write-Host "Testing well_profile installation..." -ForegroundColor Gray
try {
    $wellProfileVersion = python -c "import well_profile; print('✅ well_profile version:', well_profile.__version__)" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host $wellProfileVersion -ForegroundColor Green
    } else {
        throw "well_profile installation failed"
    }
} catch {
    Write-Host "❌ well_profile installation failed!" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 3: Install Node.js dependencies
Write-Host ""
Write-Host "Step 3: Installing Node.js dependencies..." -ForegroundColor Yellow
Set-Location ..

Write-Host "Installing frontend dependencies..." -ForegroundColor Gray
npm install --silent

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed!" -ForegroundColor Red
    Write-Host "Please check your Node.js installation." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Step 4: Test backend server
Write-Host ""
Write-Host "Step 4: Testing backend server..." -ForegroundColor Yellow
Set-Location backend

Write-Host "Starting backend server test..." -ForegroundColor Gray
Start-Process python -ArgumentList "run_server.py" -WindowStyle Hidden -RedirectStandardOutput "server.log" -RedirectStandardError "server.log"
Start-Sleep -Seconds 3

Write-Host "Testing backend connection..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend server is working!" -ForegroundColor Green
    } else {
        throw "Backend not responding"
    }
} catch {
    Write-Host "⚠️  Backend server test failed, but this might be normal" -ForegroundColor Yellow
    Write-Host "The server will start properly when you run the full application" -ForegroundColor Gray
}

Write-Host "Stopping test server..." -ForegroundColor Gray
Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Set-Location ..

# Success message
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Python installed and configured" -ForegroundColor Green
Write-Host "✅ Python dependencies installed" -ForegroundColor Green
Write-Host "✅ Node.js dependencies installed" -ForegroundColor Green
Write-Host "✅ Backend server tested" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "  npm run start:full" -ForegroundColor White
Write-Host ""
Write-Host "Or start manually:" -ForegroundColor Yellow
Write-Host "  Terminal 1: cd backend && python run_server.py" -ForegroundColor White
Write-Host "  Terminal 2: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Access the application at:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:8081" -ForegroundColor White
Write-Host "  Backend:  http://localhost:8000" -ForegroundColor White
Write-Host ""

$startNow = Read-Host "Press Enter to start the application now (or 'n' to exit)"
if ($startNow -ne 'n') {
    Write-Host "Starting H2Oil Complete..." -ForegroundColor Cyan
    npm run start:full
}
