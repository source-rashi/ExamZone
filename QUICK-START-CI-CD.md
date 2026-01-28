# Quick Start: Deploy ExamZone with CI/CD

Follow these steps in order for complete deployment with auto-deploy on push.

## 🚀 Quick Commands

### 1. Login to GitHub Container Registry

```powershell
# Create GitHub PAT at: https://github.com/settings/tokens
# Grant: write:packages, read:packages
$env:GITHUB_TOKEN = "YOUR_GITHUB_PAT_HERE"
echo $env:GITHUB_TOKEN | docker login ghcr.io -u source-rashi --password-stdin
```

### 2. Deploy to Azure

```powershell
cd C:\Users\rashi\OneDrive\Desktop\ExamZone\ExamZone
.\deploy\azure-deploy-ghcr.ps1
```

⏱️ Wait 10-15 minutes for deployment

### 3. Setup GitHub Actions CI/CD

```powershell
# Get subscription ID
$subscriptionId = az account show --query id -o tsv

# Create service principal
$sp = az ad sp create-for-rbac `
  --name "examzone-github-actions" `
  --role contributor `
  --scopes "/subscriptions/$subscriptionId/resourceGroups/examzone-rg" `
  --sdk-auth

Write-Host $sp
```

Copy the JSON output

### 4. Add GitHub Secret

1. Go to: https://github.com/source-rashi/ExamZone/settings/secrets/actions
2. New secret: `AZURE_CREDENTIALS`
3. Paste the JSON

### 5. Commit and Push

```powershell
git add .github/
git commit -m "feat: Add CI/CD with GitHub Container Registry"
git push origin main
```

Watch at: https://github.com/source-rashi/ExamZone/actions

### 6. Update Vercel

```powershell
# Get backend URL
$backendUrl = az containerapp show --name examzone-backend --resource-group examzone-rg --query properties.configuration.ingress.fqdn -o tsv
Write-Host "Update Vercel VITE_API_URL to: https://$backendUrl/api/v2"
```

1. Go to Vercel dashboard
2. Project settings → Environment Variables
3. Update `VITE_API_URL` to the URL above
4. Redeploy frontend

## ✅ Done!

Now every push to `main` automatically deploys to Azure!

## 📚 Detailed Guides

- [Full CI/CD Setup Guide](.github/SETUP-CI-CD.md)
- [Docker Setup Guide](../DOCKER-SETUP.md)
- [Azure Deployment Guide](../deploy/azure-container-setup.md)
