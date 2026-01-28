# ExamZone Development Startup Script
# This script starts all services in separate PowerShell windows

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ExamZone Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot

# Check prerequisites
Write-Host "[*] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "[ERROR] Node.js not found. Please install Node.js 20 LTS" -ForegroundColor Red
    exit 1
}

# Check Python
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Host "[OK] Python: $pythonVersion" -ForegroundColor Green
    } else {
        throw "Python not found"
    }
} catch {
    Write-Host "[ERROR] Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check MongoDB
try {
    $mongoRunning = Get-Process -Name mongod -ErrorAction SilentlyContinue
    if ($mongoRunning) {
        Write-Host "[OK] MongoDB: Running" -ForegroundColor Green
    } else {
        Write-Host "[WARN] MongoDB: Not running. Starting..." -ForegroundColor Yellow
        try {
            net start MongoDB 2>$null | Out-Null
            Write-Host "[OK] MongoDB: Started" -ForegroundColor Green
        } catch {
            Write-Host "[WARN] MongoDB: Please start manually or check configuration" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "[WARN] MongoDB: Could not verify status" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[*] Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start Backend
Write-Host "[1/4] Starting Backend API (http://localhost:5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '========================================'  -ForegroundColor Blue; Write-Host 'Backend API' -ForegroundColor Blue; Write-Host '========================================'  -ForegroundColor Blue; cd '$rootPath\backend'; npm run dev"
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "[2/4] Starting Frontend (http://localhost:5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '========================================'  -ForegroundColor Blue; Write-Host 'Frontend React App' -ForegroundColor Blue; Write-Host '========================================'  -ForegroundColor Blue; cd '$rootPath\frontend'; npm run dev"
Start-Sleep -Seconds 2

# Start AI Question Generator
Write-Host "[3/4] Starting AI Question Generator (http://localhost:5001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '========================================'  -ForegroundColor Blue; Write-Host 'AI Question Generator' -ForegroundColor Blue; Write-Host '========================================'  -ForegroundColor Blue; cd '$rootPath\ai-services\question-generator'; python -m uvicorn main:app --reload --port 5001"
Start-Sleep -Seconds 2

# Start AI Answer Checker
Write-Host "[4/4] Starting AI Answer Checker (http://localhost:5002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Write-Host '========================================'  -ForegroundColor Blue; Write-Host 'AI Answer Checker' -ForegroundColor Blue; Write-Host '========================================'  -ForegroundColor Blue; cd '$rootPath\ai-services\answer-checker'; python -m uvicorn main:app --reload --port 5002"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All services are starting!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:     http://localhost:5000" -ForegroundColor White
Write-Host "   AI Gen:      http://localhost:5001" -ForegroundColor White
Write-Host "   AI Check:    http://localhost:5002" -ForegroundColor White
Write-Host ""
Write-Host "Tips:" -ForegroundColor Yellow
Write-Host "   - Each service runs in a separate window" -ForegroundColor White
Write-Host "   - Press Ctrl+C in each window to stop" -ForegroundColor White
Write-Host "   - Wait 10-15 seconds for all services to start" -ForegroundColor White
Write-Host "   - Check console output for any errors" -ForegroundColor White
Write-Host ""
Write-Host "Health Check:" -ForegroundColor Yellow
Write-Host "   Run in a new terminal:" -ForegroundColor White
Write-Host "   curl http://localhost:5000/health/full" -ForegroundColor Gray
Write-Host ""
Write-Host "Open Application:" -ForegroundColor Yellow
Write-Host "   http://localhost:5173" -ForegroundColor White
Write-Host ""

# Wait a bit then open browser
Start-Sleep -Seconds 8
Write-Host "[*] Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "[SUCCESS] Setup complete! Happy coding!" -ForegroundColor Green
Write-Host ""
