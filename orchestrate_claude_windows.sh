#!/bin/bash

# CLAUDE WINDOWS ORCHESTRATOR
# Pastes tasks into open Claude windows and starts keep-alive

set -e

WORK_DIR="/Users/lsd/msclaude/projects/heygen clone"
PROMPTS_JSON="$WORK_DIR/tasks/prompts.json"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         CLAUDE WINDOWS ORCHESTRATOR - Task Dispatcher          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if prompts.json exists
if [ ! -f "$PROMPTS_JSON" ]; then
    echo "❌ No prompts.json found at $PROMPTS_JSON"
    exit 1
fi

echo "📋 Found prompts file"
echo ""
echo "🔍 Detecting open Terminal windows..."
echo ""

# Get all Terminal window IDs
WINDOW_IDS=$(osascript <<'APPLESCRIPT'
tell application "Terminal"
    set windowList to {}
    repeat with w in windows
        set end of windowList to id of w
    end repeat
    return windowList
end tell
APPLESCRIPT
)

# Convert to array
IFS=',' read -ra WINDOW_ID_ARRAY <<< "$WINDOW_IDS"

# Count windows
WINDOW_COUNT=${#WINDOW_ID_ARRAY[@]}

if [ $WINDOW_COUNT -lt 12 ]; then
    echo "⚠️  Warning: Found only $WINDOW_COUNT windows, expected 12"
    echo "   Proceeding with available windows..."
fi

echo "✓ Found $WINDOW_COUNT Terminal windows"
echo ""
echo "📤 Step 1: Extracting task prompts..."
echo ""

# Create temp directory
TEMP_DIR="$WORK_DIR/.orchestrator"
mkdir -p "$TEMP_DIR/prompts"

# Extract prompts using Python
python3 <<PYTHON_SCRIPT
import json
import sys

try:
    with open('$PROMPTS_JSON', 'r') as f:
        data = json.load(f)

    task_keys = [f'task_{i}' for i in range(1, 13)]

    for i, task_key in enumerate(task_keys, 1):
        if task_key in data:
            task = data[task_key]
            prompt = task.get('prompt', '')
            title = task.get('title', f'Task {i}')

            # Save to individual file
            with open(f'$TEMP_DIR/prompts/{i}.txt', 'w') as pf:
                pf.write(prompt)

            print(f"  ✓ Task {i}: {title}")
        else:
            print(f"  ⚠️  Task {i}: Not found in prompts.json", file=sys.stderr)

except Exception as e:
    print(f"❌ Error: {e}", file=sys.stderr)
    sys.exit(1)
PYTHON_SCRIPT

if [ $? -ne 0 ]; then
    echo "❌ Failed to extract prompts"
    exit 1
fi

echo ""
echo "🚀 Step 2: Pasting prompts into Claude windows..."
echo ""

# Paste each prompt into corresponding window
for i in {1..12}; do
    PROMPT_FILE="$TEMP_DIR/prompts/${i}.txt"

    if [ ! -f "$PROMPT_FILE" ]; then
        echo "  [$i/12] ⚠️  No prompt file found, skipping"
        continue
    fi

    # Get corresponding window ID (adjust index)
    WINDOW_INDEX=$((i - 1))
    if [ $WINDOW_INDEX -ge $WINDOW_COUNT ]; then
        echo "  [$i/12] ⚠️  No window available, skipping"
        continue
    fi

    WINDOW_ID=${WINDOW_ID_ARRAY[$WINDOW_INDEX]}

    echo "  [$i/12] Pasting task $i into window $WINDOW_ID..."

    # Paste using osascript
    osascript <<APPLESCRIPT
tell application "Terminal"
    activate
    set index of window id $WINDOW_ID to 1
    delay 0.5

    set promptText to do shell script "cat '$PROMPT_FILE'"
    do script promptText in window id $WINDOW_ID
    delay 0.3
    do script "" in window id $WINDOW_ID
end tell
APPLESCRIPT

    echo "    ✓ Pasted"
    sleep 1
done

echo ""
echo "⚡ Step 3: Creating keep-alive monitor..."
echo ""

# Create keep-alive script
cat > "$WORK_DIR/keep-alive-orchestrator.sh" <<'KEEPALIVE_SCRIPT'
#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              KEEP-ALIVE MONITOR - Claude Windows               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "🔄 Monitor Active"
echo "   Pressing Enter every 2 seconds in all Claude windows"
echo "   Press Ctrl+C to stop"
echo ""

# Get all window IDs
WINDOWS=$(osascript <<'GETWINDOWS'
tell application "Terminal"
    set windowList to {}
    repeat with w in windows
        set end of windowList to id of w
    end repeat
    return windowList
end tell
GETWINDOWS
)

IFS=',' read -ra WINDOW_ARRAY <<< "$WINDOWS"
COUNTER=1

while true; do
    echo "[$COUNTER] Keeping ${#WINDOW_ARRAY[@]} Claude windows alive..."

    for WINDOW_ID in "${WINDOW_ARRAY[@]}"; do
        osascript <<APPLESCRIPT 2>/dev/null
tell application "Terminal"
    try
        do script "" in window id $WINDOW_ID
    end try
end tell
APPLESCRIPT
    done

    sleep 2
    COUNTER=$((COUNTER + 1))
done
KEEPALIVE_SCRIPT

chmod +x "$WORK_DIR/keep-alive-orchestrator.sh"

echo "✓ Keep-alive script created"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  ORCHESTRATION COMPLETE                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Summary:"
echo "   • Tasks dispatched: 12"
echo "   • Windows used: $WINDOW_COUNT"
echo "   • Keep-alive ready: ✓"
echo ""
echo "🔧 To start keep-alive monitor:"
echo "   ./keep-alive-orchestrator.sh"
echo ""
echo "⏱️  Estimated completion: ~15-20 minutes"
echo ""
echo "🎉 All tasks are running in parallel!"
echo ""
