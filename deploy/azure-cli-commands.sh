#!/bin/bash

# ==================================================================
# EXAMZONE AZURE CONTAINER DEPLOYMENT SCRIPT (Bash/Linux/Mac)
# ==================================================================
# This script automates the deployment of ExamZone to Azure Container Apps
# Prerequisites: Azure CLI installed and logged in
# ==================================================================

set -e  # Exit on error

# ==================================================================
# CONFIGURATION
# ==================================================================
RESOURCE_GROUP="examzone-rg"
LOCATION="eastus"
ACR_NAME="examzoneregistry"
CONTAINER_ENV="examzone-env"

# Service names
BACKEND_APP="examzone-backend"
AI_GENERATOR_APP="examzone-ai-generator"
AI_CHECKER_APP="examzone-ai-checker"

# Image tag (use commit SHA or version)
IMAGE_TAG="${IMAGE_TAG:-latest}"

# ==================================================================
# COLOR CODES FOR OUTPUT
# ==================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ==================================================================
# HELPER FUNCTIONS
# ==================================================================
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_azure_login() {
    log_info "Checking Azure login status..."
    if ! az account show &> /dev/null; then
        log_error "Not logged into Azure. Please run: az login"
        exit 1
    fi
    SUBSCRIPTION=$(az account show --query name -o tsv)
    log_success "Logged into Azure subscription: $SUBSCRIPTION"
}

# ==================================================================
# STEP 1: SETUP AZURE RESOURCES
# ==================================================================
setup_azure_resources() {
    log_info "Setting up Azure resources..."
    
    # Create resource group
    log_info "Creating resource group: $RESOURCE_GROUP"
    if az group show --name $RESOURCE_GROUP &> /dev/null; then
        log_warning "Resource group already exists"
    else
        az group create --name $RESOURCE_GROUP --location $LOCATION
        log_success "Resource group created"
    fi
    
    # Create Azure Container Registry
    log_info "Creating Azure Container Registry: $ACR_NAME"
    if az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
        log_warning "ACR already exists"
    else
        az acr create \
            --resource-group $RESOURCE_GROUP \
            --name $ACR_NAME \
            --sku Basic \
            --admin-enabled true
        log_success "ACR created"
    fi
    
    # Create Container Apps environment
    log_info "Creating Container Apps environment: $CONTAINER_ENV"
    if az containerapp env show --name $CONTAINER_ENV --resource-group $RESOURCE_GROUP &> /dev/null; then
        log_warning "Container Apps environment already exists"
    else
        az containerapp env create \
            --name $CONTAINER_ENV \
            --resource-group $RESOURCE_GROUP \
            --location $LOCATION
        log_success "Container Apps environment created"
    fi
}

# ==================================================================
# STEP 2: BUILD AND PUSH DOCKER IMAGES
# ==================================================================
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Login to ACR
    log_info "Logging into ACR..."
    az acr login --name $ACR_NAME
    
    # Get ACR login server
    ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
    log_info "ACR Login Server: $ACR_LOGIN_SERVER"
    
    # Build and push backend
    log_info "Building backend image..."
    docker build -t $ACR_LOGIN_SERVER/$BACKEND_APP:$IMAGE_TAG ./backend
    log_info "Pushing backend image..."
    docker push $ACR_LOGIN_SERVER/$BACKEND_APP:$IMAGE_TAG
    log_success "Backend image pushed"
    
    # Build and push AI Question Generator
    log_info "Building AI Question Generator image..."
    docker build -t $ACR_LOGIN_SERVER/$AI_GENERATOR_APP:$IMAGE_TAG ./ai-services/question-generator
    log_info "Pushing AI Question Generator image..."
    docker push $ACR_LOGIN_SERVER/$AI_GENERATOR_APP:$IMAGE_TAG
    log_success "AI Question Generator image pushed"
    
    # Build and push AI Answer Checker
    log_info "Building AI Answer Checker image..."
    docker build -t $ACR_LOGIN_SERVER/$AI_CHECKER_APP:$IMAGE_TAG ./ai-services/answer-checker
    log_info "Pushing AI Answer Checker image..."
    docker push $ACR_LOGIN_SERVER/$AI_CHECKER_APP:$IMAGE_TAG
    log_success "AI Answer Checker image pushed"
}

# ==================================================================
# STEP 3: DEPLOY CONTAINER APPS
# ==================================================================
deploy_container_apps() {
    log_info "Deploying Container Apps..."
    
    # Get ACR credentials
    ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
    ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username --output tsv)
    ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query passwords[0].value --output tsv)
    
    # Check for required environment variables
    if [ -z "$GEMINI_API_KEY" ]; then
        log_error "GEMINI_API_KEY environment variable not set"
        exit 1
    fi
    
    if [ -z "$MONGODB_URI" ]; then
        log_error "MONGODB_URI environment variable not set"
        exit 1
    fi
    
    if [ -z "$JWT_SECRET" ]; then
        log_error "JWT_SECRET environment variable not set"
        exit 1
    fi
    
    if [ -z "$SESSION_SECRET" ]; then
        log_error "SESSION_SECRET environment variable not set"
        exit 1
    fi
    
    if [ -z "$FRONTEND_URL" ]; then
        log_error "FRONTEND_URL environment variable not set"
        exit 1
    fi
    
    # Deploy AI Question Generator
    log_info "Deploying AI Question Generator..."
    if az containerapp show --name $AI_GENERATOR_APP --resource-group $RESOURCE_GROUP &> /dev/null; then
        log_info "Updating existing container app..."
        az containerapp update \
            --name $AI_GENERATOR_APP \
            --resource-group $RESOURCE_GROUP \
            --image $ACR_LOGIN_SERVER/$AI_GENERATOR_APP:$IMAGE_TAG
    else
        az containerapp create \
            --name $AI_GENERATOR_APP \
            --resource-group $RESOURCE_GROUP \
            --environment $CONTAINER_ENV \
            --image $ACR_LOGIN_SERVER/$AI_GENERATOR_APP:$IMAGE_TAG \
            --target-port 5001 \
            --ingress external \
            --registry-server $ACR_LOGIN_SERVER \
            --registry-username $ACR_USERNAME \
            --registry-password $ACR_PASSWORD \
            --env-vars PORT=5001 GEMINI_API_KEY=$GEMINI_API_KEY \
            --cpu 0.5 --memory 1.0Gi \
            --min-replicas 1 --max-replicas 3
    fi
    log_success "AI Question Generator deployed"
    
    # Deploy AI Answer Checker
    log_info "Deploying AI Answer Checker..."
    if az containerapp show --name $AI_CHECKER_APP --resource-group $RESOURCE_GROUP &> /dev/null; then
        log_info "Updating existing container app..."
        az containerapp update \
            --name $AI_CHECKER_APP \
            --resource-group $RESOURCE_GROUP \
            --image $ACR_LOGIN_SERVER/$AI_CHECKER_APP:$IMAGE_TAG
    else
        az containerapp create \
            --name $AI_CHECKER_APP \
            --resource-group $RESOURCE_GROUP \
            --environment $CONTAINER_ENV \
            --image $ACR_LOGIN_SERVER/$AI_CHECKER_APP:$IMAGE_TAG \
            --target-port 5002 \
            --ingress external \
            --registry-server $ACR_LOGIN_SERVER \
            --registry-username $ACR_USERNAME \
            --registry-password $ACR_PASSWORD \
            --env-vars PORT=5002 GEMINI_API_KEY=$GEMINI_API_KEY \
            --cpu 0.5 --memory 1.0Gi \
            --min-replicas 1 --max-replicas 3
    fi
    log_success "AI Answer Checker deployed"
    
    # Get AI service URLs
    AI_GENERATOR_URL=$(az containerapp show --name $AI_GENERATOR_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv)
    AI_CHECKER_URL=$(az containerapp show --name $AI_CHECKER_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv)
    
    log_info "AI Generator URL: https://$AI_GENERATOR_URL"
    log_info "AI Checker URL: https://$AI_CHECKER_URL"
    
    # Deploy Backend
    log_info "Deploying Backend..."
    if az containerapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP &> /dev/null; then
        log_info "Updating existing container app..."
        az containerapp update \
            --name $BACKEND_APP \
            --resource-group $RESOURCE_GROUP \
            --image $ACR_LOGIN_SERVER/$BACKEND_APP:$IMAGE_TAG \
            --set-env-vars \
                AI_QUESTION_GENERATOR_URL=https://$AI_GENERATOR_URL \
                AI_ANSWER_CHECKER_URL=https://$AI_CHECKER_URL
    else
        az containerapp create \
            --name $BACKEND_APP \
            --resource-group $RESOURCE_GROUP \
            --environment $CONTAINER_ENV \
            --image $ACR_LOGIN_SERVER/$BACKEND_APP:$IMAGE_TAG \
            --target-port 3000 \
            --ingress external \
            --registry-server $ACR_LOGIN_SERVER \
            --registry-username $ACR_USERNAME \
            --registry-password $ACR_PASSWORD \
            --env-vars \
                NODE_ENV=production \
                PORT=3000 \
                MONGODB_URI=$MONGODB_URI \
                JWT_SECRET=$JWT_SECRET \
                SESSION_SECRET=$SESSION_SECRET \
                FRONTEND_URL=$FRONTEND_URL \
                AI_QUESTION_GENERATOR_URL=https://$AI_GENERATOR_URL \
                AI_ANSWER_CHECKER_URL=https://$AI_CHECKER_URL \
                GEMINI_API_KEY=$GEMINI_API_KEY \
            --cpu 1.0 --memory 2.0Gi \
            --min-replicas 1 --max-replicas 5
    fi
    log_success "Backend deployed"
}

# ==================================================================
# STEP 4: DISPLAY DEPLOYMENT INFORMATION
# ==================================================================
display_info() {
    log_success "🎉 Deployment completed successfully!"
    echo ""
    echo "=========================================="
    echo "📋 DEPLOYMENT INFORMATION"
    echo "=========================================="
    
    BACKEND_URL=$(az containerapp show --name $BACKEND_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv)
    AI_GENERATOR_URL=$(az containerapp show --name $AI_GENERATOR_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv)
    AI_CHECKER_URL=$(az containerapp show --name $AI_CHECKER_APP --resource-group $RESOURCE_GROUP --query properties.configuration.ingress.fqdn --output tsv)
    
    echo "Backend URL: https://$BACKEND_URL"
    echo "AI Generator URL: https://$AI_GENERATOR_URL"
    echo "AI Checker URL: https://$AI_CHECKER_URL"
    echo ""
    echo "Test the deployment:"
    echo "  curl https://$BACKEND_URL/health"
    echo ""
    echo "View logs:"
    echo "  az containerapp logs show --name $BACKEND_APP --resource-group $RESOURCE_GROUP --follow"
    echo "=========================================="
}

# ==================================================================
# MAIN EXECUTION
# ==================================================================
main() {
    echo ""
    echo "=========================================="
    echo "🚀 ExamZone Azure Deployment"
    echo "=========================================="
    echo ""
    
    check_azure_login
    setup_azure_resources
    build_and_push_images
    deploy_container_apps
    display_info
}

# Run main function
main
