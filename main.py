"""
AI Avatar Platform - FastAPI Main Application
Complete REST API for video generation
"""

import os
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path
import uvicorn
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import tempfile

from config import settings
from core.video_generator import get_generator, JobStatus
from core.avatar_trainer import get_trainer
from core.voice_synthesis import get_synthesizer

# Setup logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format=settings.LOG_FORMAT
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="AI Avatar Platform",
    description="HeyGen-like platform for AI avatar video generation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
generator = get_generator()
trainer = get_trainer()
synthesizer = get_synthesizer()


# Pydantic models for request/response
class GenerateVideoRequest(BaseModel):
    """Request model for video generation"""
    script: str = Field(..., description="Text script to convert to speech")
    avatar_id: str = Field(..., description="ID of the avatar to use")
    voice_id: Optional[str] = Field(None, description="ElevenLabs voice ID")
    video_settings: Optional[Dict[str, Any]] = Field(default_factory=dict)


class GenerateVideoResponse(BaseModel):
    """Response model for video generation"""
    job_id: str
    status: str
    message: str


class JobStatusResponse(BaseModel):
    """Response model for job status"""
    job_id: str
    status: str
    progress: int
    created_at: str
    updated_at: str
    video_path: Optional[str] = None
    error: Optional[str] = None


class AvatarResponse(BaseModel):
    """Response model for avatar"""
    avatar_id: str
    name: str
    created_at: str
    frame_count: int


class VoiceResponse(BaseModel):
    """Response model for voice"""
    voice_id: str
    name: str
    category: Optional[str] = None


# API Endpoints

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "AI Avatar Platform",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "gpu_available": settings.USE_GPU and torch.cuda.is_available() if 'torch' in dir() else False
    }


@app.post("/api/v1/generate", response_model=GenerateVideoResponse)
async def generate_video(request: GenerateVideoRequest):
    """
    Generate a lip-synced avatar video

    This endpoint creates a video generation job that will process asynchronously.
    Use the returned job_id to check status.
    """
    try:
        logger.info(f"Generating video for avatar {request.avatar_id}")

        # Create job
        job = generator.generate_video(
            script=request.script,
            avatar_id=request.avatar_id,
            voice_id=request.voice_id,
            video_settings=request.video_settings
        )

        return GenerateVideoResponse(
            job_id=job["job_id"],
            status=job["status"],
            message="Video generation started"
        )

    except Exception as e:
        logger.error(f"Error generating video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/status/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str):
    """Get status of a video generation job"""
    try:
        job = generator.get_job_status(job_id)

        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        return JobStatusResponse(
            job_id=job["job_id"],
            status=job["status"],
            progress=job["progress"],
            created_at=job["created_at"],
            updated_at=job["updated_at"],
            video_path=job.get("video_path"),
            error=job.get("error")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/jobs")
async def list_jobs(status: Optional[str] = None, limit: int = 100):
    """List all jobs"""
    try:
        job_status = JobStatus(status) if status else None
        jobs = generator.list_jobs(status=job_status, limit=limit)

        return {
            "jobs": jobs,
            "count": len(jobs)
        }

    except Exception as e:
        logger.error(f"Error listing jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/v1/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job"""
    try:
        generator.delete_job(job_id)
        return {"message": "Job deleted successfully"}

    except Exception as e:
        logger.error(f"Error deleting job: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/video/{job_id}")
async def download_video(job_id: str):
    """Download generated video"""
    try:
        job = generator.get_job_status(job_id)

        if not job:
            raise HTTPException(status_code=404, detail="Job not found")

        if job["status"] != JobStatus.COMPLETED.value:
            raise HTTPException(status_code=400, detail="Video not ready yet")

        video_path = job.get("video_path")
        if not video_path or not os.path.exists(video_path):
            raise HTTPException(status_code=404, detail="Video file not found")

        return FileResponse(
            video_path,
            media_type="video/mp4",
            filename=f"{job_id}.mp4"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/avatars/train", response_model=AvatarResponse)
async def train_avatar(
    name: str = Form(...),
    video: UploadFile = File(...),
    metadata: Optional[str] = Form(None)
):
    """
    Train a new avatar from video

    Upload a video of a person's face to create a new avatar.
    The video should have good lighting and the person should face the camera.
    """
    try:
        logger.info(f"Training avatar '{name}'")

        # Save uploaded video
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            content = await video.read()
            tmp.write(content)
            tmp_path = tmp.name

        # Parse metadata
        import json
        metadata_dict = json.loads(metadata) if metadata else {}

        # Train avatar
        avatar_id = trainer.generate_avatar_id(name)
        avatar = trainer.train_avatar(
            video_path=tmp_path,
            avatar_id=avatar_id,
            name=name,
            metadata=metadata_dict
        )

        # Clean up temp file
        os.unlink(tmp_path)

        return AvatarResponse(
            avatar_id=avatar["avatar_id"],
            name=avatar["name"],
            created_at=avatar["created_at"],
            frame_count=avatar["frame_count"]
        )

    except Exception as e:
        logger.error(f"Error training avatar: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/avatars", response_model=List[AvatarResponse])
async def list_avatars():
    """List all available avatars"""
    try:
        avatars = trainer.list_avatars()

        return [
            AvatarResponse(
                avatar_id=a["avatar_id"],
                name=a["name"],
                created_at=a["created_at"],
                frame_count=a["frame_count"]
            )
            for a in avatars
        ]

    except Exception as e:
        logger.error(f"Error listing avatars: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/avatars/{avatar_id}")
async def get_avatar(avatar_id: str):
    """Get avatar details"""
    try:
        avatar = trainer.load_avatar(avatar_id)
        return avatar

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Avatar not found")
    except Exception as e:
        logger.error(f"Error getting avatar: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/v1/avatars/{avatar_id}")
async def delete_avatar(avatar_id: str):
    """Delete an avatar"""
    try:
        trainer.delete_avatar(avatar_id)
        return {"message": "Avatar deleted successfully"}

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Avatar not found")
    except Exception as e:
        logger.error(f"Error deleting avatar: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/voices", response_model=List[VoiceResponse])
async def list_voices():
    """List all available voices from ElevenLabs"""
    try:
        voices = synthesizer.get_available_voices()

        return [
            VoiceResponse(
                voice_id=v["voice_id"],
                name=v["name"],
                category=v.get("category")
            )
            for v in voices
        ]

    except Exception as e:
        logger.error(f"Error listing voices: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/voices/clone")
async def clone_voice(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    audio_files: List[UploadFile] = File(...)
):
    """
    Clone a voice from audio samples

    Upload 2-5 audio files of the same person speaking to clone their voice.
    Each audio should be at least 1 minute long.
    """
    try:
        logger.info(f"Cloning voice '{name}'")

        # Save uploaded audio files
        temp_paths = []
        for audio in audio_files:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as tmp:
                content = await audio.read()
                tmp.write(content)
                temp_paths.append(tmp.name)

        # Clone voice
        voice_id = synthesizer.clone_voice(
            name=name,
            audio_files=temp_paths,
            description=description
        )

        # Clean up temp files
        for path in temp_paths:
            os.unlink(path)

        return {
            "voice_id": voice_id,
            "name": name,
            "message": "Voice cloned successfully"
        }

    except Exception as e:
        logger.error(f"Error cloning voice: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/tts")
async def text_to_speech(
    text: str = Form(...),
    voice_id: Optional[str] = Form(None)
):
    """
    Convert text to speech

    Generate audio from text using ElevenLabs.
    """
    try:
        # Generate audio
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            output_path = tmp.name

        audio_path = synthesizer.text_to_speech(
            text=text,
            output_path=output_path,
            voice_id=voice_id
        )

        return FileResponse(
            audio_path,
            media_type="audio/wav",
            filename="speech.wav"
        )

    except Exception as e:
        logger.error(f"Error generating speech: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/batch")
async def batch_generate(jobs: List[GenerateVideoRequest]):
    """
    Generate multiple videos in batch

    Submit multiple video generation jobs at once.
    """
    try:
        job_specs = [
            {
                "script": job.script,
                "avatar_id": job.avatar_id,
                "voice_id": job.voice_id,
                "video_settings": job.video_settings
            }
            for job in jobs
        ]

        created_jobs = generator.batch_generate(job_specs)

        return {
            "jobs": created_jobs,
            "count": len(created_jobs),
            "message": f"{len(created_jobs)} jobs created"
        }

    except Exception as e:
        logger.error(f"Error creating batch jobs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"error": "Not found"}
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"}
    )


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    logger.info("Starting AI Avatar Platform...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"GPU enabled: {settings.USE_GPU}")

    # Pre-load models if configured
    if settings.USE_GPU:
        logger.info("Pre-loading models...")
        try:
            from core.lip_sync_engine import get_engine
            engine = get_engine()
            engine.load_model()
            logger.info("Models loaded successfully")
        except Exception as e:
            logger.warning(f"Could not pre-load models: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    logger.info("Shutting down AI Avatar Platform...")


# Main entry point
if __name__ == "__main__":
    import torch  # Import here to check GPU

    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        workers=settings.API_WORKERS,
        reload=settings.API_RELOAD
    )
