# ==================================================================
# EXAMZONE AZURE CONTAINER DEPLOYMENT - SIMPLIFIED
# ==================================================================

$ErrorActionPreference = "Stop"

# Configuration
$RESOURCE_GROUP = "examzone-rg"
$LOCATION = "centralus"  # Changed from eastus for student subscription compatibility
$ACR_NAME = "examzoneregistry"
$CONTAINER_ENV = "examzone-env"
$IMAGE_TAG = "latest"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "ExamZone Azure Deployment" -ForegroundColor Cyan
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
    az group create --name $RESOURCE_GROUP --location $LOCATION --output none
    Write-Host "Resource group created" -ForegroundColor Green
}

# Step 2: Create Azure Container Registry
Write-Host "Creating Azure Container Registry: $ACR_NAME" -ForegroundColor Blue
try {
    $ErrorActionPreference = "SilentlyContinue"
    $acrCheck = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP 2>$null | ConvertFrom-Json
    $ErrorActionPreference = "Stop"
    if ($acrCheck) {
        Write-Host "ACR already exists" -ForegroundColor Yellow
    } else {
        throw "Create new"
    }
} catch {
    $ErrorActionPreference = "Stop"
    Write-Host "Creating new ACR..." -ForegroundColor Blue
    az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic --admin-enabled true
    Write-Host "ACR created" -ForegroundColor Green
}

# Step 3: Login to ACR
Write-Host "Logging into ACR..." -ForegroundColor Blue
az acr login --name $ACR_NAME
Write-Host "ACR login successful" -ForegroundColor Green

# Step 4: Get ACR login server
$ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer -o tsv
Write-Host "ACR Login Server: $ACR_LOGIN_SERVER" -ForegroundColor Blue

# Step 5: Build and push Docker images
Write-Host "Building Docker images..." -ForegroundColor Blue
$env:DOCKER_REGISTRY = $ACR_LOGIN_SERVER
$env:IMAGE_TAG = $IMAGE_TAG

docker compose -f docker-compose.prod.yml build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Docker build complete" -ForegroundColor Green

Write-Host "Pushing images to ACR..." -ForegroundColor Blue
docker tag examzone-backend:$IMAGE_TAG $ACR_LOGIN_SERVER/examzone-backend:$IMAGE_TAG
docker tag examzone-ai-generator:$IMAGE_TAG $ACR_LOGIN_SERVER/examzone-ai-generator:$IMAGE_TAG
docker tag examzone-ai-checker:$IMAGE_TAG $ACR_LOGIN_SERVER/examzone-ai-checker:$IMAGE_TAG

docker push $ACR_LOGIN_SERVER/examzone-backend:$IMAGE_TAG
docker push $ACR_LOGIN_SERVER/examzone-ai-generator:$IMAGE_TAG
docker push $ACR_LOGIN_SERVER/examzone-ai-checker:$IMAGE_TAG

Write-Host "Images pushed to ACR" -ForegroundColor Green

# Step 6: Create Container Apps Environment
Write-Host "Creating Container Apps Environment: $CONTAINER_ENV" -ForegroundColor Blue
$envExists = az containerapp env show --name $CONTAINER_ENV --resource-group $RESOURCE_GROUP 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Container Apps Environment already exists" -ForegroundColor Yellow
} else {
    az containerapp env create --name $CONTAINER_ENV --resource-group $RESOURCE_GROUP --location $LOCATION --output none
    Write-Host "Container Apps Environment created" -ForegroundColor Green
}

# Get ACR credentials
Write-Host "Retrieving ACR credentials..." -ForegroundColor Blue
$ACR_USERNAME = (az acr credential show --name $ACR_NAME --query username -o tsv)
$ACR_PASSWORD = (az acr credential show --name $ACR_NAME | ConvertFrom-Json).passwords[0].value

# Step 7: Deploy AI Question Generator
Write-Host "Deploying AI Question Generator..." -ForegroundColor Blue
az containerapp create --name examzone-ai-generator --resource-group $RESOURCE_GROUP --environment $CONTAINER_ENV --image "$ACR_LOGIN_SERVER/examzone-ai-generator:$IMAGE_TAG" --target-port 5001 --ingress internal --registry-server $ACR_LOGIN_SERVER --registry-username $ACR_USERNAME --registry-password $ACR_PASSWORD --secrets "gemini-api-key=$env:GEMINI_API_KEY" --env-vars "GEMINI_API_KEY=secretref:gemini-api-key" "GOOGLE_API_KEY=secretref:gemini-api-key" --cpu 0.5 --memory 1Gi --min-replicas 1 --max-replicas 1 --output none
Write-Host "AI Question Generator deployed" -ForegroundColor Green

# Step 8: Deploy AI Answer Checker
Write-Host "Deploying AI Answer Checker..." -ForegroundColor Blue
az containerapp create --name examzone-ai-checker --resource-group $RESOURCE_GROUP --environment $CONTAINER_ENV --image "$ACR_LOGIN_SERVER/examzone-ai-checker:$IMAGE_TAG" --target-port 5002 --ingress internal --registry-server $ACR_LOGIN_SERVER --registry-username $ACR_USERNAME --registry-password $ACR_PASSWORD --secrets "gemini-api-key=$env:GEMINI_API_KEY" --env-vars "GEMINI_API_KEY=secretref:gemini-api-key" "GOOGLE_API_KEY=secretref:gemini-api-key" --cpu 0.5 --memory 1Gi --min-replicas 1 --max-replicas 1 --output none
Write-Host "AI Answer Checker deployed" -ForegroundColor Green

# Get AI service URLs
$AI_GENERATOR_FQDN = az containerapp show --name examzone-ai-generator --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv
$AI_CHECKER_FQDN = az containerapp show --name examzone-ai-checker --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn -o tsv

# Step 9: Deploy Backend
Write-Host "Deploying Backend..." -ForegroundColor Blue
az containerapp create --name examzone-backend --resource-group $RESOURCE_GROUP --environment $CONTAINER_ENV --image "$ACR_LOGIN_SERVER/examzone-backend:$IMAGE_TAG" --target-port 3000 --ingress external --registry-server $ACR_LOGIN_SERVER --registry-username $ACR_USERNAME --registry-password $ACR_PASSWORD --secrets "mongodb-uri=$env:MONGODB_URI" "jwt-secret=$env:JWT_SECRET" "session-secret=$env:SESSION_SECRET" "gemini-api-key=$env:GEMINI_API_KEY" --env-vars "MONGODB_URI=secretref:mongodb-uri" "JWT_SECRET=secretref:jwt-secret" "SESSION_SECRET=secretref:session-secret" "GEMINI_API_KEY=secretref:gemini-api-key" "AI_QUESTION_GENERATOR_URL=https://$AI_GENERATOR_FQDN" "AI_ANSWER_CHECKER_URL=https://$AI_CHECKER_FQDN" "FRONTEND_URL=$env:FRONTEND_URL" "NODE_ENV=production" --cpu 0.5 --memory 1Gi --min-replicas 1 --max-replicas 3 --output none
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
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "   1. Go to Vercel dashboard" -ForegroundColor White
Write-Host "   2. Navigate to your project settings" -ForegroundColor White
Write-Host "   3. Update VITE_API_URL environment variable" -ForegroundColor White
Write-Host "   4. Redeploy your frontend" -ForegroundColor White
Write-Host ""
