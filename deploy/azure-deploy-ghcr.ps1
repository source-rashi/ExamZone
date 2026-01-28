# ==================================================================
# EXAMZONE AZURE DEPLOYMENT - Using GitHub Container Registry
# ==================================================================
# This script deploys to Azure Container Apps using GitHub Container Registry
# (bypasses Azure student subscription ACR restrictions)
# ==================================================================

$ErrorActionPreference = "Stop"

# Configuration
$RESOURCE_GROUP = "examzone-rg"
$LOCATION = "westus2"
$CONTAINER_ENV = "examzone-env"
$GITHUB_USERNAME = "source-rashi"
$REGISTRY = "ghcr.io"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ExamZone Azure Deployment (GHCR)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check Azure login
Write-Host "Checking Azure login..." -ForegroundColor Blue
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Not logged into Azure. Please run: az login" -ForegroundColor Red
    exit 1
}
Write-Host "Logged in: $($account.name)" -ForegroundColor Green

# Step 1: Create Resource Group
Write-Host "Creating resource group: $RESOURCE_GROUP" -ForegroundColor Blue
$rgExists = az group exists --name $RESOURCE_GROUP
if ($rgExists -eq "true") {
    Write-Host "Resource group already exists" -ForegroundColor Yellow
} else {
    az group create --name $RESOURCE_GROUP --location $LOCATION
    Write-Host "Resource group created" -ForegroundColor Green
}

# Step 2: Build Docker images locally and push to GitHub Container Registry
Write-Host "Building Docker images..." -ForegroundColor Blue
Write-Host "NOTE: You need to be logged into GitHub Container Registry" -ForegroundColor Yellow
Write-Host "Run: docker login ghcr.io -u $GITHUB_USERNAME -p YOUR_GITHUB_PAT" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter once you've logged into GHCR, or Ctrl+C to exit and login first"

# Build and push backend
Write-Host "Building backend..." -ForegroundColor Blue
docker build -t "$REGISTRY/$GITHUB_USERNAME/examzone-backend:latest" ./backend
docker push "$REGISTRY/$GITHUB_USERNAME/examzone-backend:latest"

# Build and push AI generator
Write-Host "Building AI question generator..." -ForegroundColor Blue
docker build -t "$REGISTRY/$GITHUB_USERNAME/examzone-ai-generator:latest" ./ai-services/question-generator
docker push "$REGISTRY/$GITHUB_USERNAME/examzone-ai-generator:latest"

# Build and push AI checker
Write-Host "Building AI answer checker..." -ForegroundColor Blue
docker build -t "$REGISTRY/$GITHUB_USERNAME/examzone-ai-checker:latest" ./ai-services/answer-checker
docker push "$REGISTRY/$GITHUB_USERNAME/examzone-ai-checker:latest"

Write-Host "All images pushed to GHCR" -ForegroundColor Green

# Step 3: Create Container Apps Environment
Write-Host "Creating Container Apps Environment: $CONTAINER_ENV" -ForegroundColor Blue
$null = az containerapp env show --name $CONTAINER_ENV --resource-group $RESOURCE_GROUP 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Container Apps Environment already exists" -ForegroundColor Yellow
} else {
    az containerapp env create --name $CONTAINER_ENV --resource-group $RESOURCE_GROUP --location $LOCATION
    Write-Host "Container Apps Environment created" -ForegroundColor Green
}

# Step 4: Deploy AI Question Generator
Write-Host "Deploying AI Question Generator..." -ForegroundColor Blue
az containerapp create --name examzone-ai-generator --resource-group $RESOURCE_GROUP --environment $CONTAINER_ENV --image "$REGISTRY/$GITHUB_USERNAME/examzone-ai-generator:latest" --target-port 5001 --ingress internal --secrets "gemini-api-key=$env:GEMINI_API_KEY" --env-vars "GEMINI_API_KEY=secretref:gemini-api-key" "GOOGLE_API_KEY=secretref:gemini-api-key" --cpu 0.5 --memory 1Gi --min-replicas 1 --max-replicas 1
Write-Host "AI Question Generator deployed" -ForegroundColor Green

# Step 5: Deploy AI Answer Checker
Write-Host "Deploying AI Answer Checker..." -ForegroundColor Blue
az containerapp create --name examzone-ai-checker --resource-group $RESOURCE_GROUP --environment $CONTAINER_ENV --image "$REGISTRY/$GITHUB_USERNAME/examzone-ai-checker:latest" --target-port 5002 --ingress internal --secrets "gemini-api-key=$env:GEMINI_API_KEY" --env-vars "GEMINI_API_KEY=secretref:gemini-api-key" "GOOGLE_API_KEY=secretref:gemini-api-key" --cpu 0.5 --memory 1Gi --min-replicas 1 --max-replicas 1
Write-Host "AI Answer Checker deployed" -ForegroundColor Green

# Get AI service URLs
$AI_GENERATOR_FQDN = az containerapp show --name examzone-ai-generator --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv
$AI_CHECKER_FQDN = az containerapp show --name examzone-ai-checker --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv

# Step 6: Deploy Backend
Write-Host "Deploying Backend..." -ForegroundColor Blue
az containerapp create --name examzone-backend --resource-group $RESOURCE_GROUP --environment $CONTAINER_ENV --image "$REGISTRY/$GITHUB_USERNAME/examzone-backend:latest" --target-port 3000 --ingress external --secrets "mongodb-uri=$env:MONGODB_URI" "jwt-secret=$env:JWT_SECRET" "session-secret=$env:SESSION_SECRET" "gemini-api-key=$env:GEMINI_API_KEY" --env-vars "MONGODB_URI=secretref:mongodb-uri" "JWT_SECRET=secretref:jwt-secret" "SESSION_SECRET=secretref:session-secret" "GEMINI_API_KEY=secretref:gemini-api-key" "AI_QUESTION_GENERATOR_URL=https://$AI_GENERATOR_FQDN" "AI_ANSWER_CHECKER_URL=https://$AI_CHECKER_FQDN" "FRONTEND_URL=$env:FRONTEND_URL" "NODE_ENV=production" --cpu 0.5 --memory 1Gi --min-replicas 1 --max-replicas 3
Write-Host "Backend deployed" -ForegroundColor Green

# Get backend URL
$BACKEND_FQDN = az containerapp show --name examzone-backend --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv
$BACKEND_URL = "https://$BACKEND_FQDN"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: $BACKEND_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Update Vercel environment variable:" -ForegroundColor Yellow
Write-Host "   VITE_API_URL=$BACKEND_URL/api/v2" -ForegroundColor White
Write-Host ""
Write-Host "Next: Set up GitHub Container Registry access for CI/CD:" -ForegroundColor Blue
Write-Host "   1. Create GitHub Personal Access Token (PAT)" -ForegroundColor White
Write-Host "   2. Grant 'write:packages' and 'read:packages' permissions" -ForegroundColor White
Write-Host "   3. Login: docker login ghcr.io -u $GITHUB_USERNAME -p YOUR_PAT" -ForegroundColor White
Write-Host ""
