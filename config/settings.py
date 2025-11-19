"""
AI Avatar Platform - Configuration Settings
Centralized configuration for all components
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = DATA_DIR / "models"
AVATARS_DIR = DATA_DIR / "avatars"
TEMP_DIR = DATA_DIR / "temp"
OUTPUT_DIR = DATA_DIR / "output"

# Create directories
for dir_path in [DATA_DIR, MODELS_DIR, AVATARS_DIR, TEMP_DIR, OUTPUT_DIR]:
    dir_path.mkdir(parents=True, exist_ok=True)

# API Configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
HUGGINGFACE_TOKEN = os.getenv("HUGGINGFACE_TOKEN", "")

# Model Configuration
WAV2LIP_MODEL_PATH = MODELS_DIR / "wav2lip_gan.pth"
WAV2LIP_MODEL_URL = "https://huggingface.co/spaces/fffiloni/Wav2Lip-HD/resolve/main/checkpoints/wav2lip_gan.pth"
WAV2LIP_MODEL_NAME = "numz/wav2lip_288x288"

# Face Detection Configuration
FACE_DETECTOR = "mediapipe"  # Options: mediapipe, dlib, retinaface
FACE_DETECTION_CONFIDENCE = 0.5
MIN_FACE_SIZE = 96

# Video Processing Configuration
VIDEO_QUALITY = "high"  # Options: low, medium, high, ultra
VIDEO_FPS = 25
VIDEO_RESOLUTION = (1280, 720)  # (width, height)
VIDEO_CODEC = "libx264"
VIDEO_BITRATE = "5000k"

# Audio Processing Configuration
AUDIO_SAMPLE_RATE = 16000
AUDIO_FORMAT = "wav"
MEL_STEP_SIZE = 16

# Lip Sync Configuration
LIP_SYNC_MODEL = "Wav2Lip"  # Options: Wav2Lip, SadTalker
BATCH_SIZE = 128
FACE_DETECT_BATCH = 8
WAV2LIP_RESIZE_FACTOR = 1

# Voice Synthesis Configuration
DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # ElevenLabs default voice
VOICE_STABILITY = 0.5
VOICE_SIMILARITY_BOOST = 0.75
VOICE_MODEL = "eleven_monolingual_v1"

# GPU Configuration
USE_GPU = True
GPU_DEVICE = 0
ALLOW_CPU_FALLBACK = True

# Processing Configuration
MAX_WORKERS = 4
QUEUE_MAX_SIZE = 100
JOB_TIMEOUT = 3600  # seconds

# API Configuration
API_HOST = "0.0.0.0"
API_PORT = 8000
API_WORKERS = 4
API_RELOAD = False
MAX_UPLOAD_SIZE = 500 * 1024 * 1024  # 500MB

# Security Configuration
API_KEY_HEADER = "X-API-Key"
ENABLE_API_KEY_AUTH = False
ALLOWED_ORIGINS = ["*"]

# Logging Configuration
LOG_LEVEL = "INFO"
LOG_FILE = BASE_DIR / "logs" / "app.log"
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# Cache Configuration
ENABLE_CACHE = True
CACHE_TTL = 3600  # seconds
CACHE_MAX_SIZE = 1000

# Cleanup Configuration
AUTO_CLEANUP_TEMP = True
TEMP_FILE_MAX_AGE = 3600  # seconds
MAX_STORED_VIDEOS = 100

# Performance Configuration
ENABLE_FACE_ENHANCEMENT = False
ENABLE_SUPER_RESOLUTION = False
ENABLE_BACKGROUND_BLUR = False

# Advanced Settings
FACE_DETECTION_PARAMS = {
    "min_detection_confidence": FACE_DETECTION_CONFIDENCE,
    "model_selection": 1,  # 0: short-range, 1: full-range
}

MEL_SPECTROGRAM_PARAMS = {
    "n_mels": 80,
    "hop_length": 640,
    "win_length": 1600,
    "n_fft": 2048,
    "fmin": 55,
    "fmax": 7600,
}

AVATAR_TRAINING_PARAMS = {
    "min_frames": 50,
    "max_frames": 300,
    "quality_threshold": 0.7,
    "face_size_min": 128,
}

# Cost Configuration (for tracking/billing)
COST_PER_VIDEO = 0.15
COST_PER_AVATAR_TRAINING = 5.00
COST_PER_VOICE_CLONE = 10.00
COST_PER_API_CALL = 0.01

# Rate Limiting
RATE_LIMIT_PER_MINUTE = 60
RATE_LIMIT_PER_HOUR = 1000
RATE_LIMIT_PER_DAY = 10000

# Feature Flags
ENABLE_VOICE_CLONING = True
ENABLE_AVATAR_TRAINING = True
ENABLE_MULTI_LANGUAGE = True
ENABLE_BACKGROUND_REPLACEMENT = False
ENABLE_FACE_ENHANCEMENT = False

# Deployment Configuration
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")  # development, staging, production
DEBUG = ENVIRONMENT == "development"

# Database Configuration (for future use)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/app.db")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Monitoring Configuration
SENTRY_DSN = os.getenv("SENTRY_DSN", "")
ENABLE_METRICS = True
METRICS_PORT = 9090

def validate_config():
    """Validate critical configuration settings"""
    errors = []

    if not ELEVENLABS_API_KEY:
        errors.append("ELEVENLABS_API_KEY is not set")

    if USE_GPU:
        try:
            import torch
            if not torch.cuda.is_available():
                if not ALLOW_CPU_FALLBACK:
                    errors.append("GPU enabled but CUDA is not available")
        except ImportError:
            errors.append("PyTorch is not installed")

    if errors:
        raise ValueError(f"Configuration errors: {', '.join(errors)}")

    return True

# Validate on import
if __name__ != "__main__":
    validate_config()
