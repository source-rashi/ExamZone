# 🐳 ExamZone Docker Setup

This guide explains how to run ExamZone using Docker containers locally and prepare for cloud deployment.

## 📋 Prerequisites

- **Docker**: Version 20.10 or higher ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.0 or higher (included with Docker Desktop)
- **MongoDB Atlas**: Active database connection string
- **Gemini API Key**: For AI services ([Get API Key](https://makersuite.google.com/app/apikey))

## 🏗️ Architecture

ExamZone runs as 3 containerized services:

1. **Backend** (Node.js + Express) - Port 3000
2. **AI Question Generator** (FastAPI) - Port 5001
3. **AI Answer Checker** (FastAPI) - Port 5002

All services communicate through a Docker network. MongoDB Atlas is used as an external database (not containerized).

## 🚀 Quick Start (Local Development)

### Step 1: Clone and Setup Environment

```bash
# Navigate to project directory
cd ExamZone

# Copy the Docker environment template
cp .env.docker.example .env

# Edit .env with your actual values
# Required: MONGODB_URI, JWT_SECRET, SESSION_SECRET, GEMINI_API_KEY, FRONTEND_URL
```

### Step 2: Configure Environment Variables

Edit `.env` and set the following required variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/examzone

# Security
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars

# AI Services
GEMINI_API_KEY=your-gemini-api-key-here

# Frontend (if deployed)
FRONTEND_URL=http://localhost:5173
# Or for production: https://your-frontend.vercel.app
```

### Step 3: Build and Run Containers

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode (background)
docker compose up -d --build
```

### Step 4: Verify Services

Open your browser and check:

- Backend Health: http://localhost:3000/health
- AI Generator Health: http://localhost:5001/health
- AI Checker Health: http://localhost:5002/health

## 🛠️ Common Docker Commands

### Start Services
```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Start with rebuild
docker compose up --build
```

### Stop Services
```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Stop and remove images
docker compose down --rmi all
```

### View Logs
```bash
# View all logs
docker compose logs

# Follow logs (real-time)
docker compose logs -f

# View specific service logs
docker compose logs backend
docker compose logs ai-question-generator
docker compose logs ai-answer-checker

# Follow specific service
docker compose logs -f backend
```

### Service Management
```bash
# Restart a service
docker compose restart backend

# Rebuild a specific service
docker compose build backend
docker compose up -d backend

# Scale a service (if needed)
docker compose up -d --scale backend=3
```

### Check Service Status
```bash
# List running containers
docker compose ps

# View resource usage
docker stats

# Execute command in container
docker compose exec backend sh
docker compose exec backend npm ls
```

## 📁 Project Structure

```
ExamZone/
├── backend/
│   ├── Dockerfile              # Backend container definition
│   ├── .dockerignore          # Files to exclude from image
│   └── ...
├── ai-services/
│   ├── question-generator/
│   │   ├── Dockerfile         # AI Generator container
│   │   ├── .dockerignore
│   │   └── ...
│   └── answer-checker/
│       ├── Dockerfile         # AI Checker container
│       ├── .dockerignore
│       └── ...
├── docker-compose.yml         # Development orchestration
├── docker-compose.prod.yml    # Production configuration
├── .env.docker.example        # Environment template
└── deploy/                    # Azure deployment scripts
```

## 🔧 Environment Configuration

### Development (.env)
```env
NODE_ENV=development
BACKEND_PORT=3000
AI_GENERATOR_PORT=5001
AI_CHECKER_PORT=5002
FRONTEND_URL=http://localhost:5173
```

### Production (docker-compose.prod.yml)
```bash
# Set environment variables
export DOCKER_REGISTRY=examzoneregistry.azurecr.io
export IMAGE_TAG=v1.0.0
export NODE_ENV=production

# Run with production config
docker compose -f docker-compose.prod.yml up
```

## 🐛 Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker compose logs backend
```

**Common issues:**
- Missing environment variables → Check `.env` file
- Port already in use → Change port in `.env` or stop conflicting service
- Build errors → Delete images and rebuild: `docker compose build --no-cache`

### Database Connection Issues

**Error: "MongoServerError: Authentication failed"**
- Verify MongoDB Atlas connection string in `.env`
- Check MongoDB Atlas network access (whitelist 0.0.0.0/0 for testing)
- Ensure database user has read/write permissions

**Test connection:**
```bash
docker compose exec backend node -e "const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => console.log('Connected')).catch(err => console.error(err))"
```

### AI Services Not Working

**Error: "AI service unavailable"**
- Verify `GEMINI_API_KEY` is set in `.env`
- Check AI service health endpoints
- View AI service logs: `docker compose logs ai-question-generator`

### Port Conflicts

**Error: "port is already allocated"**

Change ports in `.env`:
```env
BACKEND_PORT=3001
AI_GENERATOR_PORT=5011
AI_CHECKER_PORT=5012
```

### Out of Memory

**Increase Docker memory:**
- Docker Desktop → Settings → Resources → Memory → Increase to 4GB+

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker compose build backend

# Rebuild all and restart
docker compose up --build
```

## 📊 Monitoring and Health Checks

### Health Endpoints

All services expose `/health` endpoints:

```bash
# Check backend
curl http://localhost:3000/health

# Check AI services
curl http://localhost:5001/health
curl http://localhost:5002/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "examzone-backend",
  "timestamp": "2026-01-28T..."
}
```

### Container Resource Usage

```bash
# Real-time stats
docker stats

# Specific container
docker stats examzone-backend
```

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong secrets** - Minimum 32 characters for JWT_SECRET
3. **Whitelist IPs** - Configure MongoDB Atlas network access
4. **Update base images** - Regularly rebuild with latest Node/Python versions
5. **Scan images** - Use `docker scan` to check for vulnerabilities

```bash
# Scan for vulnerabilities
docker scan examzone-backend
```

## 🚢 Deploying to Production

### Azure Container Apps

See detailed guide: [`deploy/azure-container-setup.md`](deploy/azure-container-setup.md)

**Quick deploy:**
```bash
# Using PowerShell
./deploy/azure-powershell.ps1

# Using Bash/Linux
bash ./deploy/azure-cli-commands.sh
```

### Manual Production Deployment

1. Build production images:
```bash
docker build -t examzone-backend:v1 ./backend
docker build -t examzone-ai-generator:v1 ./ai-services/question-generator
docker build -t examzone-ai-checker:v1 ./ai-services/answer-checker
```

2. Tag for registry:
```bash
docker tag examzone-backend:v1 yourregistry.azurecr.io/examzone-backend:v1
# ... repeat for other services
```

3. Push to registry:
```bash
docker push yourregistry.azurecr.io/examzone-backend:v1
```

4. Deploy using `docker-compose.prod.yml`

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Azure Container Apps](https://docs.microsoft.com/en-us/azure/container-apps/)
- [MongoDB Atlas Docker Setup](https://www.mongodb.com/docs/atlas/getting-started/)

## 🆘 Getting Help

**Common Commands Reference:**
```bash
# View all containers
docker ps -a

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove all unused data
docker system prune -a

# View Docker disk usage
docker system df
```

**Still having issues?**
1. Check logs: `docker compose logs -f`
2. Verify `.env` configuration
3. Ensure MongoDB Atlas is accessible
4. Check Docker Desktop is running
5. Restart Docker daemon

---

**Phase 10 Complete** - ExamZone is now fully containerized and cloud-ready! 🎉
