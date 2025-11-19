#!/bin/bash

# Simple launcher for Multi-Agent Orchestrator
# Provides menu-based selection of launch modes

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║      MULTI-AGENT ORCHESTRATOR - AI AVATAR PLATFORM BUILDER      ║
║                                                                  ║
║           Building HeyGen Competitor with 12 Parallel Agents     ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${YELLOW}Select Launch Mode:${NC}"
echo ""
echo -e "  ${GREEN}1${NC} - Full Quad Terminal Mode (tmux) ${CYAN}[Recommended]${NC}"
echo -e "      └─ 12 agents across 4 terminal windows"
echo ""
echo -e "  ${GREEN}2${NC} - Orchestrator Only (Python)"
echo -e "      └─ Single process, background agents"
echo ""
echo -e "  ${GREEN}3${NC} - Dashboard View"
echo -e "      └─ Real-time monitoring interface"
echo ""
echo -e "  ${GREEN}4${NC} - With Keep-Alive Monitor"
echo -e "      └─ Orchestrator + auto-restart"
echo ""
echo -e "  ${GREEN}5${NC} - Quick Demo (Simulated)"
echo -e "      └─ Fast simulation of build process"
echo ""
echo -e "  ${GREEN}6${NC} - Status Check"
echo -e "      └─ Check running sessions"
echo ""
echo -e "  ${GREEN}7${NC} - Stop All Sessions"
echo -e "      └─ Clean shutdown"
echo ""
echo -e "  ${GREEN}8${NC} - View Logs"
echo -e "      └─ Tail all orchestrator logs"
echo ""
echo -e "  ${RED}0${NC} - Exit"
echo ""
echo -ne "${YELLOW}Enter your choice [0-8]:${NC} "
read choice

case $choice in
    1)
        echo ""
        echo -e "${GREEN}🚀 Launching Quad Terminal Mode...${NC}"
        echo ""
        ./quad_terminal_launcher.sh
        ;;

    2)
        echo ""
        echo -e "${GREEN}🚀 Launching Orchestrator...${NC}"
        echo ""

        # Create logs directory
        mkdir -p logs

        # Run orchestrator
        python orchestrator.py
        ;;

    3)
        echo ""
        echo -e "${GREEN}📊 Launching Dashboard...${NC}"
        echo -e "${CYAN}(Press 'q' to quit)${NC}"
        echo ""
        sleep 2
        python dashboard.py
        ;;

    4)
        echo ""
        echo -e "${GREEN}🚀 Launching with Keep-Alive Monitor...${NC}"
        echo ""

        # Create logs directory
        mkdir -p logs pids

        # Start keep-alive in background
        python keep_alive_monitor.py &
        KEEPALIVE_PID=$!
        echo $KEEPALIVE_PID > pids/keep_alive.pid

        echo -e "${CYAN}Keep-Alive Monitor started (PID: $KEEPALIVE_PID)${NC}"
        sleep 2

        # Start orchestrator
        python orchestrator.py

        # Cleanup
        kill $KEEPALIVE_PID 2>/dev/null || true
        ;;

    5)
        echo ""
        echo -e "${GREEN}🎬 Running Quick Demo...${NC}"
        echo ""

        # Create a quick demo version
        cat > /tmp/quick_demo.py << 'DEMO'
import asyncio
import sys

async def demo():
    agents = [
        "Core-Setup-Agent",
        "Voice-Synthesis-Agent",
        "Lip-Sync-Agent",
        "Avatar-Training-Agent",
        "Video-Generator-Agent",
        "API-Backend-Agent"
    ]

    print("\n" + "="*60)
    print("  QUICK DEMO - Multi-Agent Orchestrator")
    print("="*60 + "\n")

    for i, agent in enumerate(agents):
        print(f"✓ Launching {agent}...")
        await asyncio.sleep(0.5)

    print("\n📊 Build Progress:\n")

    tasks = [
        "Project Structure Setup",
        "Environment Configuration",
        "Voice Synthesis Engine",
        "Lip Sync Engine",
        "Video Generator",
        "API Backend"
    ]

    for task in tasks:
        print(f"  ▶ {task}...", end="", flush=True)
        await asyncio.sleep(1)
        print(" ✅ Done")

    print("\n" + "="*60)
    print("  ✅ Demo Complete!")
    print("="*60 + "\n")

asyncio.run(demo())
DEMO

        python /tmp/quick_demo.py
        rm /tmp/quick_demo.py

        echo ""
        echo -e "${YELLOW}Press Enter to continue...${NC}"
        read
        ;;

    6)
        echo ""
        echo -e "${CYAN}📡 Checking Status...${NC}"
        echo ""

        # Check tmux sessions
        if tmux has-session -t orchestrator 2>/dev/null; then
            echo -e "${GREEN}✓ tmux session 'orchestrator' is running${NC}"
            echo ""
            echo -e "${CYAN}Windows:${NC}"
            tmux list-windows -t orchestrator
            echo ""
            echo -e "${YELLOW}To attach: tmux attach -t orchestrator${NC}"
        else
            echo -e "${RED}✗ No tmux session found${NC}"
        fi

        echo ""

        # Check for running Python processes
        if pgrep -f "orchestrator.py" > /dev/null; then
            echo -e "${GREEN}✓ orchestrator.py is running${NC}"
            ps aux | grep "[o]rchestrator.py"
        else
            echo -e "${RED}✗ orchestrator.py not running${NC}"
        fi

        echo ""

        # Check logs
        if [ -d "logs" ]; then
            echo -e "${CYAN}Recent logs:${NC}"
            ls -lht logs/ | head -6
        fi

        echo ""
        echo -e "${YELLOW}Press Enter to continue...${NC}"
        read
        ;;

    7)
        echo ""
        echo -e "${RED}🛑 Stopping All Sessions...${NC}"
        echo ""

        # Kill tmux session
        if tmux has-session -t orchestrator 2>/dev/null; then
            tmux kill-session -t orchestrator
            echo -e "${GREEN}✓ Killed tmux session 'orchestrator'${NC}"
        fi

        # Kill Python processes
        pkill -f "orchestrator.py" 2>/dev/null && echo -e "${GREEN}✓ Stopped orchestrator.py${NC}" || true
        pkill -f "keep_alive_monitor.py" 2>/dev/null && echo -e "${GREEN}✓ Stopped keep_alive_monitor.py${NC}" || true
        pkill -f "agent_worker.py" 2>/dev/null && echo -e "${GREEN}✓ Stopped agent workers${NC}" || true

        # Clean PIDs
        rm -f pids/*.pid 2>/dev/null

        echo ""
        echo -e "${GREEN}✅ All sessions stopped${NC}"
        ;;

    8)
        echo ""
        echo -e "${CYAN}📋 Viewing Logs...${NC}"
        echo -e "${YELLOW}(Press Ctrl+C to exit)${NC}"
        echo ""
        sleep 2

        if [ -d "logs" ] && [ "$(ls -A logs/)" ]; then
            tail -f logs/*.log
        else
            echo -e "${RED}No logs found${NC}"
            echo ""
            echo -e "${YELLOW}Press Enter to continue...${NC}"
            read
        fi
        ;;

    0)
        echo ""
        echo -e "${CYAN}👋 Goodbye!${NC}"
        echo ""
        exit 0
        ;;

    *)
        echo ""
        echo -e "${RED}Invalid choice. Please select 0-8.${NC}"
        sleep 2
        exec "$0"
        ;;
esac
