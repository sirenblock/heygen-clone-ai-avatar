"""Core processing modules for AI Avatar Platform"""

from .voice_synthesis import VoiceSynthesizer, get_synthesizer, generate_speech, clone_voice, get_voices

__all__ = [
    'VoiceSynthesizer',
    'get_synthesizer',
    'generate_speech',
    'clone_voice',
    'get_voices',
]
