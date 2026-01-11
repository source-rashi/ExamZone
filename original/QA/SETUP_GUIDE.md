# FastAPI AI Service Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd original/QA
pip install -r requirements.txt
```

### 2. Set Environment Variables

**Windows (PowerShell)**:
```powershell
$env:GOOGLE_API_KEY="your-gemini-api-key-here"
$env:OUTPUT_DIR="./static/exam_papers"
```

**Linux/Mac**:
```bash
export GOOGLE_API_KEY="your-gemini-api-key-here"
export OUTPUT_DIR="./static/exam_papers"
```

### 3. Start FastAPI Server

```bash
python main.py
```

Server will start at: `http://127.0.0.1:8000`

### 4. Verify Service

Open in browser: `http://127.0.0.1:8000/docs`

You should see:
- FastAPI automatic documentation (Swagger UI)
- List of available endpoints including `/api/generate-papers`

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_API_KEY` | ✅ Yes | - | Gemini API key from Google AI Studio |
| `OUTPUT_DIR` | ❌ No | `static/exam_papers` | Directory for generated PDFs |

---

## Get Gemini API Key

1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key
5. Set as environment variable

---

## Troubleshooting

### "GOOGLE_API_KEY not set"
- Set environment variable before starting
- Verify: `echo $env:GOOGLE_API_KEY` (Windows) or `echo $GOOGLE_API_KEY` (Linux/Mac)

### "Module not found"
- Run: `pip install -r requirements.txt`
- Ensure you're in `original/QA` directory

### "Port 8000 already in use"
- Stop other services on port 8000
- Or change port: `uvicorn main:app --host 127.0.0.1 --port 8001`
- Update `FASTAPI_AI_URL` in backend `.env` accordingly

### "No models available"
- Check API key is valid
- Verify internet connection
- Try regenerating API key

---

## Testing the Service

### Test New Endpoint

```bash
curl -X POST http://127.0.0.1:8000/api/generate-papers \
  -H "Content-Type: application/json" \
  -d '{
    "exam_id": "test123",
    "class_id": "class456",
    "student_count": 2,
    "questions_per_bank": 5,
    "sets_per_student": 1,
    "custom_title": "Test Exam",
    "course_name": "Testing",
    "section": "A",
    "total_marks": 50,
    "student_details": [
      {"name": "Student 1", "reg_no": "REG001", "student_id": "s1"},
      {"name": "Student 2", "reg_no": "REG002", "student_id": "s2"}
    ]
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Generated 2 question papers",
  "papers": [...]
}
```

---

## Production Deployment

### Using systemd (Linux)

Create `/etc/systemd/system/examzone-ai.service`:

```ini
[Unit]
Description=ExamZone AI Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/ExamZone/original/QA
Environment="GOOGLE_API_KEY=your-key-here"
Environment="OUTPUT_DIR=/var/www/exam_papers"
ExecStart=/usr/bin/python3 main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Start service:
```bash
sudo systemctl daemon-reload
sudo systemctl start examzone-ai
sudo systemctl enable examzone-ai
sudo systemctl status examzone-ai
```

### Using Docker (Optional)

Create `Dockerfile` in `original/QA`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV GOOGLE_API_KEY=""
ENV OUTPUT_DIR="/app/static/exam_papers"

EXPOSE 8000

CMD ["python", "main.py"]
```

Build and run:
```bash
docker build -t examzone-ai .
docker run -d -p 8000:8000 \
  -e GOOGLE_API_KEY="your-key" \
  -v /path/to/papers:/app/static/exam_papers \
  examzone-ai
```

---

## Logs and Monitoring

### View Logs
```bash
# If running directly
# Check console output

# If using systemd
sudo journalctl -u examzone-ai -f

# If using Docker
docker logs -f <container-id>
```

### Health Check
```bash
curl http://127.0.0.1:8000/
```

Should return HTML response (FastAPI UI).

---

## Security Notes

⚠️ **IMPORTANT**:
1. Never commit API keys to git
2. Use environment variables in production
3. Restrict FastAPI to localhost in dev (`--host 127.0.0.1`)
4. Use reverse proxy (nginx) for production
5. Enable HTTPS for production deployments
6. Set appropriate file permissions for output directories

---

## Performance Tuning

### Increase Workers (Production)

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Adjust Timeouts

In Node.js bridge service (`aiExam.service.js`):
```javascript
timeout: 300000, // 5 minutes (adjust based on question count)
```

---

## Support

For issues:
1. Check logs for errors
2. Verify API key is valid
3. Test `/docs` endpoint accessibility
4. Ensure Python packages are installed
5. Check file system permissions for OUTPUT_DIR

---

**Setup Complete!** ✅  
FastAPI AI Service ready for integration with ExamZone backend.
