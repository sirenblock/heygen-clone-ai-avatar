"""
AI Avatar Platform - Usage Examples
Demonstrates how to use the platform with various scenarios
"""

import os
import time
from pathlib import Path


def example_1_generate_simple_video():
    """Example 1: Generate a simple video"""
    print("=" * 60)
    print("Example 1: Generate a Simple Video")
    print("=" * 60)

    from core.video_generator import generate_video

    script = "Hello! Welcome to the AI Avatar Platform. This is a demonstration of our text-to-video technology."
    avatar_id = "demo_avatar"  # You need to create this first

    print(f"\nScript: {script}")
    print(f"Avatar: {avatar_id}")

    try:
        job = generate_video(
            script=script,
            avatar_id=avatar_id
        )

        print(f"\nJob created: {job['job_id']}")
        print(f"Status: {job['status']}")
        print("\nWaiting for video generation to complete...")

        # Wait for completion
        from core.video_generator import get_job_status
        while True:
            status = get_job_status(job['job_id'])
            print(f"Progress: {status['progress']}% - {status['status']}")

            if status['status'] in ['completed', 'failed']:
                break

            time.sleep(5)

        if status['status'] == 'completed':
            print(f"\n✓ Video generated successfully!")
            print(f"Output: {status['video_path']}")
        else:
            print(f"\n✗ Video generation failed: {status.get('error')}")

    except Exception as e:
        print(f"\n✗ Error: {e}")


def example_2_train_avatar():
    """Example 2: Train a custom avatar"""
    print("\n" + "=" * 60)
    print("Example 2: Train a Custom Avatar")
    print("=" * 60)

    from core.avatar_trainer import train_avatar

    video_path = "path/to/your/video.mp4"  # Replace with your video
    avatar_name = "My Custom Avatar"

    print(f"\nTraining avatar from: {video_path}")
    print(f"Name: {avatar_name}")

    if not os.path.exists(video_path):
        print(f"\n⚠ Video file not found: {video_path}")
        print("Please provide a valid video file path.")
        return

    try:
        avatar = train_avatar(
            video_path=video_path,
            name=avatar_name,
            metadata={
                "description": "Custom trained avatar",
                "tags": ["demo", "custom"]
            }
        )

        print(f"\n✓ Avatar trained successfully!")
        print(f"Avatar ID: {avatar['avatar_id']}")
        print(f"Frames processed: {avatar['frame_count']}")
        print(f"Selected frames: {avatar['selected_frame_count']}")

    except Exception as e:
        print(f"\n✗ Error: {e}")


def example_3_clone_voice():
    """Example 3: Clone a custom voice"""
    print("\n" + "=" * 60)
    print("Example 3: Clone a Custom Voice")
    print("=" * 60)

    from core.voice_synthesis import clone_voice

    audio_files = [
        "path/to/audio1.mp3",
        "path/to/audio2.mp3",
        "path/to/audio3.mp3",
    ]

    voice_name = "My Custom Voice"

    print(f"\nCloning voice from {len(audio_files)} audio files")
    print(f"Name: {voice_name}")

    # Check if files exist
    missing_files = [f for f in audio_files if not os.path.exists(f)]
    if missing_files:
        print(f"\n⚠ Audio files not found:")
        for f in missing_files:
            print(f"  - {f}")
        print("Please provide valid audio file paths.")
        return

    try:
        voice_id = clone_voice(
            name=voice_name,
            audio_files=audio_files,
            description="Custom cloned voice"
        )

        print(f"\n✓ Voice cloned successfully!")
        print(f"Voice ID: {voice_id}")
        print(f"\nYou can now use this voice_id in video generation.")

    except Exception as e:
        print(f"\n✗ Error: {e}")


def example_4_list_avatars_and_voices():
    """Example 4: List available avatars and voices"""
    print("\n" + "=" * 60)
    print("Example 4: List Available Avatars and Voices")
    print("=" * 60)

    from core.avatar_trainer import list_avatars
    from core.voice_synthesis import get_voices

    # List avatars
    print("\nAvailable Avatars:")
    print("-" * 40)

    try:
        avatars = list_avatars()
        if avatars:
            for avatar in avatars:
                print(f"  ID: {avatar['avatar_id']}")
                print(f"  Name: {avatar['name']}")
                print(f"  Created: {avatar['created_at']}")
                print()
        else:
            print("  No avatars found. Create one using example_2_train_avatar()")

    except Exception as e:
        print(f"  Error listing avatars: {e}")

    # List voices
    print("\nAvailable Voices:")
    print("-" * 40)

    try:
        voices = get_voices()
        if voices:
            for i, voice in enumerate(voices[:5]):  # Show first 5
                print(f"  ID: {voice['voice_id']}")
                print(f"  Name: {voice['name']}")
                print(f"  Category: {voice.get('category', 'N/A')}")
                print()

            if len(voices) > 5:
                print(f"  ... and {len(voices) - 5} more voices")
        else:
            print("  No voices found.")

    except Exception as e:
        print(f"  Error listing voices: {e}")


def example_5_batch_generation():
    """Example 5: Batch video generation"""
    print("\n" + "=" * 60)
    print("Example 5: Batch Video Generation")
    print("=" * 60)

    from core.video_generator import get_generator

    generator = get_generator()

    scripts = [
        "This is the first video in the batch.",
        "This is the second video in the batch.",
        "This is the third video in the batch.",
    ]

    avatar_id = "demo_avatar"

    print(f"\nGenerating {len(scripts)} videos in batch...")

    try:
        jobs = []
        for i, script in enumerate(scripts):
            job = generator.generate_video(
                script=script,
                avatar_id=avatar_id
            )
            jobs.append(job)
            print(f"  Job {i+1} created: {job['job_id']}")

        print(f"\n✓ {len(jobs)} jobs created")
        print("\nMonitoring progress...")

        # Monitor all jobs
        completed = 0
        while completed < len(jobs):
            print()
            for job in jobs:
                status = generator.get_job_status(job['job_id'])
                print(f"  {job['job_id']}: {status['progress']}% - {status['status']}")

                if status['status'] == 'completed' and job.get('completed') != True:
                    completed += 1
                    job['completed'] = True

            if completed < len(jobs):
                time.sleep(5)

        print(f"\n✓ All {len(jobs)} videos completed!")

    except Exception as e:
        print(f"\n✗ Error: {e}")


def example_6_custom_voice_and_settings():
    """Example 6: Generate video with custom voice and settings"""
    print("\n" + "=" * 60)
    print("Example 6: Custom Voice and Settings")
    print("=" * 60)

    from core.video_generator import generate_video

    script = """
    Welcome to our advanced AI avatar demonstration.
    This video showcases custom voice settings and enhanced video quality.
    Our platform provides complete control over the generation process.
    """

    avatar_id = "demo_avatar"
    voice_id = "your_custom_voice_id"  # Replace with actual voice ID

    video_settings = {
        "enhance_quality": True,
        "resolution": "1080p",
        "fps": 30,
    }

    print(f"\nScript: {script[:100]}...")
    print(f"Avatar: {avatar_id}")
    print(f"Voice: {voice_id}")
    print(f"Settings: {video_settings}")

    try:
        job = generate_video(
            script=script,
            avatar_id=avatar_id,
            voice_id=voice_id,
            video_settings=video_settings
        )

        print(f"\n✓ Job created: {job['job_id']}")
        print("Check status with: get_job_status(job_id)")

    except Exception as e:
        print(f"\n✗ Error: {e}")


def example_7_api_usage():
    """Example 7: Using the API with requests"""
    print("\n" + "=" * 60)
    print("Example 7: API Usage with Requests")
    print("=" * 60)

    print("\nPython code to use the API:")
    print("-" * 40)

    code = '''
import requests

# API endpoint
API_URL = "http://localhost:8000/api/v1"

# Generate video
response = requests.post(
    f"{API_URL}/generate",
    json={
        "script": "Hello from the API!",
        "avatar_id": "demo_avatar",
        "voice_id": None
    }
)

job = response.json()
print(f"Job ID: {job['job_id']}")

# Check status
import time
while True:
    response = requests.get(f"{API_URL}/status/{job['job_id']}")
    status = response.json()

    print(f"Progress: {status['progress']}%")

    if status['status'] == 'completed':
        print(f"Video ready: {status['video_path']}")
        break

    time.sleep(5)

# Download video
response = requests.get(f"{API_URL}/video/{job['job_id']}")
with open("output.mp4", "wb") as f:
    f.write(response.content)
'''

    print(code)

    print("\nCURL examples:")
    print("-" * 40)

    curl_examples = '''
# Generate video
curl -X POST http://localhost:8000/api/v1/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "script": "Hello from curl!",
    "avatar_id": "demo_avatar"
  }'

# Check status
curl http://localhost:8000/api/v1/status/JOB_ID

# List avatars
curl http://localhost:8000/api/v1/avatars

# List voices
curl http://localhost:8000/api/v1/voices

# Download video
curl -O http://localhost:8000/api/v1/video/JOB_ID
'''

    print(curl_examples)


def main():
    """Run all examples"""
    print("""
    AI Avatar Platform - Usage Examples
    ===================================

    These examples demonstrate various features of the platform.
    Uncomment the examples you want to run.

    Note: Make sure you have:
    1. Set ELEVENLABS_API_KEY in .env
    2. Created at least one avatar
    3. Started the API server (for API examples)
    """)

    # Uncomment the examples you want to run:

    # example_1_generate_simple_video()
    # example_2_train_avatar()
    # example_3_clone_voice()
    example_4_list_avatars_and_voices()
    # example_5_batch_generation()
    # example_6_custom_voice_and_settings()
    example_7_api_usage()

    print("\n" + "=" * 60)
    print("Examples completed!")
    print("=" * 60)
    print("\nFor more information, see:")
    print("  - README.md for full documentation")
    print("  - QUICKSTART.md for quick start guide")
    print("  - API docs at http://localhost:8000/docs")


if __name__ == "__main__":
    main()
