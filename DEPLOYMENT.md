# ExamZone Backend - Deployment Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Health Monitoring](#health-monitoring)
- [Maintenance Scripts](#maintenance-scripts)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### System Requirements
- **Node.js**: v14.0.0 or higher (v18+ recommended)
- **MongoDB**: v4.4 or higher (v5.0+ recommended for transactions)
- **NPM**: v6.0.0 or higher
- **RAM**: Minimum 2GB (4GB recommended for production)
- **Storage**: Minimum 10GB free space for uploads and PDFs

### External Services
- **MongoDB Database**: Local instance or MongoDB Atlas cluster
- **AI Service**: FastAPI service running on port 8002 (for question generation/checking)

---

## 🔐 Environment Configuration

### 1. Create Environment File
Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Configure Required Variables

#### Database (REQUIRED)
```env
MONGODB_URI=mongodb://localhost:27017/examzone
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/examzone
```

#### Authentication (REQUIRED)
```env
# Generate a secure JWT secret (min 32 chars)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Generate a secure session secret
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

JWT_EXPIRES_IN=7d
```

#### Server Configuration (REQUIRED)
```env
PORT=5000
NODE_ENV=production  # or 'development' for dev mode
```

#### External Services (OPTIONAL)
```env
# AI service for question generation/checking
AI_SERVICE_URL=http://localhost:8002

# Frontend URL for CORS
FRONTEND_URL=https://yourdomain.com

# In production, list all allowed origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

---

## 🚀 Development Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Development Environment
Create `.env` file with development settings:
```env
MONGODB_URI=mongodb://localhost:27017/examzone-dev
JWT_SECRET=dev-secret-key-change-in-production
SESSION_SECRET=dev-session-secret
PORT=5000
NODE_ENV=development
AI_SERVICE_URL=http://localhost:8002
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

### 3. Start Development Server
```bash
# With auto-reload
npm run dev

# Or standard start
npm start
```

### 4. Verify Installation
Check server health:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

---

## 🌐 Production Deployment

### Option 1: Traditional VPS/Server

#### 1. Prepare Production Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
# Follow: https://docs.mongodb.com/manual/installation/

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Deploy Application
```bash
# Clone repository
git clone <your-repo-url>
cd ExamZone/backend

# Install production dependencies
npm ci --production

# Create environment file
nano .env
# (Configure as shown above)

# Create required directories
mkdir -p uploads/exams uploads/assignments uploads/submissions
mkdir -p pdfs answersheets storage/exams

# Set proper permissions
chmod 750 uploads pdfs answersheets storage
```

#### 3. Start with PM2
```bash
# Start application
pm2 start server.js --name examzone-backend

# Save PM2 process list
pm2 save

# Setup auto-start on reboot
pm2 startup

# Monitor logs
pm2 logs examzone-backend
```

#### 4. Configure Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeout for long-running operations
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Increase max upload size
    client_max_body_size 50M;
}
```

### Option 2: Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/examzone
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - mongo
    volumes:
      - ./uploads:/app/uploads
      - ./pdfs:/app/pdfs
      - ./storage:/app/storage
    restart: unless-stopped

  mongo:
    image: mongo:5
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

Start with Docker:
```bash
docker-compose up -d
```

---

## 📊 Health Monitoring

### Health Check Endpoints

#### Basic Health
```bash
curl http://localhost:5000/api/health
```

#### Database Health
```bash
curl http://localhost:5000/api/health/database
```

#### System Statistics (requires authentication)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/health/stats
```

#### Data Integrity Check (requires authentication)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/health/integrity
```

### Monitoring Best Practices
1. **Set up automated health checks** - Use services like UptimeRobot or Pingdom
2. **Monitor disk space** - Uploads and PDFs can grow large
3. **Track database performance** - Monitor MongoDB query times
4. **Set up log aggregation** - Use services like Papertrail or Loggly
5. **Configure alerts** - Get notified of errors and downtime

---

## 🔧 Maintenance Scripts

### Data Integrity Check
Detects orphaned records, duplicates, and inconsistencies:
```bash
# Check only (dry run)
node scripts/checkDataIntegrity.js

# Fix issues automatically
node scripts/checkDataIntegrity.js --fix
```

### Cleanup Orphaned Files
Removes PDFs and uploads with no database references:
```bash
node scripts/cleanupOrphanedFiles.js
```

### Scheduled Maintenance
Add to crontab for automated maintenance:
```cron
# Run integrity check daily at 2 AM
0 2 * * * cd /path/to/backend && node scripts/checkDataIntegrity.js

# Cleanup orphaned files weekly (Sunday 3 AM)
0 3 * * 0 cd /path/to/backend && node scripts/cleanupOrphanedFiles.js
```

---

## 🔒 Security Considerations

### Production Checklist
- [ ] Strong JWT_SECRET (min 32 characters)
- [ ] Strong SESSION_SECRET
- [ ] NODE_ENV=production
- [ ] HTTPS enabled (via reverse proxy)
- [ ] CORS configured with specific origins
- [ ] Rate limiting enabled
- [ ] Security headers enabled (helmet)
- [ ] MongoDB authentication enabled
- [ ] File upload size limits configured
- [ ] Firewall configured (only allow necessary ports)
- [ ] Regular backups configured
- [ ] Log rotation enabled
- [ ] Environment variables secured (not in code)

### MongoDB Security
```javascript
// Enable authentication
mongod --auth

// Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "secure_password",
  roles: ["userAdminAnyDatabase"]
})

// Create app user
use examzone
db.createUser({
  user: "examzone_app",
  pwd: "secure_app_password",
  roles: ["readWrite"]
})
```

Update MONGODB_URI:
```env
MONGODB_URI=mongodb://examzone_app:secure_app_password@localhost:27017/examzone
```

---

## 🐛 Troubleshooting

### Server Won't Start

**Error: Missing required environment variables**
```bash
# Solution: Create .env file with all required variables
cp .env.example .env
# Edit .env and fill in values
```

**Error: Cannot connect to MongoDB**
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Start MongoDB if stopped
sudo systemctl start mongod

# Check connection string in .env
```

### Authentication Errors

**Error: jwt malformed**
```bash
# Ensure JWT_SECRET is set in .env
# Clear browser cookies/localStorage
# Try logging in again
```

### File Upload Issues

**Error: File too large**
```bash
# Check MAX_FILE_SIZE in .env (default 50MB)
# Increase if needed:
MAX_FILE_SIZE=104857600  # 100MB
```

**Error: Invalid file type**
```bash
# Only PDF files are allowed for exams
# Check ALLOWED_MIME_TYPES in .env
```

### Performance Issues

**Slow database queries**
```bash
# Run integrity check to ensure indexes are present
node scripts/checkDataIntegrity.js

# Check MongoDB slow query log
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().limit(5).sort({ ts: -1 }).pretty()
```

**High memory usage**
```bash
# Check PM2 status
pm2 status

# Restart application
pm2 restart examzone-backend

# Monitor memory
pm2 monit
```

### Data Consistency Issues

**Orphaned records or duplicates**
```bash
# Run integrity check and fix
node scripts/checkDataIntegrity.js --fix
```

### Viewing Logs

**PM2 logs**
```bash
# View all logs
pm2 logs

# View only errors
pm2 logs --err

# View specific app
pm2 logs examzone-backend
```

**Application logs**
```bash
# Error log
tail -f logs/error.log

# Combined log
tail -f logs/combined.log
```

---

## 📝 API Documentation

### Base URL
- Development: `http://localhost:5000`
- Production: `https://api.yourdomain.com`

### Authentication
All protected endpoints require JWT token:
```bash
Authorization: Bearer YOUR_JWT_TOKEN
```

### Rate Limits
- **Auth endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per 15 minutes
- **Upload endpoints**: 20 requests per hour

---

## 🆘 Support

For issues or questions:
1. Check this deployment guide
2. Review application logs
3. Check health endpoints
4. Run integrity check script
5. Review error logs in `logs/error.log`

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
