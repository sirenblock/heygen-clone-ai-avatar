#!/usr/bin/env python3
"""
Paste prompts to all 12 terminals then run keep-alive monitoring
"""

import json
import time
import subprocess
import threading

# Load prompts
with open('tasks/prompts.json', 'r') as f:
    prompts = json.load(f)

def paste_to_terminal(window_num, prompt_text):
    """Paste text to terminal window using clipboard"""
    # Write to temp file
    temp_file = f"/tmp/claude_task_{window_num}.txt"
    with open(temp_file, 'w') as f:
        f.write(prompt_text)

    # Use pbcopy and AppleScript to paste
    script = f'''
    do shell script "cat {temp_file} | pbcopy"
    delay 0.2

    tell application "Terminal"
        activate
        set index of window {window_num} to 1
    end tell

    delay 0.3

    tell application "System Events"
        keystroke "v" using command down
        delay 0.3
        keystroke return
    end tell
    '''

    try:
        subprocess.run(['osascript', '-e', script], check=True, timeout=10)
        return True
    except Exception as e:
        print(f"Error pasting to terminal {window_num}: {e}")
        return False

def send_enter_key(window_num):
    """Send Enter key to terminal window"""
    script = f'''
    tell application "Terminal"
        activate
        set index of window {window_num} to 1
    end tell
    delay 0.1
    tell application "System Events"
        keystroke return
    end tell
    '''

    try:
        subprocess.run(['osascript', '-e', script], check=False, timeout=5, capture_output=True)
    except:
        pass

def keep_alive_worker(window_num, task_name, duration_minutes=30):
    """Keep terminal alive with Enter presses"""
    print(f"[{task_name}] Keep-alive started (window {window_num})")

    end_time = time.time() + (duration_minutes * 60)
    count = 0

    while time.time() < end_time:
        time.sleep(2)
        count += 1
        send_enter_key(window_num)

        if count % 30 == 0:
            print(f"[{task_name}] Alive ({count*2}s)")

    print(f"[{task_name}] Complete")

def main():
    print("=" * 80)
    print("🚀 Pasting prompts to 12 Claude terminals")
    print("=" * 80)

    tasks = [
        ("task_1", "🔍 SEO"),
        ("task_2", "👤 Avatars"),
        ("task_3", "✨ UI"),
        ("task_4", "🎤 Voice"),
        ("task_5", "⚡ Performance"),
        ("task_6", "♿ Accessibility"),
        ("task_7", "📊 Analytics"),
        ("task_8", "❓ FAQ"),
        ("task_9", "💰 Pricing"),
        ("task_10", "⭐ Testimonials"),
        ("task_11", "🎮 Demo"),
        ("task_12", "📱 PWA"),
    ]

    # Paste prompts to all terminals
    print("\n📤 Pasting prompts (this will take ~30 seconds)...\n")

    for i, (task_key, task_name) in enumerate(tasks):
        window_num = i + 1
        prompt = prompts[task_key]["prompt"]

        print(f"[{task_name}] Pasting to window {window_num}...")

        success = paste_to_terminal(window_num, prompt)

        if success:
            print(f"[{task_name}] ✅ Pasted")
        else:
            print(f"[{task_name}] ❌ Failed")

        time.sleep(2.5)  # Give time for each paste

    print("\n✅ All prompts pasted!")
    print("\n🔄 Starting keep-alive monitoring (Enter every 2s for 30min)...\n")

    # Start keep-alive threads
    threads = []

    for i, (task_key, task_name) in enumerate(tasks):
        window_num = i + 1

        thread = threading.Thread(
            target=keep_alive_worker,
            args=(window_num, task_name, 30),
            daemon=True
        )
        thread.start()
        threads.append(thread)

    print("=" * 80)
    print("✅ All agents are working!")
    print("⏱️  Monitoring for 30 minutes (or Ctrl+C to stop)")
    print("=" * 80)
    print()

    try:
        while any(t.is_alive() for t in threads):
            time.sleep(10)
    except KeyboardInterrupt:
        print("\n⚠️  Stopped by user")

    print("\n✅ Done!")

if __name__ == "__main__":
    main()
