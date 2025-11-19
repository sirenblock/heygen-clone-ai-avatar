"""
Voice Synthesis Module
Handles text-to-speech generation and voice cloning using ElevenLabs API
"""

import os
import logging
from typing import Optional, Dict, Any, List
from pathlib import Path
import numpy as np
import soundfile as sf
from elevenlabs import generate, clone, Voice, VoiceSettings, set_api_key
from elevenlabs.api import Voices
from pydub import AudioSegment
import tempfile

from config import settings

logger = logging.getLogger(__name__)

# Set ElevenLabs API key
if settings.ELEVENLABS_API_KEY:
    set_api_key(settings.ELEVENLABS_API_KEY)


class VoiceSynthesizer:
    """Main class for voice synthesis operations"""

    def __init__(self):
        self.api_key = settings.ELEVENLABS_API_KEY
        if not self.api_key:
            logger.warning("ElevenLabs API key not set. Voice synthesis will not work.")

        self.default_voice_id = settings.DEFAULT_VOICE_ID
        self.voice_model = settings.VOICE_MODEL
        self.stability = settings.VOICE_STABILITY
        self.similarity_boost = settings.VOICE_SIMILARITY_BOOST

        # Cache for voice metadata
        self._voice_cache: Dict[str, Any] = {}

    def text_to_speech(
        self,
        text: str,
        output_path: str,
        voice_id: Optional[str] = None,
        stability: Optional[float] = None,
        similarity_boost: Optional[float] = None,
        model: Optional[str] = None,
    ) -> str:
        """
        Convert text to speech using ElevenLabs API

        Args:
            text: Text to convert to speech
            output_path: Path to save audio file
            voice_id: ElevenLabs voice ID (uses default if not provided)
            stability: Voice stability (0-1)
            similarity_boost: Voice similarity boost (0-1)
            model: ElevenLabs model to use

        Returns:
            Path to generated audio file
        """
        try:
            logger.info(f"Generating speech for text: {text[:50]}...")

            # Use defaults if not provided
            voice_id = voice_id or self.default_voice_id
            stability = stability if stability is not None else self.stability
            similarity_boost = similarity_boost if similarity_boost is not None else self.similarity_boost
            model = model or self.voice_model

            # Generate audio
            audio = generate(
                text=text,
                voice=Voice(
                    voice_id=voice_id,
                    settings=VoiceSettings(
                        stability=stability,
                        similarity_boost=similarity_boost
                    )
                ),
                model=model
            )

            # Save audio to file
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'wb') as f:
                f.write(audio)

            logger.info(f"Audio generated successfully: {output_path}")

            # Convert to WAV format with correct sample rate for lip sync
            return self._convert_to_wav(str(output_path))

        except Exception as e:
            logger.error(f"Error generating speech: {e}")
            raise

    def _convert_to_wav(self, audio_path: str) -> str:
        """
        Convert audio file to WAV format with correct sample rate

        Args:
            audio_path: Path to input audio file

        Returns:
            Path to converted WAV file
        """
        try:
            # Load audio
            audio = AudioSegment.from_file(audio_path)

            # Convert to correct format
            audio = audio.set_frame_rate(settings.AUDIO_SAMPLE_RATE)
            audio = audio.set_channels(1)  # Mono

            # Save as WAV
            wav_path = str(Path(audio_path).with_suffix('.wav'))
            audio.export(wav_path, format='wav')

            # Remove original if different
            if wav_path != audio_path:
                os.remove(audio_path)

            return wav_path

        except Exception as e:
            logger.error(f"Error converting audio to WAV: {e}")
            raise

    def clone_voice(
        self,
        name: str,
        audio_files: List[str],
        description: Optional[str] = None
    ) -> str:
        """
        Clone a voice from audio samples

        Args:
            name: Name for the cloned voice
            audio_files: List of paths to audio files for cloning
            description: Optional description of the voice

        Returns:
            Voice ID of the cloned voice
        """
        try:
            logger.info(f"Cloning voice '{name}' from {len(audio_files)} audio files")

            # Clone voice
            voice = clone(
                name=name,
                description=description or f"Cloned voice: {name}",
                files=audio_files
            )

            logger.info(f"Voice cloned successfully: {voice.voice_id}")

            # Cache voice metadata
            self._voice_cache[voice.voice_id] = {
                "voice_id": voice.voice_id,
                "name": name,
                "description": description,
            }

            return voice.voice_id

        except Exception as e:
            logger.error(f"Error cloning voice: {e}")
            raise

    def get_available_voices(self) -> List[Dict[str, Any]]:
        """
        Get list of available voices from ElevenLabs

        Returns:
            List of voice metadata dictionaries
        """
        try:
            voices = Voices.from_api()

            voice_list = []
            for voice in voices.voices:
                voice_list.append({
                    "voice_id": voice.voice_id,
                    "name": voice.name,
                    "category": voice.category,
                    "description": getattr(voice, 'description', ''),
                })

            return voice_list

        except Exception as e:
            logger.error(f"Error fetching voices: {e}")
            return []

    def process_audio(
        self,
        audio_path: str,
        target_sample_rate: Optional[int] = None,
        normalize: bool = True
    ) -> np.ndarray:
        """
        Process audio file for lip sync

        Args:
            audio_path: Path to audio file
            target_sample_rate: Target sample rate (uses config default if not provided)
            normalize: Whether to normalize audio

        Returns:
            Processed audio as numpy array
        """
        try:
            target_sample_rate = target_sample_rate or settings.AUDIO_SAMPLE_RATE

            # Load audio
            audio, sr = sf.read(audio_path)

            # Resample if needed
            if sr != target_sample_rate:
                from scipy import signal
                audio = signal.resample(
                    audio,
                    int(len(audio) * target_sample_rate / sr)
                )

            # Convert to mono if stereo
            if len(audio.shape) > 1:
                audio = audio.mean(axis=1)

            # Normalize
            if normalize:
                audio = audio / np.max(np.abs(audio))

            return audio

        except Exception as e:
            logger.error(f"Error processing audio: {e}")
            raise

    def get_audio_duration(self, audio_path: str) -> float:
        """
        Get duration of audio file in seconds

        Args:
            audio_path: Path to audio file

        Returns:
            Duration in seconds
        """
        try:
            audio = AudioSegment.from_file(audio_path)
            return len(audio) / 1000.0  # Convert milliseconds to seconds

        except Exception as e:
            logger.error(f"Error getting audio duration: {e}")
            raise

    def split_audio(
        self,
        audio_path: str,
        chunk_duration: float = 30.0
    ) -> List[str]:
        """
        Split long audio into chunks for processing

        Args:
            audio_path: Path to audio file
            chunk_duration: Duration of each chunk in seconds

        Returns:
            List of paths to audio chunks
        """
        try:
            audio = AudioSegment.from_file(audio_path)
            duration_ms = len(audio)
            chunk_ms = int(chunk_duration * 1000)

            chunks = []
            for i in range(0, duration_ms, chunk_ms):
                chunk = audio[i:i + chunk_ms]

                # Save chunk
                chunk_path = str(Path(audio_path).with_stem(
                    f"{Path(audio_path).stem}_chunk_{i // chunk_ms}"
                ))
                chunk.export(chunk_path, format='wav')
                chunks.append(chunk_path)

            return chunks

        except Exception as e:
            logger.error(f"Error splitting audio: {e}")
            raise

    def merge_audio(self, audio_paths: List[str], output_path: str) -> str:
        """
        Merge multiple audio files into one

        Args:
            audio_paths: List of paths to audio files
            output_path: Path to save merged audio

        Returns:
            Path to merged audio file
        """
        try:
            combined = AudioSegment.empty()

            for audio_path in audio_paths:
                audio = AudioSegment.from_file(audio_path)
                combined += audio

            combined.export(output_path, format='wav')

            return output_path

        except Exception as e:
            logger.error(f"Error merging audio: {e}")
            raise

    def adjust_audio_speed(
        self,
        audio_path: str,
        speed_factor: float,
        output_path: Optional[str] = None
    ) -> str:
        """
        Adjust audio playback speed

        Args:
            audio_path: Path to audio file
            speed_factor: Speed multiplier (e.g., 1.5 = 1.5x speed)
            output_path: Path to save adjusted audio

        Returns:
            Path to adjusted audio file
        """
        try:
            audio = AudioSegment.from_file(audio_path)

            # Change speed without changing pitch
            adjusted = audio._spawn(
                audio.raw_data,
                overrides={"frame_rate": int(audio.frame_rate * speed_factor)}
            )
            adjusted = adjusted.set_frame_rate(audio.frame_rate)

            output_path = output_path or str(
                Path(audio_path).with_stem(f"{Path(audio_path).stem}_adjusted")
            )

            adjusted.export(output_path, format='wav')

            return output_path

        except Exception as e:
            logger.error(f"Error adjusting audio speed: {e}")
            raise


# Global synthesizer instance
_synthesizer = None


def get_synthesizer() -> VoiceSynthesizer:
    """Get global voice synthesizer instance"""
    global _synthesizer
    if _synthesizer is None:
        _synthesizer = VoiceSynthesizer()
    return _synthesizer


# Convenience functions
def generate_speech(text: str, output_path: str, **kwargs) -> str:
    """Generate speech from text"""
    return get_synthesizer().text_to_speech(text, output_path, **kwargs)


def clone_voice(name: str, audio_files: List[str], **kwargs) -> str:
    """Clone a voice from audio samples"""
    return get_synthesizer().clone_voice(name, audio_files, **kwargs)


def get_voices() -> List[Dict[str, Any]]:
    """Get available voices"""
    return get_synthesizer().get_available_voices()
