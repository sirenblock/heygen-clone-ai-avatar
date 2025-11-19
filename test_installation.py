"""
Test Installation Script
Verify that all components are installed and working correctly
"""

import sys
import subprocess
from pathlib import Path


def test_python_version():
    """Test Python version"""
    print("Testing Python version...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"✓ Python {version.major}.{version.minor}.{version.micro} installed")
        return True
    else:
        print(f"✗ Python 3.8+ required, found {version.major}.{version.minor}.{version.micro}")
        return False


def test_package_import(package_name, import_name=None):
    """Test if a package can be imported"""
    import_name = import_name or package_name
    try:
        __import__(import_name)
        print(f"✓ {package_name} installed")
        return True
    except ImportError:
        print(f"✗ {package_name} not installed")
        return False


def test_gpu():
    """Test GPU availability"""
    print("\nTesting GPU...")
    try:
        import torch
        if torch.cuda.is_available():
            print(f"✓ GPU available: {torch.cuda.get_device_name(0)}")
            print(f"  CUDA version: {torch.version.cuda}")
            print(f"  GPU count: {torch.cuda.device_count()}")
            return True
        else:
            print("⚠ GPU not available, will use CPU")
            return False
    except Exception as e:
        print(f"✗ Error checking GPU: {e}")
        return False


def test_api_key():
    """Test if ElevenLabs API key is set"""
    print("\nTesting ElevenLabs API key...")
    from config import settings
    if settings.ELEVENLABS_API_KEY:
        print("✓ ElevenLabs API key is set")
        return True
    else:
        print("⚠ ElevenLabs API key not set (required for voice synthesis)")
        return False


def test_directories():
    """Test if required directories exist"""
    print("\nTesting directories...")
    from config import settings

    dirs = [
        settings.DATA_DIR,
        settings.MODELS_DIR,
        settings.AVATARS_DIR,
        settings.TEMP_DIR,
        settings.OUTPUT_DIR,
    ]

    all_exist = True
    for dir_path in dirs:
        if dir_path.exists():
            print(f"✓ {dir_path} exists")
        else:
            print(f"✗ {dir_path} does not exist")
            all_exist = False

    return all_exist


def test_models():
    """Test if models can be loaded"""
    print("\nTesting models...")
    try:
        from models.wav2lip import Wav2Lip
        model = Wav2Lip()
        print("✓ Wav2Lip model architecture loaded")
        return True
    except Exception as e:
        print(f"✗ Error loading models: {e}")
        return False


def test_face_detection():
    """Test face detection"""
    print("\nTesting face detection...")
    try:
        import mediapipe as mp
        import cv2
        import numpy as np

        face_detection = mp.solutions.face_detection.FaceDetection()

        # Create a dummy image
        dummy_image = np.zeros((480, 640, 3), dtype=np.uint8)

        # Try to process it
        results = face_detection.process(cv2.cvtColor(dummy_image, cv2.COLOR_BGR2RGB))

        print("✓ Face detection working")
        return True
    except Exception as e:
        print(f"✗ Error with face detection: {e}")
        return False


def test_audio_processing():
    """Test audio processing"""
    print("\nTesting audio processing...")
    try:
        import librosa
        import soundfile
        print("✓ Audio processing libraries loaded")
        return True
    except Exception as e:
        print(f"✗ Error with audio processing: {e}")
        return False


def test_video_processing():
    """Test video processing"""
    print("\nTesting video processing...")
    try:
        import cv2
        from moviepy.editor import VideoFileClip
        print("✓ Video processing libraries loaded")
        return True
    except Exception as e:
        print(f"✗ Error with video processing: {e}")
        return False


def test_fastapi():
    """Test FastAPI"""
    print("\nTesting FastAPI...")
    try:
        from fastapi import FastAPI
        from pydantic import BaseModel

        app = FastAPI()

        @app.get("/")
        def root():
            return {"status": "ok"}

        print("✓ FastAPI working")
        return True
    except Exception as e:
        print(f"✗ Error with FastAPI: {e}")
        return False


def test_ffmpeg():
    """Test FFmpeg"""
    print("\nTesting FFmpeg...")
    try:
        result = subprocess.run(
            ['ffmpeg', '-version'],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0]
            print(f"✓ FFmpeg installed: {version_line}")
            return True
        else:
            print("✗ FFmpeg not working")
            return False
    except FileNotFoundError:
        print("✗ FFmpeg not installed")
        return False


def run_all_tests():
    """Run all tests"""
    print("=" * 60)
    print("AI Avatar Platform - Installation Test")
    print("=" * 60)
    print()

    tests = [
        ("Python Version", test_python_version),
        ("Core Packages", lambda: all([
            test_package_import("fastapi"),
            test_package_import("uvicorn"),
            test_package_import("pydantic"),
            test_package_import("torch"),
            test_package_import("cv2", "cv2"),
            test_package_import("mediapipe"),
            test_package_import("librosa"),
            test_package_import("elevenlabs"),
        ])),
        ("GPU", test_gpu),
        ("API Key", test_api_key),
        ("Directories", test_directories),
        ("Models", test_models),
        ("Face Detection", test_face_detection),
        ("Audio Processing", test_audio_processing),
        ("Video Processing", test_video_processing),
        ("FastAPI", test_fastapi),
        ("FFmpeg", test_ffmpeg),
    ]

    results = {}
    for name, test_func in tests:
        print(f"\n{'=' * 60}")
        print(f"Test: {name}")
        print('=' * 60)
        try:
            results[name] = test_func()
        except Exception as e:
            print(f"✗ Unexpected error: {e}")
            results[name] = False

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    passed = sum(results.values())
    total = len(results)

    for name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")

    print("\n" + "=" * 60)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 60)

    if passed == total:
        print("\n✓ All tests passed! Installation is complete.")
        print("\nNext steps:")
        print("1. Set ELEVENLABS_API_KEY in .env file")
        print("2. Run 'python examples.py' to see usage examples")
        print("3. Run 'python main.py' to start the API server")
        return 0
    else:
        print("\n⚠ Some tests failed. Please check the errors above.")
        print("\nCommon fixes:")
        print("- Run 'pip install -r requirements.txt' to install packages")
        print("- Install FFmpeg: https://ffmpeg.org/download.html")
        print("- Set ELEVENLABS_API_KEY in .env file")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
