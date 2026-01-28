# ==================================================================
# EXAMZONE AZURE WEB APP DEPLOYMENT - For Student Subscriptions
# ==================================================================
# Deploys backend to Azure Web App for Containers (simpler, no region restrictions)
# AI services can run locally or you can deploy them separately
# ==================================================================

$ErrorActionPreference = "Stop"

# Configuration
$RESOURCE_GROUP = "examzone-rg"
$LOCATION = "eastus"  # Many regions available
$APP_SERVICE_PLAN = "examzone-plan"
$BACKEND_APP = "examzone-backend-app"
$GITHUB_USERNAME = "source-rashi"
$REGISTRY = "ghcr.io"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ExamZone Azure Web App Deployment" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check Azure login
Write-Host "Checking Azure login..." -ForegroundColor Blue
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged into Azure. Please run: az login" -ForegroundColor Red
    exit 1
}
Write-Host "Logged in: $($account.name)" -ForegroundColor Green

# Step 1: Ensure images are pushed
Write-Host "Verifying Docker images in GHCR..." -ForegroundColor Blue
Write-Host "Images should already be at:" -ForegroundColor Yellow
Write-Host "  - $REGISTRY/$GITHUB_USERNAME/examzone-backend:latest" -ForegroundColor White
Write-Host "  - $REGISTRY/$GITHUB_USERNAME/examzone-ai-generator:latest" -ForegroundColor White
Write-Host "  - $REGISTRY/$GITHUB_USERNAME/examzone-ai-checker:latest" -ForegroundColor White

# Step 2: Create App Service Plan (B1 tier - $13/month, includes in free credit)
Write-Host "`nCreating App Service Plan: $APP_SERVICE_PLAN" -ForegroundColor Blue
$null = az appservice plan show --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "App Service Plan already exists" -ForegroundColor Yellow
} else {
    az appservice plan create --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --location $LOCATION --is-linux --sku B1
    Write-Host "App Service Plan created (B1 tier)" -ForegroundColor Green
}

# Step 3: Create Web App for Backend
Write-Host "`nCreating Web App: $BACKEND_APP" -ForegroundColor Blue
$null = az webapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Web App already exists" -ForegroundColor Yellow
} else {
    az webapp create --resource-group $RESOURCE_GROUP --plan $APP_SERVICE_PLAN --name $BACKEND_APP --deployment-container-image-name "$REGISTRY/$GITHUB_USERNAME/examzone-backend:latest"
    Write-Host "Web App created" -ForegroundColor Green
}

# Step 4: Configure Web App Settings
Write-Host "`nConfiguring Web App settings..." -ForegroundColor Blue

# Enable container logging
az webapp log config `
    --name $BACKEND_APP `
    --resource-group $RESOURCE_GROUP `
    --docker-container-logging filesystem

# Configure app settings
az webapp config appsettings set `
    --name $BACKEND_APP `
    --resource-group $RESOURCE_GROUP `
    --settings `
        MONGODB_URI="$env:MONGODB_URI" `
        JWT_SECRET="$env:JWT_SECRET" `
        SESSION_SECRET="$env:SESSION_SECRET" `
        GEMINI_API_KEY="$env:GEMINI_API_KEY" `
        FRONTEND_URL="$env:FRONTEND_URL" `
        NODE_ENV="production" `
        PORT="8080" `
        WEBSITES_PORT="8080" `
        AI_QUESTION_GENERATOR_URL="http://127.0.0.1:5001" `
        AI_ANSWER_CHECKER_URL="http://127.0.0.1:5002" `
        AI_MOCK_MODE="true"

Write-Host "App settings configured" -ForegroundColor Green

# Step 5: Enable continuous deployment from GHCR
Write-Host "`nEnabling continuous deployment..." -ForegroundColor Blue
az webapp deployment container config `
    --name $BACKEND_APP `
    --resource-group $RESOURCE_GROUP `
    --enable-cd true

$webhookUrl = az webapp deployment container show-cd-url `
    --name $BACKEND_APP `
    --resource-group $RESOURCE_GROUP `
    --query CI_CD_URL -o tsv

Write-Host "Webhook URL for GHCR: $webhookUrl" -ForegroundColor Yellow

# Step 6: Restart Web App
Write-Host "`nRestarting Web App..." -ForegroundColor Blue
az webapp restart --name $BACKEND_APP --resource-group $RESOURCE_GROUP
Write-Host "Web App restarted" -ForegroundColor Green

# Get backend URL
Write-Host "`nFetching backend URL..." -ForegroundColor Blue
$BACKEND_URL = az webapp show `
    --name $BACKEND_APP `
    --resource-group $RESOURCE_GROUP `
    --query defaultHostName -o tsv

$BACKEND_FULL_URL = "https://$BACKEND_URL"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: $BACKEND_FULL_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Update Vercel environment variable:" -ForegroundColor Yellow
Write-Host "   VITE_API_URL=$BACKEND_FULL_URL/api/v2" -ForegroundColor White
Write-Host ""
Write-Host "Testing:" -ForegroundColor Blue
Write-Host "   curl $BACKEND_FULL_URL/health" -ForegroundColor White
Write-Host ""
Write-Host "View logs:" -ForegroundColor Blue
Write-Host "   az webapp log tail --name $BACKEND_APP --resource-group $RESOURCE_GROUP" -ForegroundColor White
Write-Host ""
Write-Host "Note: AI services running in mock mode. For production:" -ForegroundColor Yellow
Write-Host "   - Deploy AI services separately or run them locally" -ForegroundColor White
Write-Host "   - Update AI_MOCK_MODE to false in app settings" -ForegroundColor White
Write-Host ""
