# ==================================================================
# EXAMZONE AZURE CONTAINER DEPLOYMENT SCRIPT (PowerShell/Windows)
# ==================================================================
# This script automates the deployment of ExamZone to Azure Container Apps
# Prerequisites: Azure CLI installed and logged in
# ==================================================================

# Enable strict mode
$ErrorActionPreference = "Stop"

# ==================================================================
# CONFIGURATION
# ==================================================================
$RESOURCE_GROUP = "examzone-rg"
$LOCATION = "eastus"
$ACR_NAME = "examzoneregistry"
$CONTAINER_ENV = "examzone-env"

# Service names
$BACKEND_APP = "examzone-backend"
$AI_GENERATOR_APP = "examzone-ai-generator"
$AI_CHECKER_APP = "examzone-ai-checker"

# Image tag (use commit SHA or version)
$IMAGE_TAG = if ($env:IMAGE_TAG) { $env:IMAGE_TAG } else { "latest" }

# ==================================================================
# HELPER FUNCTIONS
# ==================================================================
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning-Custom {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-AzureLogin {
    Write-Info "Checking Azure login status..."
    try {
        $account = az account show 2>$null | ConvertFrom-Json
        if (-not $account) {
            throw "Not logged in"
        }
        Write-Success "Logged into Azure subscription: $($account.name)"
        return $true
    }
    catch {
        Write-Error-Custom "Not logged into Azure. Please run: az login"
        exit 1
    }
}

# ==================================================================
# STEP 1: SETUP AZURE RESOURCES
# ==================================================================
function Setup-AzureResources {
    Write-Info "Setting up Azure resources..."
    
    # Create resource group
    Write-Info "Creating resource group: $RESOURCE_GROUP"
    $rgExists = az group exists --name $RESOURCE_GROUP
    if ($rgExists -eq "true") {
        Write-Warning-Custom "Resource group already exists"
    }
    else {
        az group create --name $RESOURCE_GROUP --location $LOCATION
        Write-Success "Resource group created"
    }
    
    # Create Azure Container Registry
    Write-Info "Creating Azure Container Registry: $ACR_NAME"
    try {
        az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP 2>$null | Out-Null
        Write-Warning-Custom "ACR already exists"
    }
    catch {
        az acr create `
            --resource-group $RESOURCE_GROUP `
            --name $ACR_NAME `
            --sku Basic `
            --admin-enabled true
        Write-Success "ACR created"
    }
    
    # Create Container Apps environment
    Write-Info "Creating Container Apps environment: $CONTAINER_ENV"
    try {
        az containerapp env show --name $CONTAINER_ENV --resource-group $RESOURCE_GROUP 2>$null | Out-Null
        Write-Warning-Custom "Container Apps environment already exists"
    }
    catch {
        az containerapp env create `
            --name $CONTAINER_ENV `
            --resource-group $RESOURCE_GROUP `
            --location $LOCATION
        Write-Success "Container Apps environment created"
    }
}

# ==================================================================
# STEP 2: BUILD AND PUSH DOCKER IMAGES
# ==================================================================
function Build-AndPushImages {
    Write-Info "Building and pushing Docker images..."
    
    # Login to ACR
    Write-Info "Logging into ACR..."
    az acr login --name $ACR_NAME
    
    # Get ACR login server
    $ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer --output tsv
    Write-Info "ACR Login Server: $ACR_LOGIN_SERVER"
    
    # Build and push backend
    Write-Info "Building backend image..."
    docker build -t "$ACR_LOGIN_SERVER/${BACKEND_APP}:$IMAGE_TAG" ./backend
    Write-Info "Pushing backend image..."
    docker push "$ACR_LOGIN_SERVER/${BACKEND_APP}:$IMAGE_TAG"
    Write-Success "Backend image pushed"
    
    # Build and push AI Question Generator
    Write-Info "Building AI Question Generator image..."
    docker build -t "$ACR_LOGIN_SERVER/${AI_GENERATOR_APP}:$IMAGE_TAG" ./ai-services/question-generator
    Write-Info "Pushing AI Question Generator image..."
    docker push "$ACR_LOGIN_SERVER/${AI_GENERATOR_APP}:$IMAGE_TAG"
    Write-Success "AI Question Generator image pushed"
    
    # Build and push AI Answer Checker
    Write-Info "Building AI Answer Checker image..."
    docker build -t "$ACR_LOGIN_SERVER/${AI_CHECKER_APP}:$IMAGE_TAG" ./ai-services/answer-checker
    Write-Info "Pushing AI Answer Checker image..."
    docker push "$ACR_LOGIN_SERVER/${AI_CHECKER_APP}:$IMAGE_TAG"
    Write-Success "AI Answer Checker image pushed"
}

# ==================================================================
# STEP 3: DEPLOY CONTAINER APPS
# ==================================================================
function Deploy-ContainerApps {
    Write-Info "Deploying Container Apps..."
    
    # Get ACR credentials
    $ACR_LOGIN_SERVER = az acr show --name $ACR_NAME --query loginServer --output tsv
    $ACR_USERNAME = az acr credential show --name $ACR_NAME --query username --output tsv
    $ACR_PASSWORD = az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv
    
    # Check for required environment variables
    if (-not $env:GEMINI_API_KEY) {
        Write-Error-Custom "GEMINI_API_KEY environment variable not set"
        exit 1
    }
    
    if (-not $env:MONGODB_URI) {
        Write-Error-Custom "MONGODB_URI environment variable not set"
        exit 1
    }
    
    if (-not $env:JWT_SECRET) {
        Write-Error-Custom "JWT_SECRET environment variable not set"
        exit 1
    }
    
    if (-not $env:SESSION_SECRET) {
        Write-Error-Custom "SESSION_SECRET environment variable not set"
        exit 1
    }
    
    if (-not $env:FRONTEND_URL) {
        Write-Error-Custom "FRONTEND_URL environment variable not set"
        exit 1
    }
    
    # Deploy AI Question Generator
    Write-Info "Deploying AI Question Generator..."
    try {
        az containerapp show --name $AI_GENERATOR_APP --resource-group $RESOURCE_GROUP 2>$null | Out-Null
        Write-Info "Updating existing container app..."
        az containerapp update `
            --name $AI_GENERATOR_APP `
            --resource-group $RESOURCE_GROUP `
            --image "$ACR_LOGIN_SERVER/${AI_GENERATOR_APP}:$IMAGE_TAG"
    }
    catch {
        az containerapp create `
            --name $AI_GENERATOR_APP `
            --resource-group $RESOURCE_GROUP `
            --environment $CONTAINER_ENV `
            --image "$ACR_LOGIN_SERVER/${AI_GENERATOR_APP}:$IMAGE_TAG" `
            --target-port 5001 `
            --ingress external `
            --registry-server $ACR_LOGIN_SERVER `
            --registry-username $ACR_USERNAME `
            --registry-password $ACR_PASSWORD `
            --env-vars PORT=5001 GEMINI_API_KEY=$env:GEMINI_API_KEY `
            --cpu 0.5 --memory 1.0Gi `
            --min-replicas 1 --max-replicas 3
    }
    Write-Success "AI Question Generator deployed"
    
    # Deploy AI Answer Checker
    Write-Info "Deploying AI Answer Checker..."
    try {
        az containerapp show --name $AI_CHECKER_APP --resource-group $RESOURCE_GROUP 2>$null | Out-Null
        Write-Info "Updating existing container app..."
        az containerapp update `
            --name $AI_CHECKER_APP `
            --resource-group $RESOURCE_GROUP `
            --image "$ACR_LOGIN_SERVER/${AI_CHECKER_APP}:$IMAGE_TAG"
    }
    catch {
        az containerapp create `
            --name $AI_CHECKER_APP `
            --resource-group $RESOURCE_GROUP `
            --environment $CONTAINER_ENV `
            --image "$ACR_LOGIN_SERVER/${AI_CHECKER_APP}:$IMAGE_TAG" `
            --target-port 5002 `
            --ingress external `
            --registry-server $ACR_LOGIN_SERVER `
            --registry-username $ACR_USERNAME `
            --registry-password $ACR_PASSWORD `
            --env-vars PORT=5002 GEMINI_API_KEY=$env:GEMINI_API_KEY `
            --cpu 0.5 --memory 1.0Gi `
            --min-replicas 1 --max-replicas 3
    }
    Write-Success "AI Answer Checker deployed"
    
    # Get AI service URLs
    $AI_GENERATOR_URL = az containerapp show --name $AI_GENERATOR_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv
    $AI_CHECKER_URL = az containerapp show --name $AI_CHECKER_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv
    
    Write-Info "AI Generator URL: https://$AI_GENERATOR_URL"
    Write-Info "AI Checker URL: https://$AI_CHECKER_URL"
    
    # Deploy Backend
    Write-Info "Deploying Backend..."
    try {
        az containerapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP 2>$null | Out-Null
        Write-Info "Updating existing container app..."
        az containerapp update `
            --name $BACKEND_APP `
            --resource-group $RESOURCE_GROUP `
            --image "$ACR_LOGIN_SERVER/${BACKEND_APP}:$IMAGE_TAG" `
            --set-env-vars `
                AI_QUESTION_GENERATOR_URL=https://$AI_GENERATOR_URL `
                AI_ANSWER_CHECKER_URL=https://$AI_CHECKER_URL
    }
    catch {
        az containerapp create `
            --name $BACKEND_APP `
            --resource-group $RESOURCE_GROUP `
            --environment $CONTAINER_ENV `
            --image "$ACR_LOGIN_SERVER/${BACKEND_APP}:$IMAGE_TAG" `
            --target-port 3000 `
            --ingress external `
            --registry-server $ACR_LOGIN_SERVER `
            --registry-username $ACR_USERNAME `
            --registry-password $ACR_PASSWORD `
            --env-vars `
                NODE_ENV=production `
                PORT=3000 `
                MONGODB_URI=$env:MONGODB_URI `
                JWT_SECRET=$env:JWT_SECRET `
                SESSION_SECRET=$env:SESSION_SECRET `
                FRONTEND_URL=$env:FRONTEND_URL `
                AI_QUESTION_GENERATOR_URL=https://$AI_GENERATOR_URL `
                AI_ANSWER_CHECKER_URL=https://$AI_CHECKER_URL `
                GEMINI_API_KEY=$env:GEMINI_API_KEY `
            --cpu 1.0 --memory 2.0Gi `
            --min-replicas 1 --max-replicas 5
    }
    Write-Success "Backend deployed"
    
    return @{
        BackendUrl = $BACKEND_URL
        AIGeneratorUrl = $AI_GENERATOR_URL
        AICheckerUrl = $AI_CHECKER_URL
    }
}

# ==================================================================
# STEP 4: DISPLAY DEPLOYMENT INFORMATION
# ==================================================================
function Show-DeploymentInfo {
    Write-Success "🎉 Deployment completed successfully!"
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "📋 DEPLOYMENT INFORMATION"
    Write-Host "=========================================="
    
    $BACKEND_URL = az containerapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv
    $AI_GENERATOR_URL = az containerapp show --name $AI_GENERATOR_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv
    $AI_CHECKER_URL = az containerapp show --name $AI_CHECKER_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv
    
    Write-Host "Backend URL: https://$BACKEND_URL"
    Write-Host "AI Generator URL: https://$AI_GENERATOR_URL"
    Write-Host "AI Checker URL: https://$AI_CHECKER_URL"
    Write-Host ""
    Write-Host "Test the deployment:"
    Write-Host "  curl https://$BACKEND_URL/health"
    Write-Host ""
    Write-Host "View logs:"
    Write-Host "  az containerapp logs show --name $BACKEND_APP --resource-group $RESOURCE_GROUP --follow"
    Write-Host "=========================================="
}

# ==================================================================
# MAIN EXECUTION
# ==================================================================
function Main {
    Write-Host ""
    Write-Host "=========================================="
    Write-Host "🚀 ExamZone Azure Deployment"
    Write-Host "=========================================="
    Write-Host ""
    
    Test-AzureLogin
    Setup-AzureResources
    Build-AndPushImages
    Deploy-ContainerApps
    Show-DeploymentInfo
}

# Run main function
try {
    Main
}
catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    exit 1
}
