# Installation & Setup Guide

## System Requirements

### Minimum Requirements
- **OS**: Linux, macOS, or Windows (with WSL2)
- **Python**: 3.8 or higher
- **RAM**: 8GB
- **Storage**: 10GB free space
- **Internet**: For model downloads and API calls

### Recommended Requirements
- **OS**: Ubuntu 20.04+ or macOS 12+
- **Python**: 3.10+
- **RAM**: 16GB
- **GPU**: NVIDIA GPU with 8GB+ VRAM (RTX 3060 or better)
- **CUDA**: 11.8 or higher
- **Storage**: 50GB SSD

## Pre-Installation

### 1. Install Python 3.8+

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip
```

**macOS:**
```bash
brew install python@3.10
```

**Windows:**
Download from https://www.python.org/downloads/

### 2. Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html

### 3. Install CUDA (Optional - for GPU)

**Ubuntu:**
```bash
wget https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda_11.8.0_520.61.05_linux.run
sudo sh cuda_11.8.0_520.61.05_linux.run
```

**Verify CUDA:**
```bash
nvidia-smi
nvcc --version
```

## Installation Methods

### Method 1: Automated Setup (Recommended)

```bash
# 1. Clone repository
git clone <repository-url>
cd heygen-clone

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# 3. Configure API key
nano .env
# Add: ELEVENLABS_API_KEY=your_key_here

# 4. Test installation
python test_installation.py

# 5. Start server
python main.py
```

### Method 2: Manual Installation

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Upgrade pip
pip install --upgrade pip

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create directories
mkdir -p data/models data/avatars data/temp data/output logs

# 5. Setup environment
cp .env.example .env
nano .env  # Add your API keys

# 6. Test installation
python test_installation.py

# 7. Start server
python main.py
```

### Method 3: Docker Installation

```bash
# 1. Install Docker and Docker Compose
# See: https://docs.docker.com/get-docker/

# 2. Clone repository
git clone <repository-url>
cd heygen-clone

# 3. Configure environment
cp .env.example .env
nano .env  # Add your API keys

# 4. Build and start
docker-compose up -d

# 5. Check logs
docker-compose logs -f api

# 6. Access API
# http://localhost:8000/docs
```

## Configuration

### ElevenLabs API Key

1. Sign up at https://elevenlabs.io/
2. Go to Profile → API Keys
3. Create new API key
4. Add to `.env` file:
   ```
   ELEVENLABS_API_KEY=your_api_key_here
   ```

### HuggingFace Token (Optional)

1. Sign up at https://huggingface.co/
2. Go to Settings → Access Tokens
3. Create new token
4. Add to `.env` file:
   ```
   HUGGINGFACE_TOKEN=your_token_here
   ```

### GPU Configuration

Edit `config/settings.py` or `.env`:

```python
USE_GPU=true
GPU_DEVICE=0  # GPU index if multiple GPUs
```

## Verification

### 1. Test Installation

```bash
python test_installation.py
```

Expected output:
```
✓ Python 3.10.x installed
✓ All core packages installed
✓ GPU available (if configured)
✓ Directories exist
✓ Models can be loaded
✓ Face detection working
✓ Audio processing working
✓ Video processing working
✓ FastAPI working
✓ FFmpeg installed

Results: 11/11 tests passed
```

### 2. Start Server

```bash
python main.py
```

Expected output:
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 3. Check API

Open browser: http://localhost:8000/docs

You should see interactive API documentation.

### 4. Health Check

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "gpu_available": true
}
```

## First Video Generation

### 1. Train an Avatar

```python
from core.avatar_trainer import train_avatar

avatar = train_avatar(
    video_path="path/to/your/video.mp4",
    name="My First Avatar"
)

print(f"Avatar ID: {avatar['avatar_id']}")
# Save this avatar_id for later use
```

### 2. Generate a Video

```python
from core.video_generator import generate_video

job = generate_video(
    script="Hello! This is my first AI avatar video.",
    avatar_id="YOUR_AVATAR_ID"  # From step 1
)

print(f"Job ID: {job['job_id']}")
```

### 3. Check Progress

```python
from core.video_generator import get_job_status
import time

while True:
    status = get_job_status(job['job_id'])
    print(f"Progress: {status['progress']}% - {status['status']}")
    
    if status['status'] == 'completed':
        print(f"Video ready: {status['video_path']}")
        break
    
    time.sleep(5)
```

## Troubleshooting

### Common Issues

**Issue: "No module named 'torch'"**
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Issue: "CUDA not available"**
```bash
# Check CUDA installation
nvidia-smi
nvcc --version

# Reinstall PyTorch with CUDA
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Issue: "FFmpeg not found"**
```bash
# Ubuntu
sudo apt install ffmpeg

# macOS
brew install ffmpeg

# Verify
ffmpeg -version
```

**Issue: "Port 8000 already in use"**
```bash
# Find process
lsof -ti:8000

# Kill process
lsof -ti:8000 | xargs kill -9

# Or use different port
python main.py --port 8001
```

**Issue: "API key error"**
- Verify API key is correct in `.env`
- Check for extra spaces or quotes
- Ensure `.env` file is in project root
- Restart server after changing `.env`

### Getting Help

1. Check logs: `tail -f logs/app.log`
2. Run diagnostics: `python test_installation.py`
3. Check API docs: http://localhost:8000/docs
4. See examples: `python examples.py`
5. Read troubleshooting in README.md

## Next Steps

1. **Read Documentation**
   - README.md - Complete guide
   - QUICKSTART.md - Quick start tutorial
   - PROJECT_SUMMARY.md - Project overview

2. **Run Examples**
   ```bash
   python examples.py
   ```

3. **Explore API**
   - Visit http://localhost:8000/docs
   - Try interactive endpoints
   - Test with sample data

4. **Train Your Avatar**
   - Prepare training video (10-60 seconds)
   - Good lighting, clear face
   - Use avatar training endpoint

5. **Generate Videos**
   - Write scripts
   - Select avatars and voices
   - Monitor job progress

## Updating

### Update Code
```bash
git pull origin main
pip install -r requirements.txt --upgrade
```

### Update Models
Models are downloaded automatically on first use.
To force re-download:
```bash
rm -rf data/models/*
python main.py  # Will re-download
```

## Uninstallation

### Remove Virtual Environment
```bash
deactivate
rm -rf venv/
```

### Remove Data
```bash
rm -rf data/ logs/
```

### Docker Cleanup
```bash
docker-compose down -v
docker rmi avatar-platform
```

## Production Deployment

See README.md deployment section for:
- Cloud deployment (AWS, GCP, Azure)
- Load balancing
- Auto-scaling
- Monitoring
- Security hardening

---

**Installation complete! Ready to generate AI avatar videos.**
