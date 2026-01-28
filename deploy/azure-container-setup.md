# 🚀 ExamZone Azure Container Deployment Guide

This guide walks you through deploying ExamZone to Azure using containers.

## 📋 Prerequisites

1. **Azure Account**: Active Azure subscription
2. **Azure CLI**: Installed and configured ([Install Guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
3. **Docker**: Installed locally for building images
4. **MongoDB Atlas**: Database connection string ready
5. **Gemini API Key**: For AI services

## 🏗️ Architecture Overview

ExamZone deploys as 3 containerized services:

1. **Backend Service** (Node.js) - Port 3000
2. **AI Question Generator** (FastAPI) - Port 5001  
3. **AI Answer Checker** (FastAPI) - Port 5002

All services are deployed to **Azure Container Apps** or **Azure App Service (Linux with Docker)**.

---

## 🔧 Deployment Options

### Option 1: Azure Container Apps (Recommended)
- Best for microservices
- Built-in load balancing
- Auto-scaling
- Pay per request

### Option 2: Azure App Service with Docker
- Traditional web app model
- Easier monitoring
- Integrated CI/CD

---

## 📝 Step-by-Step Deployment

### Step 1: Initial Setup

```bash
# Login to Azure
az login

# Set your subscription (if you have multiple)
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Create resource group
az group create \
  --name examzone-rg \
  --location eastus

# Create Azure Container Registry
az acr create \
  --resource-group examzone-rg \
  --name examzoneregistry \
  --sku Basic \
  --admin-enabled true
```

### Step 2: Build and Push Docker Images

```bash
# Login to ACR
az acr login --name examzoneregistry

# Get ACR login server
ACR_LOGIN_SERVER=$(az acr show --name examzoneregistry --query loginServer --output tsv)

# Build and push backend
docker build -t $ACR_LOGIN_SERVER/examzone-backend:latest ./backend
docker push $ACR_LOGIN_SERVER/examzone-backend:latest

# Build and push AI Question Generator
docker build -t $ACR_LOGIN_SERVER/examzone-ai-generator:latest ./ai-services/question-generator
docker push $ACR_LOGIN_SERVER/examzone-ai-generator:latest

# Build and push AI Answer Checker
docker build -t $ACR_LOGIN_SERVER/examzone-ai-checker:latest ./ai-services/answer-checker
docker push $ACR_LOGIN_SERVER/examzone-ai-checker:latest
```

### Step 3: Deploy to Azure Container Apps

```bash
# Create Container Apps environment
az containerapp env create \
  --name examzone-env \
  --resource-group examzone-rg \
  --location eastus

# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name examzoneregistry --query username --output tsv)
ACR_PASSWORD=$(az acr credential show --name examzoneregistry --query passwords[0].value --output tsv)

# Deploy AI Question Generator
az containerapp create \
  --name examzone-ai-generator \
  --resource-group examzone-rg \
  --environment examzone-env \
  --image $ACR_LOGIN_SERVER/examzone-ai-generator:latest \
  --target-port 5001 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --env-vars PORT=5001 GEMINI_API_KEY=your-gemini-api-key \
  --cpu 0.5 --memory 1.0Gi

# Deploy AI Answer Checker
az containerapp create \
  --name examzone-ai-checker \
  --resource-group examzone-rg \
  --environment examzone-env \
  --image $ACR_LOGIN_SERVER/examzone-ai-checker:latest \
  --target-port 5002 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --env-vars PORT=5002 GEMINI_API_KEY=your-gemini-api-key \
  --cpu 0.5 --memory 1.0Gi

# Get AI service URLs
AI_GENERATOR_URL=$(az containerapp show --name examzone-ai-generator --resource-group examzone-rg --query properties.configuration.ingress.fqdn --output tsv)
AI_CHECKER_URL=$(az containerapp show --name examzone-ai-checker --resource-group examzone-rg --query properties.configuration.ingress.fqdn --output tsv)

# Deploy Backend
az containerapp create \
  --name examzone-backend \
  --resource-group examzone-rg \
  --environment examzone-env \
  --image $ACR_LOGIN_SERVER/examzone-backend:latest \
  --target-port 3000 \
  --ingress external \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --env-vars \
    NODE_ENV=production \
    PORT=3000 \
    MONGODB_URI=your-mongodb-atlas-connection-string \
    JWT_SECRET=your-jwt-secret \
    SESSION_SECRET=your-session-secret \
    FRONTEND_URL=https://your-frontend-domain.vercel.app \
    AI_QUESTION_GENERATOR_URL=https://$AI_GENERATOR_URL \
    AI_ANSWER_CHECKER_URL=https://$AI_CHECKER_URL \
    GEMINI_API_KEY=your-gemini-api-key \
  --cpu 1.0 --memory 2.0Gi
```

### Step 4: Configure Custom Domain (Optional)

```bash
# Add custom domain to backend
az containerapp hostname add \
  --hostname api.examzone.com \
  --resource-group examzone-rg \
  --name examzone-backend

# Bind SSL certificate
az containerapp hostname bind \
  --hostname api.examzone.com \
  --resource-group examzone-rg \
  --name examzone-backend \
  --certificate-name examzone-cert \
  --validation-method HTTP
```

---

## 🔐 Environment Variables

### Backend Required Variables:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `SESSION_SECRET` - Session secret (min 32 chars)
- `FRONTEND_URL` - Frontend Vercel URL
- `GEMINI_API_KEY` - Google Gemini API key
- `AI_QUESTION_GENERATOR_URL` - AI Generator service URL
- `AI_ANSWER_CHECKER_URL` - AI Checker service URL

### AI Services Required Variables:
- `GEMINI_API_KEY` - Google Gemini API key
- `PORT` - Service port (5001 or 5002)

---

## 📊 Monitoring and Logs

### View Container Logs
```bash
# Backend logs
az containerapp logs show \
  --name examzone-backend \
  --resource-group examzone-rg \
  --follow

# AI Generator logs
az containerapp logs show \
  --name examzone-ai-generator \
  --resource-group examzone-rg \
  --follow

# AI Checker logs
az containerapp logs show \
  --name examzone-ai-checker \
  --resource-group examzone-rg \
  --follow
```

### Enable Application Insights (Optional)
```bash
# Create Application Insights
az monitor app-insights component create \
  --app examzone-insights \
  --location eastus \
  --resource-group examzone-rg

# Get instrumentation key
INSTRUMENTATION_KEY=$(az monitor app-insights component show \
  --app examzone-insights \
  --resource-group examzone-rg \
  --query instrumentationKey \
  --output tsv)

# Update backend with instrumentation key
az containerapp update \
  --name examzone-backend \
  --resource-group examzone-rg \
  --set-env-vars APPINSIGHTS_INSTRUMENTATIONKEY=$INSTRUMENTATION_KEY
```

---

## 🔄 Updating Deployments

### Rebuild and Update Images
```bash
# Build new version
docker build -t $ACR_LOGIN_SERVER/examzone-backend:v2 ./backend
docker push $ACR_LOGIN_SERVER/examzone-backend:v2

# Update container app
az containerapp update \
  --name examzone-backend \
  --resource-group examzone-rg \
  --image $ACR_LOGIN_SERVER/examzone-backend:v2
```

### Zero-Downtime Deployment
Azure Container Apps automatically handles zero-downtime deployments with rolling updates.

---

## 💰 Cost Optimization

1. **Use Consumption Plan**: Pay only for what you use
2. **Scale to Zero**: Enable for non-production environments
3. **Right-size Resources**: Start small (0.5 CPU, 1GB RAM)
4. **Enable Auto-scaling**: Based on HTTP requests or CPU
5. **Use Free Tier**: MongoDB Atlas (512MB), ACR (100GB storage)

### Estimated Monthly Costs:
- Azure Container Apps: ~$20-50/month (with scaling)
- Azure Container Registry: ~$5/month (Basic tier)
- MongoDB Atlas: $0 (Free tier) or ~$25 (Shared tier)
- **Total**: ~$25-75/month

---

## 🛡️ Security Checklist

- ✅ All secrets stored in Azure Key Vault or env variables
- ✅ HTTPS enabled on all endpoints
- ✅ CORS configured for frontend domain only
- ✅ MongoDB Atlas IP whitelist configured
- ✅ Rate limiting enabled in backend
- ✅ Container registries are private
- ✅ Regular security updates for base images

---

## 🧪 Testing Deployment

```bash
# Get backend URL
BACKEND_URL=$(az containerapp show \
  --name examzone-backend \
  --resource-group examzone-rg \
  --query properties.configuration.ingress.fqdn \
  --output tsv)

# Test health endpoint
curl https://$BACKEND_URL/health

# Test AI services
curl https://$AI_GENERATOR_URL/health
curl https://$AI_CHECKER_URL/health
```

---

## 🔧 Troubleshooting

### Container Won't Start
```bash
# Check logs
az containerapp logs show --name examzone-backend --resource-group examzone-rg --tail 100

# Check revisions
az containerapp revision list --name examzone-backend --resource-group examzone-rg
```

### Database Connection Issues
- Verify MongoDB Atlas IP whitelist includes Azure IPs
- Check connection string format
- Test connection from local Docker first

### AI Services Not Responding
- Verify Gemini API key is set
- Check service-to-service networking
- Verify ports and ingress configuration

---

## 📚 Additional Resources

- [Azure Container Apps Documentation](https://docs.microsoft.com/en-us/azure/container-apps/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [MongoDB Atlas Azure Integration](https://docs.atlas.mongodb.com/security-azure/)
- [Azure CLI Reference](https://docs.microsoft.com/en-us/cli/azure/)

---

## 🆘 Support

For issues or questions:
1. Check logs using Azure CLI
2. Review environment variables
3. Test services individually
4. Contact Azure Support if infrastructure issue

---

**Last Updated**: Phase 10 - Dockerization Complete
