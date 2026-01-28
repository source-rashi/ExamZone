# GitHub Actions CI/CD Setup Guide

This guide explains how to configure automatic deployment to Azure Container Apps when you push to the `main` branch.

## ✅ Solution for Azure Student Subscription

Since Azure for Students subscriptions have region restrictions for Azure Container Registry (ACR), we use **GitHub Container Registry (GHCR)** instead - which is **FREE** and has no restrictions!

## Prerequisites

- ✅ Azure subscription (already logged in)
- ✅ GitHub repository with push access
- ✅ Docker installed locally

## Step 1: Create GitHub Personal Access Token (PAT)

1. Go to https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Give it a name: `ExamZone GHCR Access`
4. Set expiration: **No expiration** (or your preference)
5. Select scopes:
   - ✅ `write:packages` (Upload packages to GitHub Package Registry)
   - ✅ `read:packages` (Download packages from GitHub Package Registry)
   - ✅ `delete:packages` (Delete packages from GitHub Package Registry) [optional]
6. Click **Generate token**
7. **COPY THE TOKEN** - you won't see it again!

## Step 2: Login to GitHub Container Registry

In PowerShell:

```powershell
# Replace YOUR_GITHUB_PAT with the token you just created
$env:GITHUB_TOKEN = "YOUR_GITHUB_PAT"
echo $env:GITHUB_TOKEN | docker login ghcr.io -u source-rashi --password-stdin
```

Verify login:
```powershell
docker pull ghcr.io/microsoft/dotnet-samples:aspnetapp
```

## Step 3: Initial Azure Deployment

Run the deployment script (uses GHCR instead of ACR):

```powershell
.\deploy\azure-deploy-ghcr.ps1
```

This will:
- ✅ Create Azure resource group
- ✅ Build Docker images locally
- ✅ Push images to GitHub Container Registry
- ✅ Create Azure Container Apps Environment
- ✅ Deploy all 3 services to Azure

**Estimated time:** 10-15 minutes

## Step 4: Create Azure Service Principal for GitHub Actions

```powershell
# Get your subscription ID
$subscriptionId = az account show --query id -o tsv

# Create service principal
$servicePrincipal = az ad sp create-for-rbac `
  --name "examzone-github-actions" `
  --role contributor `
  --scopes "/subscriptions/$subscriptionId/resourceGroups/examzone-rg" `
  --sdk-auth

# Display the credentials
Write-Host $servicePrincipal
```

**COPY THE ENTIRE JSON OUTPUT!** It looks like:

```json
{
  "clientId": "xxxxx",
  "clientSecret": "xxxxx",
  "subscriptionId": "xxxxx",
  "tenantId": "xxxxx",
  ...
}
```

## Step 5: Configure GitHub Repository Secrets

1. Go to: https://github.com/source-rashi/ExamZone/settings/secrets/actions
2. Click **New repository secret**
3. Add the following secret:

| Secret Name | Value |
|------------|-------|
| `AZURE_CREDENTIALS` | Paste the entire JSON from Step 4 |

That's it! `GITHUB_TOKEN` is automatically available in GitHub Actions.

## Step 6: Test CI/CD Pipeline

Commit and push the workflow:

```powershell
git add .github/workflows/azure-deploy.yml .github/SETUP-CI-CD.md deploy/azure-deploy-ghcr.ps1
git commit -m "feat: Add GitHub Actions CI/CD with GHCR"
git push origin main
```

Monitor deployment:
- **GitHub Actions**: https://github.com/source-rashi/ExamZone/actions
- **Azure Portal**: https://portal.azure.com → examzone-rg

## Step 7: Update Vercel Frontend

After deployment completes, get your backend URL:

```powershell
az containerapp show --name examzone-backend --resource-group examzone-rg --query properties.configuration.ingress.fqdn -o tsv
```

Then update Vercel:
1. Go to: https://vercel.com/dashboard
2. Select your ExamZone project
3. Settings → Environment Variables
4. Update `VITE_API_URL` to: `https://YOUR_BACKEND_URL/api/v2`
5. Redeploy frontend

## How CI/CD Works

Every push to `main` branch triggers:

1. ✅ GitHub Actions checks out code
2. ✅ Logs into Azure (using service principal)
3. ✅ Logs into GHCR (using GitHub token)
4. ✅ Builds 3 Docker images
5. ✅ Pushes images to `ghcr.io/source-rashi/*`
6. ✅ Updates Azure Container Apps with new images
7. ✅ Deployment completes in ~5-8 minutes

## Viewing Published Packages

Your Docker images are visible at:
- https://github.com/source-rashi?tab=packages

## Manual Deployment Trigger

1. Go to: https://github.com/source-rashi/ExamZone/actions
2. Select **Deploy to Azure Container Apps**
3. Click **Run workflow** → **Run workflow**

## Troubleshooting

### Error: "authentication required"

```powershell
# Re-login to GHCR
echo $env:GITHUB_TOKEN | docker login ghcr.io -u source-rashi --password-stdin
```

### Error: "The client does not have authorization"

- Re-check `AZURE_CREDENTIALS` secret is valid JSON
- Verify service principal has Contributor role

### Container app won't start

- Check logs: `az containerapp logs show --name examzone-backend --resource-group examzone-rg --follow`
- Verify environment variables are set correctly

### Images are private by default

Make packages public (optional):
1. Go to https://github.com/source-rashi?tab=packages
2. Select package → Package settings
3. Scroll to **Danger Zone** → Change visibility → Public

## Cost Estimate (Azure for Students)

- Container Apps Environment: **FREE** (with $100 credit)
- 3x Container Apps (0.5 CPU, 1GB RAM): ~$20-30/month
- GitHub Container Registry: **FREE** (unlimited public packages, 500MB private storage)

## Security Best Practices

- ✅ Never commit `.env` files
- ✅ Use GitHub Secrets for all sensitive values
- ✅ Rotate service principal credentials every 90 days
- ✅ Use least-privilege access
- ✅ Keep GitHub PAT secure

## Next Steps

✅ Push any code change to `main` → auto-deploy to Azure!
✅ Update Vercel environment variable
✅ Test end-to-end workflow

🎉 **Your CI/CD pipeline is ready!**
