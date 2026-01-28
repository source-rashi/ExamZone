# 🚀 ExamZone - Local Development Startup Guide

This script helps you start all ExamZone services for local development and testing.

## Quick Start

### Option 1: Run Each Service Manually

#### Terminal 1: Backend API
```powershell
cd backend
npm install
node server.js
```
**Expected Output**: `Server running at http://localhost:5000`

#### Terminal 2: Frontend
```powershell
cd frontend
npm install
npm run dev
```
**Expected Output**: `Local: http://localhost:5173`

#### Terminal 3: AI Question Generator
```powershell
cd ai-services/question-generator
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 5001
```
**Expected Output**: `Uvicorn running on http://127.0.0.1:5001`

#### Terminal 4: AI Answer Checker
```powershell
cd ai-services/answer-checker
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 5002
```
**Expected Output**: `Uvicorn running on http://127.0.0.1:5002`

---

### Option 2: PowerShell Startup Script

Save this as `start-dev.ps1`:

```powershell
# ExamZone Development Startup Script
Write-Host "🚀 Starting ExamZone Development Environment..." -ForegroundColor Cyan

# Start Backend
Write-Host "`n📦 Starting Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"

# Wait 3 seconds
Start-Sleep -Seconds 3

# Start Frontend
Write-Host "⚛️  Starting Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

# Wait 3 seconds
Start-Sleep -Seconds 3

# Start AI Question Generator
Write-Host "🤖 Starting AI Question Generator..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\ai-services\question-generator'; python -m uvicorn main:app --reload --port 5001"

# Wait 3 seconds
Start-Sleep -Seconds 3

# Start AI Answer Checker
Write-Host "✅ Starting AI Answer Checker..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\ai-services\answer-checker'; python -m uvicorn main:app --reload --port 5002"

Write-Host "`n✨ All services starting! Check the new terminal windows." -ForegroundColor Green
Write-Host "`n📍 Service URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   AI Gen:   http://localhost:5001" -ForegroundColor White
Write-Host "   AI Check: http://localhost:5002" -ForegroundColor White
```

**Run it:**
```powershell
.\start-dev.ps1
```

---

## 🔧 Troubleshooting

### MongoDB Not Running
```powershell
# Check if MongoDB is running
Get-Process -Name mongod -ErrorAction SilentlyContinue

# Start MongoDB (if installed as service)
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

### Port Already in Use
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill process (use PID from above)
taskkill /PID <PID> /F
```

### Python Packages Missing
```powershell
# Install all requirements
pip install -r ai-services/question-generator/requirements.txt
pip install -r ai-services/answer-checker/requirements.txt
```

### Node Modules Missing
```powershell
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

---

## ✅ Health Check

After all services start, verify they're working:

### Backend Health
```powershell
curl http://localhost:5000/health
```
**Expected**: `{"status":"healthy",...}`

### AI Question Generator Health
```powershell
curl http://localhost:5001/health
```
**Expected**: `{"status":"healthy","service":"question-generator",...}`

### AI Answer Checker Health
```powershell
curl http://localhost:5002/health
```
**Expected**: `{"status":"healthy","service":"answer-checker",...}`

### Frontend
Open browser: http://localhost:5173

---

## 🌐 Full System Health Check

```powershell
curl http://localhost:5000/health/full
```

This checks all components (database + AI services).

---

## 🎯 Quick Test Workflow

1. **Open Frontend**: http://localhost:5173
2. **Login with Google OAuth**
3. **Create a Class** (as teacher)
4. **Create an Exam** with AI generation
5. **Generate Question Papers**
6. **Download a paper**
7. **Submit as student**
8. **Check evaluation**

---

## 🛑 Stop All Services

### Manual Stop
Press `Ctrl+C` in each terminal window.

### PowerShell Kill Script
```powershell
# Kill all ExamZone processes
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process -Name python -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -like "*uvicorn*"} | Stop-Process -Force

Write-Host "✅ All services stopped" -ForegroundColor Green
```

---

## 🚢 Deploy to Azure

Once local testing is complete:

### Step 1: Setup Azure Resources
```powershell
.\scripts\azure-setup.ps1
```

### Step 2: Configure Secrets
```powershell
# Set environment variables
$env:MONGODB_URI = "your-mongodb-atlas-uri"
$env:JWT_SECRET = "your-jwt-secret"
$env:SESSION_SECRET = "your-session-secret"
$env:GOOGLE_CLIENT_ID = "your-google-client-id"
$env:GOOGLE_API_KEY = "your-google-api-key"

# Run configuration
.\scripts\azure-configure-settings.ps1
```

### Step 3: Setup GitHub Secrets

1. Go to: https://github.com/source-rashi/ExamZone/settings/secrets/actions
2. Add these secrets:
   - `AZURE_BACKEND_PUBLISH_PROFILE`
   - `AZURE_AI_GENERATOR_PUBLISH_PROFILE`
   - `AZURE_AI_CHECKER_PUBLISH_PROFILE`
   - `AZURE_FRONTEND_PUBLISH_PROFILE`
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_API_KEY`

### Step 4: Deploy
```powershell
git add .
git commit -m "deploy: initial azure deployment"
git push origin main
```

GitHub Actions will automatically deploy all services!

---

## 📊 Monitoring

### View Deployment Status
https://github.com/source-rashi/ExamZone/actions

### Check Azure Logs
```powershell
az webapp log tail --name examzone-backend --resource-group examzone-rg
```

---

## 📚 Documentation

- **Quick Start**: [AZURE-QUICKSTART.md](./AZURE-QUICKSTART.md)
- **Full Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Testing**: [PRODUCTION-TESTING.md](./PRODUCTION-TESTING.md)
- **Domain Setup**: [DOMAIN-SSL-SETUP.md](./DOMAIN-SSL-SETUP.md)

---

**Need Help?** Check the troubleshooting sections in the documentation above!
