# Quick Start Guide - AI Avatar Platform

Get your AI avatar platform running in 5 minutes!

## Prerequisites

- Python 3.8 or higher
- FFmpeg installed
- ElevenLabs API key (free trial available)
- 8GB RAM minimum (16GB recommended)
- GPU with CUDA support (optional but recommended)

## 5-Minute Setup

### Step 1: Install Dependencies (2 minutes)

```bash
# Clone repository
git clone <repository-url>
cd heygen-clone

# Install Python packages
pip install -r requirements.txt

# Verify FFmpeg is installed
ffmpeg -version
```

If FFmpeg is not installed:
- **macOS**: `brew install ffmpeg`
- **Ubuntu**: `sudo apt-get install ffmpeg`
- **Windows**: Download from https://ffmpeg.org/download.html

### Step 2: Configure API Key (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API key
nano .env
```

Add your ElevenLabs API key:
```
ELEVENLABS_API_KEY=your_api_key_here
```

Get your API key from: https://elevenlabs.io/

### Step 3: Test Installation (1 minute)

```bash
python test_installation.py
```

You should see all tests passing. If any fail, check the error messages.

### Step 4: Start the Server (1 minute)

```bash
python main.py
```

The server will start at: `http://localhost:8000`

Open your browser and visit: `http://localhost:8000/docs`

## Your First Video (3 steps)

### Option A: Using Python SDK

```python
# 1. Train an avatar (one-time setup)
from core.avatar_trainer import train_avatar

avatar = train_avatar(
    video_path="path/to/your/video.mp4",
    name="My First Avatar"
)
avatar_id = avatar['avatar_id']

# 2. Generate a video
from core.video_generator import generate_video

job = generate_video(
    script="Hello! This is my first AI avatar video.",
    avatar_id=avatar_id
)

# 3. Wait for completion and get video
from core.video_generator import get_job_status
import time

while True:
    status = get_job_status(job['job_id'])
    if status['status'] == 'completed':
        print(f"Video ready: {status['video_path']}")
        break
    time.sleep(5)
```

### Option B: Using REST API

```bash
# 1. Start the server (if not already running)
python main.py

# 2. Train an avatar
curl -X POST http://localhost:8000/api/v1/avatars/train \
  -F "name=My Avatar" \
  -F "video=@path/to/video.mp4"

# Note the avatar_id from response

# 3. Generate a video
curl -X POST http://localhost:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "script": "Hello! This is my first video.",
    "avatar_id": "YOUR_AVATAR_ID"
  }'

# Note the job_id from response

# 4. Check status
curl http://localhost:8000/api/v1/status/YOUR_JOB_ID

# 5. Download video when ready
curl -O http://localhost:8000/api/v1/video/YOUR_JOB_ID
```

## Docker Quick Start (2 minutes)

If you prefer Docker:

```bash
# 1. Build and start
docker-compose up -d

# 2. Check logs
docker-compose logs -f api

# 3. Access API
# http://localhost:8000/docs
```

## Common Use Cases

### 1. Generate Video with Custom Voice

```python
from core.video_generator import generate_video

job = generate_video(
    script="Your script here",
    avatar_id="your_avatar_id",
    voice_id="your_voice_id"  # From ElevenLabs
)
```

### 2. Clone Your Own Voice

```python
from core.voice_synthesis import clone_voice

voice_id = clone_voice(
    name="My Voice",
    audio_files=[
        "recording1.mp3",
        "recording2.mp3",
        "recording3.mp3"
    ]
)

# Use this voice_id in video generation
```

### 3. Batch Generate Multiple Videos

```python
from core.video_generator import get_generator

generator = get_generator()

scripts = [
    "Video 1 script",
    "Video 2 script",
    "Video 3 script"
]

jobs = []
for script in scripts:
    job = generator.generate_video(
        script=script,
        avatar_id="avatar_id"
    )
    jobs.append(job)
```

### 4. List Available Resources

```python
from core.avatar_trainer import list_avatars
from core.voice_synthesis import get_voices

# List avatars
avatars = list_avatars()
for avatar in avatars:
    print(f"{avatar['name']}: {avatar['avatar_id']}")

# List voices
voices = get_voices()
for voice in voices:
    print(f"{voice['name']}: {voice['voice_id']}")
```

## Performance Tips

### For Faster Generation:

1. **Use GPU** (10-20x faster):
```python
# In config/settings.py or .env
USE_GPU = True
GPU_DEVICE = 0
```

2. **Increase Batch Size**:
```python
BATCH_SIZE = 256  # If you have enough VRAM
```

3. **Enable Caching**:
```python
ENABLE_CACHE = True
```

### For Better Quality:

1. **Higher Video Quality**:
```python
VIDEO_QUALITY = "ultra"
VIDEO_RESOLUTION = (1920, 1080)
```

2. **Better Training Video**:
- Good lighting
- Clear face shots
- 30+ seconds of footage
- Front-facing
- Minimal movement

## Quick Troubleshooting

### Issue: "Port 8000 already in use"

```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9

# Or use different port
python main.py --port 8001
```

### Issue: "GPU not detected"

```bash
# Check CUDA installation
python -c "import torch; print(torch.cuda.is_available())"

# If False, install CUDA:
# https://developer.nvidia.com/cuda-downloads
```

### Issue: "ElevenLabs API error"

- Verify API key is correct in .env
- Check you have credits: https://elevenlabs.io/
- Try free voices first

### Issue: "Model download fails"

```bash
# Manually download model
mkdir -p data/models
cd data/models
wget https://huggingface.co/spaces/fffiloni/Wav2Lip-HD/resolve/main/checkpoints/wav2lip_gan.pth
```

### Issue: "Face not detected in training"

- Ensure video has clear face shots
- Check lighting is good
- Face should be front-facing
- Try a different video

## Next Steps

1. **Explore Examples**: Run `python examples.py`
2. **Read Full Docs**: See `README.md`
3. **API Documentation**: Visit `http://localhost:8000/docs`
4. **Customize Settings**: Edit `config/settings.py`
5. **Deploy to Production**: See deployment section in README.md

## Getting Help

- Check `README.md` for detailed documentation
- Run `python test_installation.py` to diagnose issues
- See `examples.py` for code examples
- Visit API docs at `/docs` for endpoint reference

## Pro Tips

1. **Save your avatar_id and voice_id** - you'll need them for generation
2. **Start with short scripts** - test with 1-2 sentences first
3. **Use the API docs** - interactive testing at `/docs`
4. **Monitor progress** - check job status regularly
5. **Clean temp files** - auto-cleanup is enabled by default

## Video Requirements

### Training Video (for Avatar)
- **Duration**: 10-60 seconds
- **Quality**: 720p or higher
- **Format**: MP4, MOV, AVI
- **Content**: Clear face shots, good lighting
- **Face**: Front-facing, minimal movement

### Audio Samples (for Voice Cloning)
- **Duration**: 1+ minutes per file
- **Count**: 2-5 files recommended
- **Quality**: Clear speech, no background noise
- **Format**: MP3, WAV, M4A
- **Content**: Natural speaking, varied sentences

## Quick Commands Reference

```bash
# Start server
python main.py

# Test installation
python test_installation.py

# Run examples
python examples.py

# Docker start
docker-compose up -d

# Docker logs
docker-compose logs -f

# Docker stop
docker-compose down

# Run tests
pytest
```

## API Quick Reference

```bash
# Generate video
POST /api/v1/generate

# Check status
GET /api/v1/status/{job_id}

# Download video
GET /api/v1/video/{job_id}

# List avatars
GET /api/v1/avatars

# Train avatar
POST /api/v1/avatars/train

# List voices
GET /api/v1/voices

# Clone voice
POST /api/v1/voices/clone
```

## Resources

- Full Documentation: `README.md`
- Technical Architecture: (see PDF documentation)
- Code Examples: `examples.py`
- API Docs: `http://localhost:8000/docs`
- Configuration: `config/settings.py`

---

**Ready to create amazing AI avatar videos!**

For questions or issues, check the troubleshooting section or full documentation.
