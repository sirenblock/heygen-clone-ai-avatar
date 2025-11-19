"""
Avatar Trainer Module
Handles avatar creation and training from video inputs
"""

import os
import logging
import json
import numpy as np
import cv2
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
from datetime import datetime
import hashlib

from config import settings

logger = logging.getLogger(__name__)


class AvatarTrainer:
    """Main class for avatar training operations"""

    def __init__(self):
        self.avatars_dir = settings.AVATARS_DIR
        self.avatars_dir.mkdir(parents=True, exist_ok=True)

    def train_avatar(
        self,
        video_path: str,
        avatar_id: str,
        name: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Train an avatar from a video

        Args:
            video_path: Path to training video
            avatar_id: Unique ID for the avatar
            name: Name of the avatar
            metadata: Additional metadata

        Returns:
            Avatar information dictionary
        """
        try:
            logger.info(f"Training avatar '{name}' from video: {video_path}")

            # Create avatar directory
            avatar_dir = self.avatars_dir / avatar_id
            avatar_dir.mkdir(parents=True, exist_ok=True)

            # Extract frames from video
            frames, video_info = self._extract_frames(video_path)
            logger.info(f"Extracted {len(frames)} frames from video")

            # Analyze frame quality and select best frames
            selected_frames = self._select_best_frames(frames)
            logger.info(f"Selected {len(selected_frames)} high-quality frames")

            # Save reference frames
            reference_paths = self._save_reference_frames(
                selected_frames,
                avatar_dir
            )

            # Generate avatar metadata
            avatar_metadata = {
                "avatar_id": avatar_id,
                "name": name,
                "created_at": datetime.now().isoformat(),
                "video_path": str(video_path),
                "frame_count": len(frames),
                "selected_frame_count": len(selected_frames),
                "reference_frames": reference_paths,
                "video_info": video_info,
                "custom_metadata": metadata or {},
            }

            # Save metadata
            metadata_path = avatar_dir / "metadata.json"
            with open(metadata_path, 'w') as f:
                json.dump(avatar_metadata, f, indent=2)

            logger.info(f"Avatar '{name}' trained successfully")

            return avatar_metadata

        except Exception as e:
            logger.error(f"Error training avatar: {e}")
            raise

    def _extract_frames(
        self,
        video_path: str,
        max_frames: Optional[int] = None
    ) -> Tuple[List[np.ndarray], Dict[str, Any]]:
        """
        Extract frames from video

        Args:
            video_path: Path to video file
            max_frames: Maximum number of frames to extract

        Returns:
            Tuple of (frames list, video info dict)
        """
        try:
            video_stream = cv2.VideoCapture(video_path)

            fps = video_stream.get(cv2.CAP_PROP_FPS)
            frame_count = int(video_stream.get(cv2.CAP_PROP_FRAME_COUNT))
            width = int(video_stream.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(video_stream.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = frame_count / fps if fps > 0 else 0

            video_info = {
                "fps": fps,
                "frame_count": frame_count,
                "width": width,
                "height": height,
                "duration": duration,
            }

            # Determine frame sampling rate
            max_frames = max_frames or settings.AVATAR_TRAINING_PARAMS["max_frames"]
            step = max(1, frame_count // max_frames)

            frames = []
            frame_idx = 0

            while True:
                ret, frame = video_stream.read()
                if not ret:
                    break

                if frame_idx % step == 0:
                    frames.append(frame)

                frame_idx += 1

                if len(frames) >= max_frames:
                    break

            video_stream.release()

            return frames, video_info

        except Exception as e:
            logger.error(f"Error extracting frames: {e}")
            raise

    def _select_best_frames(
        self,
        frames: List[np.ndarray],
        min_frames: Optional[int] = None
    ) -> List[np.ndarray]:
        """
        Select best quality frames based on various metrics

        Args:
            frames: List of frames
            min_frames: Minimum number of frames to select

        Returns:
            List of selected frames
        """
        try:
            min_frames = min_frames or settings.AVATAR_TRAINING_PARAMS["min_frames"]
            quality_threshold = settings.AVATAR_TRAINING_PARAMS["quality_threshold"]

            # Analyze frame quality
            frame_scores = []
            for frame in frames:
                score = self._calculate_frame_quality(frame)
                frame_scores.append(score)

            # Sort by quality
            sorted_indices = np.argsort(frame_scores)[::-1]

            # Select frames above quality threshold
            selected_frames = []
            for idx in sorted_indices:
                if frame_scores[idx] >= quality_threshold:
                    selected_frames.append(frames[idx])

                if len(selected_frames) >= min_frames:
                    break

            # If not enough high-quality frames, take best available
            if len(selected_frames) < min_frames:
                logger.warning(
                    f"Only {len(selected_frames)} frames meet quality threshold, "
                    f"selecting {min_frames} best frames"
                )
                selected_frames = [frames[i] for i in sorted_indices[:min_frames]]

            return selected_frames

        except Exception as e:
            logger.error(f"Error selecting best frames: {e}")
            raise

    def _calculate_frame_quality(self, frame: np.ndarray) -> float:
        """
        Calculate quality score for a frame

        Args:
            frame: Input frame

        Returns:
            Quality score (0-1)
        """
        try:
            # Import face detection
            from core.lip_sync_engine import get_engine

            engine = get_engine()

            # Detect faces
            faces = engine.detect_faces(frame)

            if not faces:
                return 0.0

            # Get largest face
            largest_face = max(faces, key=lambda f: f[2] * f[3])
            x, y, w, h = largest_face

            # Extract face region
            face_region = frame[y:y+h, x:x+w]

            # Calculate quality metrics
            scores = []

            # 1. Face size score
            face_size = w * h
            size_score = min(
                face_size / settings.AVATAR_TRAINING_PARAMS["face_size_min"] ** 2,
                1.0
            )
            scores.append(size_score)

            # 2. Sharpness score (Laplacian variance)
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness_score = min(laplacian_var / 1000, 1.0)
            scores.append(sharpness_score)

            # 3. Brightness score
            brightness = np.mean(gray)
            brightness_score = 1.0 - abs(brightness - 127.5) / 127.5
            scores.append(brightness_score)

            # 4. Contrast score
            contrast = gray.std()
            contrast_score = min(contrast / 64, 1.0)
            scores.append(contrast_score)

            # Calculate overall score
            overall_score = np.mean(scores)

            return overall_score

        except Exception as e:
            logger.error(f"Error calculating frame quality: {e}")
            return 0.0

    def _save_reference_frames(
        self,
        frames: List[np.ndarray],
        avatar_dir: Path
    ) -> List[str]:
        """
        Save reference frames to disk

        Args:
            frames: List of frames
            avatar_dir: Avatar directory

        Returns:
            List of saved frame paths
        """
        try:
            frames_dir = avatar_dir / "frames"
            frames_dir.mkdir(parents=True, exist_ok=True)

            frame_paths = []
            for i, frame in enumerate(frames):
                frame_path = frames_dir / f"frame_{i:04d}.jpg"
                cv2.imwrite(str(frame_path), frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
                frame_paths.append(str(frame_path.relative_to(avatar_dir)))

            return frame_paths

        except Exception as e:
            logger.error(f"Error saving reference frames: {e}")
            raise

    def load_avatar(self, avatar_id: str) -> Dict[str, Any]:
        """
        Load avatar metadata

        Args:
            avatar_id: Avatar ID

        Returns:
            Avatar metadata dictionary
        """
        try:
            avatar_dir = self.avatars_dir / avatar_id
            metadata_path = avatar_dir / "metadata.json"

            if not metadata_path.exists():
                raise FileNotFoundError(f"Avatar {avatar_id} not found")

            with open(metadata_path, 'r') as f:
                metadata = json.load(f)

            return metadata

        except Exception as e:
            logger.error(f"Error loading avatar: {e}")
            raise

    def list_avatars(self) -> List[Dict[str, Any]]:
        """
        List all available avatars

        Returns:
            List of avatar metadata dictionaries
        """
        try:
            avatars = []

            for avatar_dir in self.avatars_dir.iterdir():
                if avatar_dir.is_dir():
                    try:
                        metadata = self.load_avatar(avatar_dir.name)
                        avatars.append(metadata)
                    except Exception as e:
                        logger.warning(f"Error loading avatar {avatar_dir.name}: {e}")

            return avatars

        except Exception as e:
            logger.error(f"Error listing avatars: {e}")
            return []

    def delete_avatar(self, avatar_id: str):
        """
        Delete an avatar

        Args:
            avatar_id: Avatar ID
        """
        try:
            avatar_dir = self.avatars_dir / avatar_id

            if not avatar_dir.exists():
                raise FileNotFoundError(f"Avatar {avatar_id} not found")

            # Delete avatar directory
            import shutil
            shutil.rmtree(avatar_dir)

            logger.info(f"Avatar {avatar_id} deleted")

        except Exception as e:
            logger.error(f"Error deleting avatar: {e}")
            raise

    def get_avatar_frame(self, avatar_id: str, frame_idx: int = 0) -> np.ndarray:
        """
        Get a reference frame from avatar

        Args:
            avatar_id: Avatar ID
            frame_idx: Frame index

        Returns:
            Frame as numpy array
        """
        try:
            metadata = self.load_avatar(avatar_id)
            avatar_dir = self.avatars_dir / avatar_id

            if frame_idx >= len(metadata["reference_frames"]):
                frame_idx = 0

            frame_path = avatar_dir / metadata["reference_frames"][frame_idx]
            frame = cv2.imread(str(frame_path))

            if frame is None:
                raise FileNotFoundError(f"Frame not found: {frame_path}")

            return frame

        except Exception as e:
            logger.error(f"Error getting avatar frame: {e}")
            raise

    def update_avatar_metadata(
        self,
        avatar_id: str,
        metadata_update: Dict[str, Any]
    ):
        """
        Update avatar metadata

        Args:
            avatar_id: Avatar ID
            metadata_update: Metadata fields to update
        """
        try:
            metadata = self.load_avatar(avatar_id)
            metadata.update(metadata_update)
            metadata["updated_at"] = datetime.now().isoformat()

            avatar_dir = self.avatars_dir / avatar_id
            metadata_path = avatar_dir / "metadata.json"

            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)

            logger.info(f"Avatar {avatar_id} metadata updated")

        except Exception as e:
            logger.error(f"Error updating avatar metadata: {e}")
            raise

    @staticmethod
    def generate_avatar_id(name: str) -> str:
        """
        Generate unique avatar ID from name

        Args:
            name: Avatar name

        Returns:
            Unique avatar ID
        """
        timestamp = datetime.now().isoformat()
        hash_input = f"{name}_{timestamp}".encode()
        avatar_id = hashlib.md5(hash_input).hexdigest()[:12]
        return avatar_id


# Global trainer instance
_trainer = None


def get_trainer() -> AvatarTrainer:
    """Get global avatar trainer instance"""
    global _trainer
    if _trainer is None:
        _trainer = AvatarTrainer()
    return _trainer


# Convenience functions
def train_avatar(video_path: str, name: str, **kwargs) -> Dict[str, Any]:
    """Train an avatar from video"""
    avatar_id = AvatarTrainer.generate_avatar_id(name)
    return get_trainer().train_avatar(video_path, avatar_id, name, **kwargs)


def list_avatars() -> List[Dict[str, Any]]:
    """List all avatars"""
    return get_trainer().list_avatars()


def get_avatar(avatar_id: str) -> Dict[str, Any]:
    """Get avatar metadata"""
    return get_trainer().load_avatar(avatar_id)
