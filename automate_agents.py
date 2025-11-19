#!/usr/bin/env python3
"""
Automate 12 Claude Agents with Task Prompts and Keep-Alive
Sends prompts to each terminal and keeps them alive with periodic Enter key presses
"""

import json
import time
import subprocess
import threading
from datetime import datetime

# Load prompts
with open('tasks/prompts.json', 'r') as f:
    prompts = json.load(f)

# Terminal automation using AppleScript
def send_to_terminal(window_index, text, press_enter=True):
    """Send text to a specific Terminal window"""
    # AppleScript to send text to terminal window
    script = f'''
    tell application "Terminal"
        tell window {window_index}
            do script "{text}" in selected tab
        end tell
    end tell
    '''

    if press_enter:
        # Send the text followed by Enter
        escaped_text = text.replace('"', '\\"').replace('\\', '\\\\')
        script = f'''
        tell application "Terminal"
            set windowCount to count of windows
            if windowCount >= {window_index} then
                tell window {window_index}
                    set selected tab to tab 1
                end tell
                tell application "System Events"
                    tell process "Terminal"
                        keystroke "{escaped_text}"
                        keystroke return
                    end tell
                end tell
            end if
        end tell
        '''

    try:
        subprocess.run(['osascript', '-e', script], check=True)
        return True
    except Exception as e:
        print(f"Error sending to terminal {window_index}: {e}")
        return False

def send_enter_to_terminal(window_index):
    """Send Enter key to keep session alive"""
    script = f'''
    tell application "Terminal"
        set windowCount to count of windows
        if windowCount >= {window_index} then
            tell application "System Events"
                tell process "Terminal"
                    set frontmost to true
                    tell window {window_index}
                        keystroke return
                    end tell
                end tell
            end tell
        end if
    end tell
    '''

    try:
        subprocess.run(['osascript', '-e', script], check=True, capture_output=True)
        return True
    except Exception as e:
        return False

def keep_alive_monitor(window_index, task_name, duration_minutes=30):
    """Keep terminal alive by pressing Enter every 2 seconds"""
    print(f"[{task_name}] Keep-alive started for window {window_index}")

    end_time = time.time() + (duration_minutes * 60)
    iteration = 0

    while time.time() < end_time:
        time.sleep(2)  # Wait 2 seconds
        iteration += 1

        success = send_enter_to_terminal(window_index)

        if iteration % 30 == 0:  # Log every minute
            elapsed = iteration * 2
            print(f"[{task_name}] Keep-alive: {elapsed}s elapsed, window {window_index}")

    print(f"[{task_name}] Keep-alive completed for window {window_index}")

def main():
    print("=" * 80)
    print("🚀 12-Agent Claude Automation System")
    print("=" * 80)
    print()

    # Wait for terminals to be ready
    print("⏳ Waiting 5 seconds for all terminal windows to be ready...")
    time.sleep(5)

    # Get terminal window count
    check_script = '''
    tell application "Terminal"
        count of windows
    end tell
    '''

    result = subprocess.run(['osascript', '-e', check_script],
                          capture_output=True, text=True)
    window_count = int(result.stdout.strip())

    print(f"✅ Found {window_count} terminal windows")
    print()

    if window_count < 12:
        print(f"⚠️  Warning: Expected 12 windows, found {window_count}")
        print("Please run launch_12_agents.sh first!")
        return

    # Send prompts to each terminal (newest windows first)
    tasks = [
        ("task_1", "🔍 SEO Optimization"),
        ("task_2", "👤 Stock Avatars"),
        ("task_3", "✨ UI Components"),
        ("task_4", "🎤 Voice Samples"),
        ("task_5", "⚡ Performance"),
        ("task_6", "♿ Accessibility"),
        ("task_7", "📊 Analytics"),
        ("task_8", "❓ FAQ"),
        ("task_9", "💰 Pricing"),
        ("task_10", "⭐ Testimonials"),
        ("task_11", "🎮 Demo"),
        ("task_12", "📱 PWA"),
    ]

    threads = []

    print("📤 Sending prompts to all agents...")
    print()

    for i, (task_key, task_name) in enumerate(tasks):
        window_index = i + 1  # Terminal windows are 1-indexed
        prompt = prompts[task_key]["prompt"]

        print(f"[{task_name}] Sending to window {window_index}...")

        # Send prompt to terminal
        # Use simple echo approach since direct keystroke can be complex
        escaped_prompt = prompt.replace("'", "'\\''")
        send_cmd = f"echo '{escaped_prompt}' && sleep 0.5"

        # Actually, let's write to a temp file and paste
        temp_file = f"/tmp/claude_task_{i+1}.txt"
        with open(temp_file, 'w') as f:
            f.write(prompt)

        # Copy to clipboard and paste (more reliable)
        subprocess.run(['osascript', '-e', f'''
            tell application "Terminal"
                activate
                set frontmost to true
                set selected of window {window_index} to true
            end tell

            do shell script "cat {temp_file} | pbcopy"

            tell application "System Events"
                tell process "Terminal"
                    keystroke "v" using command down
                    delay 0.3
                    keystroke return
                end tell
            end tell
        '''])

        time.sleep(1)

        # Start keep-alive thread for this terminal
        thread = threading.Thread(
            target=keep_alive_monitor,
            args=(window_index, task_name, 30),  # 30 minute timeout
            daemon=True
        )
        thread.start()
        threads.append(thread)

        print(f"[{task_name}] ✅ Prompt sent, keep-alive started")
        time.sleep(2)  # Stagger the sends

    print()
    print("=" * 80)
    print("✅ All 12 agents have been sent their prompts!")
    print("🔄 Keep-alive monitoring active (Enter every 2 seconds)")
    print("⏱️  Will monitor for 30 minutes or until Ctrl+C")
    print("=" * 80)
    print()

    # Monitor all threads
    try:
        while any(t.is_alive() for t in threads):
            time.sleep(10)
            alive_count = sum(1 for t in threads if t.is_alive())
            print(f"📊 Status: {alive_count}/12 agents still being monitored")
    except KeyboardInterrupt:
        print()
        print("⚠️  Interrupted by user. Stopping keep-alive monitoring...")
        print("The Claude agents will continue running in their terminals.")

    print()
    print("✅ Automation complete!")

if __name__ == "__main__":
    main()
