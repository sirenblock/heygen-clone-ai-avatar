"""
Lip Sync Engine Module
Handles lip synchronization using Wav2Lip model and face detection
"""

import os
import logging
import numpy as np
import cv2
import torch
from typing import Optional, Tuple, List
from pathlib import Path
import mediapipe as mp
from scipy.io import wavfile
import librosa

from config import settings

logger = logging.getLogger(__name__)


class LipSyncEngine:
    """Main class for lip synchronization operations"""

    def __init__(self):
        self.device = self._setup_device()
        self.model = None
        self.face_detector = self._setup_face_detector()
        self.model_loaded = False

    def _setup_device(self) -> torch.device:
        """Setup compute device (GPU/CPU)"""
        if settings.USE_GPU and torch.cuda.is_available():
            device = torch.device(f'cuda:{settings.GPU_DEVICE}')
            logger.info(f"Using GPU: {torch.cuda.get_device_name(settings.GPU_DEVICE)}")
        else:
            device = torch.device('cpu')
            logger.info("Using CPU for inference")

        return device

    def _setup_face_detector(self):
        """Setup face detection model"""
        if settings.FACE_DETECTOR == "mediapipe":
            return mp.solutions.face_detection.FaceDetection(
                min_detection_confidence=settings.FACE_DETECTION_CONFIDENCE,
                model_selection=1
            )
        else:
            logger.warning(f"Face detector {settings.FACE_DETECTOR} not implemented, using mediapipe")
            return mp.solutions.face_detection.FaceDetection(
                min_detection_confidence=settings.FACE_DETECTION_CONFIDENCE
            )

    def load_model(self, model_path: Optional[str] = None):
        """
        Load Wav2Lip model

        Args:
            model_path: Path to model checkpoint
        """
        try:
            model_path = model_path or settings.WAV2LIP_MODEL_PATH

            if not os.path.exists(model_path):
                logger.info(f"Model not found at {model_path}, downloading...")
                self._download_model(model_path)

            # Import model architecture
            from models.wav2lip import Wav2Lip

            # Load model
            logger.info(f"Loading Wav2Lip model from {model_path}")
            checkpoint = torch.load(model_path, map_location=self.device)

            self.model = Wav2Lip()
            self.model.load_state_dict(checkpoint["state_dict"])
            self.model = self.model.to(self.device)
            self.model.eval()

            self.model_loaded = True
            logger.info("Wav2Lip model loaded successfully")

        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise

    def _download_model(self, model_path: str):
        """Download Wav2Lip model from HuggingFace"""
        try:
            import urllib.request

            model_path = Path(model_path)
            model_path.parent.mkdir(parents=True, exist_ok=True)

            logger.info(f"Downloading model from {settings.WAV2LIP_MODEL_URL}")
            urllib.request.urlretrieve(settings.WAV2LIP_MODEL_URL, model_path)
            logger.info("Model downloaded successfully")

        except Exception as e:
            logger.error(f"Error downloading model: {e}")
            raise

    def detect_faces(self, frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in a frame

        Args:
            frame: Input frame (BGR format)

        Returns:
            List of face bounding boxes (x, y, w, h)
        """
        try:
            # Convert to RGB for MediaPipe
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Detect faces
            results = self.face_detector.process(rgb_frame)

            faces = []
            if results.detections:
                h, w, _ = frame.shape
                for detection in results.detections:
                    bbox = detection.location_data.relative_bounding_box
                    x = int(bbox.xmin * w)
                    y = int(bbox.ymin * h)
                    width = int(bbox.width * w)
                    height = int(bbox.height * h)

                    # Filter by minimum size
                    if width >= settings.MIN_FACE_SIZE and height >= settings.MIN_FACE_SIZE:
                        faces.append((x, y, width, height))

            return faces

        except Exception as e:
            logger.error(f"Error detecting faces: {e}")
            return []

    def extract_face(
        self,
        frame: np.ndarray,
        bbox: Tuple[int, int, int, int],
        size: int = 96
    ) -> np.ndarray:
        """
        Extract and resize face from frame

        Args:
            frame: Input frame
            bbox: Face bounding box (x, y, w, h)
            size: Output size

        Returns:
            Extracted face image
        """
        try:
            x, y, w, h = bbox

            # Add padding
            padding = int(max(w, h) * 0.2)
            x1 = max(0, x - padding)
            y1 = max(0, y - padding)
            x2 = min(frame.shape[1], x + w + padding)
            y2 = min(frame.shape[0], y + h + padding)

            # Extract face
            face = frame[y1:y2, x1:x2]

            # Resize to model input size
            face = cv2.resize(face, (size, size))

            return face

        except Exception as e:
            logger.error(f"Error extracting face: {e}")
            raise

    def get_mel_spectrogram(self, audio_path: str) -> np.ndarray:
        """
        Generate mel spectrogram from audio

        Args:
            audio_path: Path to audio file

        Returns:
            Mel spectrogram array
        """
        try:
            # Load audio
            audio, sr = librosa.load(audio_path, sr=settings.AUDIO_SAMPLE_RATE)

            # Generate mel spectrogram
            mel = librosa.feature.melspectrogram(
                y=audio,
                sr=sr,
                **settings.MEL_SPECTROGRAM_PARAMS
            )

            # Convert to log scale
            mel = librosa.power_to_db(mel, ref=np.max)

            return mel.T

        except Exception as e:
            logger.error(f"Error generating mel spectrogram: {e}")
            raise

    def generate_lip_sync_video(
        self,
        video_path: str,
        audio_path: str,
        output_path: str,
        face_bbox: Optional[Tuple[int, int, int, int]] = None
    ) -> str:
        """
        Generate lip-synced video

        Args:
            video_path: Path to input video
            audio_path: Path to audio file
            output_path: Path to save output video
            face_bbox: Optional face bounding box (auto-detect if not provided)

        Returns:
            Path to generated video
        """
        try:
            if not self.model_loaded:
                self.load_model()

            logger.info(f"Generating lip sync video: {video_path} + {audio_path}")

            # Load video
            video_stream = cv2.VideoCapture(video_path)
            fps = video_stream.get(cv2.CAP_PROP_FPS)
            frame_count = int(video_stream.get(cv2.CAP_PROP_FRAME_COUNT))

            # Get mel spectrogram
            mel = self.get_mel_spectrogram(audio_path)

            # Prepare output video writer
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            frame_h = int(video_stream.get(cv2.CAP_PROP_FRAME_HEIGHT))
            frame_w = int(video_stream.get(cv2.CAP_PROP_FRAME_WIDTH))

            out = cv2.VideoWriter(
                str(output_path),
                cv2.VideoWriter_fourcc(*'mp4v'),
                fps,
                (frame_w, frame_h)
            )

            # Process frames
            batch_frames = []
            batch_mels = []
            frame_idx = 0

            while True:
                ret, frame = video_stream.read()
                if not ret:
                    break

                # Detect face if bbox not provided
                if face_bbox is None:
                    faces = self.detect_faces(frame)
                    if not faces:
                        logger.warning(f"No face detected in frame {frame_idx}")
                        out.write(frame)
                        frame_idx += 1
                        continue
                    current_bbox = faces[0]  # Use first detected face
                else:
                    current_bbox = face_bbox

                # Extract face
                face = self.extract_face(frame, current_bbox)

                # Get corresponding mel spectrogram chunk
                mel_idx = int(frame_idx * len(mel) / frame_count)
                mel_chunk = self._get_mel_chunk(mel, mel_idx)

                batch_frames.append(face)
                batch_mels.append(mel_chunk)

                # Process batch
                if len(batch_frames) >= settings.BATCH_SIZE or frame_idx == frame_count - 1:
                    synced_faces = self._process_batch(batch_frames, batch_mels)

                    # Reconstruct frames
                    for i, synced_face in enumerate(synced_faces):
                        output_frame = frame.copy()
                        output_frame = self._blend_face(
                            output_frame,
                            synced_face,
                            current_bbox
                        )
                        out.write(output_frame)

                    batch_frames = []
                    batch_mels = []

                frame_idx += 1

            # Release resources
            video_stream.release()
            out.release()

            # Add audio to video
            output_path = self._add_audio_to_video(str(output_path), audio_path)

            logger.info(f"Lip sync video generated: {output_path}")
            return str(output_path)

        except Exception as e:
            logger.error(f"Error generating lip sync video: {e}")
            raise

    def _get_mel_chunk(self, mel: np.ndarray, idx: int) -> np.ndarray:
        """Get mel spectrogram chunk for a frame"""
        start_idx = max(0, idx - settings.MEL_STEP_SIZE // 2)
        end_idx = min(len(mel), start_idx + settings.MEL_STEP_SIZE)

        chunk = mel[start_idx:end_idx]

        # Pad if needed
        if len(chunk) < settings.MEL_STEP_SIZE:
            chunk = np.pad(
                chunk,
                ((0, settings.MEL_STEP_SIZE - len(chunk)), (0, 0)),
                mode='edge'
            )

        return chunk

    def _process_batch(
        self,
        frames: List[np.ndarray],
        mels: List[np.ndarray]
    ) -> List[np.ndarray]:
        """Process a batch of frames with Wav2Lip model"""
        try:
            # Prepare inputs
            frames_tensor = torch.FloatTensor(
                np.array(frames)
            ).permute(0, 3, 1, 2).to(self.device)

            mels_tensor = torch.FloatTensor(
                np.array(mels)
            ).unsqueeze(1).to(self.device)

            # Normalize
            frames_tensor = frames_tensor / 255.0

            # Generate lip-synced faces
            with torch.no_grad():
                pred = self.model(mels_tensor, frames_tensor)

            # Convert back to numpy
            pred = pred.cpu().numpy().transpose(0, 2, 3, 1) * 255.0
            pred = pred.astype(np.uint8)

            return [pred[i] for i in range(len(pred))]

        except Exception as e:
            logger.error(f"Error processing batch: {e}")
            raise

    def _blend_face(
        self,
        frame: np.ndarray,
        face: np.ndarray,
        bbox: Tuple[int, int, int, int]
    ) -> np.ndarray:
        """Blend generated face back into frame"""
        try:
            x, y, w, h = bbox

            # Resize face to match bbox
            face_resized = cv2.resize(face, (w, h))

            # Blend with original frame
            frame[y:y+h, x:x+w] = face_resized

            return frame

        except Exception as e:
            logger.error(f"Error blending face: {e}")
            return frame

    def _add_audio_to_video(self, video_path: str, audio_path: str) -> str:
        """Add audio track to video"""
        try:
            from moviepy.editor import VideoFileClip, AudioFileClip

            video = VideoFileClip(video_path)
            audio = AudioFileClip(audio_path)

            # Set audio
            final_video = video.set_audio(audio)

            # Save with audio
            output_path = str(Path(video_path).with_stem(
                f"{Path(video_path).stem}_final"
            ))

            final_video.write_videofile(
                output_path,
                codec=settings.VIDEO_CODEC,
                audio_codec='aac',
                fps=video.fps
            )

            # Cleanup
            video.close()
            audio.close()

            return output_path

        except Exception as e:
            logger.error(f"Error adding audio to video: {e}")
            return video_path


# Global engine instance
_engine = None


def get_engine() -> LipSyncEngine:
    """Get global lip sync engine instance"""
    global _engine
    if _engine is None:
        _engine = LipSyncEngine()
    return _engine


# Convenience functions
def generate_video(video_path: str, audio_path: str, output_path: str, **kwargs) -> str:
    """Generate lip-synced video"""
    return get_engine().generate_lip_sync_video(video_path, audio_path, output_path, **kwargs)
