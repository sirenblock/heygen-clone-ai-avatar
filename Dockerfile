# AI Avatar Platform - Dockerfile
# Multi-stage build with CUDA support

FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04 AS base

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV CUDA_HOME=/usr/local/cuda

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    git \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p /app/data/models \
    /app/data/avatars \
    /app/data/temp \
    /app/data/output \
    /app/logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run application
CMD ["python3", "main.py"]


# Development stage
FROM base AS development

# Install development dependencies
RUN pip3 install --no-cache-dir \
    pytest \
    pytest-asyncio \
    pytest-cov \
    black \
    flake8 \
    ipython

# Enable reload for development
ENV API_RELOAD=true

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]


# Production stage
FROM base AS production

# Run as non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

USER appuser

# Production settings
ENV ENVIRONMENT=production
ENV API_RELOAD=false

CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
