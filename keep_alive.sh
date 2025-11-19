#!/bin/bash

# Keep Alive Monitoring for 12 Claude Terminals
# Presses Enter every 2 seconds in all terminals

echo "🔄 Starting keep-alive monitoring for 12 terminals"
echo "⏱️  Will run for 30 minutes (or Ctrl+C to stop)"
echo "Press Enter every 2 seconds to keep Claude sessions alive..."
echo ""

DURATION=1800  # 30 minutes in seconds
COUNT=0

while [ $COUNT -lt $DURATION ]; do
    # Send Enter to each of the 12 terminal windows
    for i in {1..12}; do
        osascript -e "
            tell application \"Terminal\"
                if (count of windows) >= $i then
                    do script \"\" in window $i
                end if
            end tell
        " 2>/dev/null
    done

    COUNT=$((COUNT + 2))
    ELAPSED=$((COUNT / 60))

    if [ $((COUNT % 60)) -eq 0 ]; then
        echo "✅ Keep-alive active: ${ELAPSED} minutes elapsed"
    fi

    sleep 2
done

echo ""
echo "✅ Keep-alive monitoring complete (30 minutes)"
