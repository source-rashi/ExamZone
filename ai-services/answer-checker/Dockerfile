# Production Dockerfile for ExamZone AI Answer Checker
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (including Tesseract OCR and Poppler for pdf2image)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p static/uploads templates

# Expose the application port
EXPOSE 5002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5002/health').read()"

# Run with uvicorn binding to all interfaces for container networking
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5002"]
