"""
Video Generator Module
Main orchestration pipeline for avatar video generation
"""

import os
import logging
import uuid
import json
from typing import Optional, Dict, Any, List
from pathlib import Path
from datetime import datetime
from enum import Enum
import threading
from queue import Queue

from config import settings

logger = logging.getLogger(__name__)


class JobStatus(Enum):
    """Job status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class VideoGenerator:
    """Main orchestration class for video generation"""

    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}
        self.job_queue: Queue = Queue(maxsize=settings.QUEUE_MAX_SIZE)
        self._init_components()

    def _init_components(self):
        """Initialize all components"""
        try:
            from core.voice_synthesis import get_synthesizer
            from core.lip_sync_engine import get_engine
            from core.avatar_trainer import get_trainer

            self.synthesizer = get_synthesizer()
            self.lip_sync_engine = get_engine()
            self.avatar_trainer = get_trainer()

            logger.info("Video generator components initialized")

        except Exception as e:
            logger.error(f"Error initializing components: {e}")
            raise

    def generate_video(
        self,
        script: str,
        avatar_id: str,
        output_path: Optional[str] = None,
        voice_id: Optional[str] = None,
        video_settings: Optional[Dict[str, Any]] = None,
        job_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a lip-synced avatar video from script

        Args:
            script: Text script to convert to speech
            avatar_id: ID of the avatar to use
            output_path: Path to save output video
            voice_id: ElevenLabs voice ID (uses default if not provided)
            video_settings: Additional video settings
            job_id: Optional job ID (generates new if not provided)

        Returns:
            Job information dictionary
        """
        try:
            # Generate job ID
            job_id = job_id or self._generate_job_id()

            # Create job
            job = {
                "job_id": job_id,
                "status": JobStatus.PENDING.value,
                "script": script,
                "avatar_id": avatar_id,
                "voice_id": voice_id,
                "output_path": output_path,
                "video_settings": video_settings or {},
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "progress": 0,
                "error": None,
            }

            self.jobs[job_id] = job

            # Start processing in background
            thread = threading.Thread(
                target=self._process_job,
                args=(job_id,)
            )
            thread.start()

            logger.info(f"Video generation job created: {job_id}")

            return job

        except Exception as e:
            logger.error(f"Error creating video generation job: {e}")
            raise

    def _process_job(self, job_id: str):
        """
        Process a video generation job

        Args:
            job_id: Job ID
        """
        try:
            job = self.jobs[job_id]
            self._update_job_status(job_id, JobStatus.PROCESSING, progress=0)

            logger.info(f"Processing job {job_id}")

            # Step 1: Generate audio from script (20% progress)
            logger.info(f"Job {job_id}: Generating audio from script")
            audio_path = self._generate_audio(
                job["script"],
                job.get("voice_id")
            )
            self._update_job_status(job_id, JobStatus.PROCESSING, progress=20)
            job["audio_path"] = audio_path

            # Step 2: Load avatar (40% progress)
            logger.info(f"Job {job_id}: Loading avatar {job['avatar_id']}")
            avatar_frame = self._get_avatar_video(job["avatar_id"])
            self._update_job_status(job_id, JobStatus.PROCESSING, progress=40)
            job["avatar_video_path"] = avatar_frame

            # Step 3: Generate lip-synced video (80% progress)
            logger.info(f"Job {job_id}: Generating lip-synced video")
            output_path = job.get("output_path") or self._generate_output_path(job_id)
            video_path = self._generate_lip_sync_video(
                avatar_frame,
                audio_path,
                output_path
            )
            self._update_job_status(job_id, JobStatus.PROCESSING, progress=80)
            job["video_path"] = video_path

            # Step 4: Post-processing (if enabled) (90% progress)
            if job["video_settings"].get("enhance_quality"):
                logger.info(f"Job {job_id}: Post-processing video")
                video_path = self._post_process_video(video_path)
                job["video_path"] = video_path

            self._update_job_status(job_id, JobStatus.PROCESSING, progress=90)

            # Step 5: Finalize (100% progress)
            logger.info(f"Job {job_id}: Finalizing")
            self._update_job_status(job_id, JobStatus.COMPLETED, progress=100)

            # Cleanup temporary files
            if settings.AUTO_CLEANUP_TEMP:
                self._cleanup_temp_files(job_id)

            logger.info(f"Job {job_id} completed successfully")

        except Exception as e:
            logger.error(f"Error processing job {job_id}: {e}")
            self._update_job_status(
                job_id,
                JobStatus.FAILED,
                error=str(e)
            )

    def _generate_audio(
        self,
        script: str,
        voice_id: Optional[str] = None
    ) -> str:
        """
        Generate audio from script

        Args:
            script: Text script
            voice_id: Voice ID

        Returns:
            Path to generated audio file
        """
        try:
            # Generate temp audio path
            audio_path = settings.TEMP_DIR / f"audio_{uuid.uuid4().hex}.wav"

            # Generate speech
            self.synthesizer.text_to_speech(
                text=script,
                output_path=str(audio_path),
                voice_id=voice_id
            )

            return str(audio_path)

        except Exception as e:
            logger.error(f"Error generating audio: {e}")
            raise

    def _get_avatar_video(self, avatar_id: str) -> str:
        """
        Get or create avatar video

        Args:
            avatar_id: Avatar ID

        Returns:
            Path to avatar video
        """
        try:
            # Load avatar metadata
            avatar = self.avatar_trainer.load_avatar(avatar_id)

            # Get reference frame
            frame = self.avatar_trainer.get_avatar_frame(avatar_id)

            # Create a short video from the frame (for lip sync)
            video_path = settings.TEMP_DIR / f"avatar_{avatar_id}_{uuid.uuid4().hex}.mp4"

            import cv2
            height, width = frame.shape[:2]
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(
                str(video_path),
                fourcc,
                settings.VIDEO_FPS,
                (width, height)
            )

            # Write same frame multiple times to create video
            for _ in range(settings.VIDEO_FPS * 2):  # 2 second video
                out.write(frame)

            out.release()

            return str(video_path)

        except Exception as e:
            logger.error(f"Error getting avatar video: {e}")
            raise

    def _generate_lip_sync_video(
        self,
        video_path: str,
        audio_path: str,
        output_path: str
    ) -> str:
        """
        Generate lip-synced video

        Args:
            video_path: Path to avatar video
            audio_path: Path to audio file
            output_path: Path to save output

        Returns:
            Path to generated video
        """
        try:
            return self.lip_sync_engine.generate_lip_sync_video(
                video_path=video_path,
                audio_path=audio_path,
                output_path=output_path
            )

        except Exception as e:
            logger.error(f"Error generating lip sync video: {e}")
            raise

    def _post_process_video(self, video_path: str) -> str:
        """
        Post-process video (enhancement, filters, etc.)

        Args:
            video_path: Path to video

        Returns:
            Path to processed video
        """
        try:
            # Placeholder for post-processing
            # Can add face enhancement, super resolution, etc.
            logger.info(f"Post-processing video: {video_path}")

            return video_path

        except Exception as e:
            logger.error(f"Error post-processing video: {e}")
            return video_path

    def _cleanup_temp_files(self, job_id: str):
        """
        Clean up temporary files for a job

        Args:
            job_id: Job ID
        """
        try:
            job = self.jobs.get(job_id)
            if not job:
                return

            # Clean up temp audio
            if "audio_path" in job:
                audio_path = Path(job["audio_path"])
                if audio_path.exists() and audio_path.parent == settings.TEMP_DIR:
                    audio_path.unlink()

            # Clean up temp avatar video
            if "avatar_video_path" in job:
                video_path = Path(job["avatar_video_path"])
                if video_path.exists() and video_path.parent == settings.TEMP_DIR:
                    video_path.unlink()

            logger.info(f"Cleaned up temp files for job {job_id}")

        except Exception as e:
            logger.error(f"Error cleaning up temp files: {e}")

    def _update_job_status(
        self,
        job_id: str,
        status: JobStatus,
        progress: Optional[int] = None,
        error: Optional[str] = None
    ):
        """
        Update job status

        Args:
            job_id: Job ID
            status: New status
            progress: Progress percentage (0-100)
            error: Error message if failed
        """
        if job_id not in self.jobs:
            return

        job = self.jobs[job_id]
        job["status"] = status.value
        job["updated_at"] = datetime.now().isoformat()

        if progress is not None:
            job["progress"] = progress

        if error is not None:
            job["error"] = error

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get job status

        Args:
            job_id: Job ID

        Returns:
            Job information dictionary
        """
        return self.jobs.get(job_id)

    def list_jobs(
        self,
        status: Optional[JobStatus] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        List jobs

        Args:
            status: Filter by status
            limit: Maximum number of jobs to return

        Returns:
            List of job dictionaries
        """
        jobs = list(self.jobs.values())

        if status:
            jobs = [j for j in jobs if j["status"] == status.value]

        # Sort by created_at (newest first)
        jobs.sort(key=lambda j: j["created_at"], reverse=True)

        return jobs[:limit]

    def cancel_job(self, job_id: str):
        """
        Cancel a job

        Args:
            job_id: Job ID
        """
        if job_id in self.jobs:
            job = self.jobs[job_id]
            if job["status"] in [JobStatus.PENDING.value, JobStatus.PROCESSING.value]:
                self._update_job_status(job_id, JobStatus.CANCELLED)
                logger.info(f"Job {job_id} cancelled")

    def delete_job(self, job_id: str):
        """
        Delete a job

        Args:
            job_id: Job ID
        """
        if job_id in self.jobs:
            self._cleanup_temp_files(job_id)
            del self.jobs[job_id]
            logger.info(f"Job {job_id} deleted")

    @staticmethod
    def _generate_job_id() -> str:
        """Generate unique job ID"""
        return f"job_{uuid.uuid4().hex[:12]}"

    @staticmethod
    def _generate_output_path(job_id: str) -> str:
        """Generate output path for job"""
        output_dir = settings.OUTPUT_DIR
        output_dir.mkdir(parents=True, exist_ok=True)
        return str(output_dir / f"{job_id}.mp4")

    def batch_generate(
        self,
        jobs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generate multiple videos in batch

        Args:
            jobs: List of job specifications

        Returns:
            List of created job dictionaries
        """
        created_jobs = []

        for job_spec in jobs:
            try:
                job = self.generate_video(**job_spec)
                created_jobs.append(job)
            except Exception as e:
                logger.error(f"Error creating batch job: {e}")

        return created_jobs


# Global generator instance
_generator = None


def get_generator() -> VideoGenerator:
    """Get global video generator instance"""
    global _generator
    if _generator is None:
        _generator = VideoGenerator()
    return _generator


# Convenience functions
def generate_video(script: str, avatar_id: str, **kwargs) -> Dict[str, Any]:
    """Generate a video"""
    return get_generator().generate_video(script, avatar_id, **kwargs)


def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Get job status"""
    return get_generator().get_job_status(job_id)


def list_jobs(**kwargs) -> List[Dict[str, Any]]:
    """List jobs"""
    return get_generator().list_jobs(**kwargs)
