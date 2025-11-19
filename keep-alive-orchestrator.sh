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
