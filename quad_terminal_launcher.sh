#!/bin/bash

# Quad Terminal Launcher for Multi-Agent Orchestrator
# Launches 12 agents in quad-terminal layout with keep-alive

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NUM_AGENTS=12
PANE_LAYOUT="quad"  # quad terminal layout
LOG_DIR="logs"
PID_DIR="pids"

# Create necessary directories
mkdir -p "$LOG_DIR"
mkdir -p "$PID_DIR"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║    Multi-Agent Orchestrator - Quad Terminal Launcher     ║${NC}"
echo -e "${GREEN}║              AI Avatar Platform Builder                    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}❌ tmux is not installed. Installing...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install tmux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y tmux
    fi
fi

# Agent names
AGENTS=(
    "Core-Setup-Agent"
    "Voice-Synthesis-Agent"
    "Lip-Sync-Agent"
    "Avatar-Training-Agent"
    "Video-Generator-Agent"
    "API-Backend-Agent"
    "Model-Integration-Agent"
    "Config-Manager-Agent"
    "Docker-Deploy-Agent"
    "Testing-QA-Agent"
    "Documentation-Agent"
    "Monitor-Health-Agent"
)

# Kill existing session if it exists
tmux kill-session -t orchestrator 2>/dev/null || true

echo -e "${YELLOW}🚀 Starting Multi-Agent Orchestrator...${NC}"
echo ""

# Create new tmux session
tmux new-session -d -s orchestrator -n "orchestrator"

# Create quad layout (2x2 grid for first 4 agents, then additional panes)
# First window: Agents 0-3
tmux split-window -h -t orchestrator:0
tmux split-window -v -t orchestrator:0.0
tmux split-window -v -t orchestrator:0.1

# Second window: Agents 4-7
tmux new-window -t orchestrator:1 -n "agents-4-7"
tmux split-window -h -t orchestrator:1
tmux split-window -v -t orchestrator:1.0
tmux split-window -v -t orchestrator:1.1

# Third window: Agents 8-11
tmux new-window -t orchestrator:2 -n "agents-8-11"
tmux split-window -h -t orchestrator:2
tmux split-window -v -t orchestrator:2.0
tmux split-window -v -t orchestrator:2.1

# Launch agents in each pane
echo -e "${CYAN}📡 Launching agents...${NC}"

for i in {0..3}; do
    agent_name="${AGENTS[$i]}"
    echo -e "  ${GREEN}✓${NC} Launching ${agent_name}"
    tmux send-keys -t "orchestrator:0.$i" "python agent_worker.py $i $agent_name" C-m
done

for i in {4..7}; do
    pane_idx=$((i - 4))
    agent_name="${AGENTS[$i]}"
    echo -e "  ${GREEN}✓${NC} Launching ${agent_name}"
    tmux send-keys -t "orchestrator:1.$pane_idx" "python agent_worker.py $i $agent_name" C-m
done

for i in {8..11}; do
    pane_idx=$((i - 8))
    agent_name="${AGENTS[$i]}"
    echo -e "  ${GREEN}✓${NC} Launching ${agent_name}"
    tmux send-keys -t "orchestrator:2.$pane_idx" "python agent_worker.py $i $agent_name" C-m
done

# Create main orchestrator window
tmux new-window -t orchestrator:3 -n "main-orchestrator"
tmux send-keys -t "orchestrator:3" "python orchestrator.py" C-m

# Create monitoring dashboard window
tmux new-window -t orchestrator:4 -n "dashboard"
tmux send-keys -t "orchestrator:4" "watch -n 1 'ls -lh logs/ && echo && tail -n 5 logs/*.log'" C-m

echo ""
echo -e "${GREEN}✅ All agents launched successfully!${NC}"
echo ""
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}📊 Orchestrator Session Info:${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo -e "  Session Name:  ${YELLOW}orchestrator${NC}"
echo -e "  Total Agents:  ${YELLOW}12${NC}"
echo -e "  Layout:        ${YELLOW}Quad Terminal (3 windows)${NC}"
echo -e "  Logs:          ${YELLOW}$LOG_DIR/${NC}"
echo ""
echo -e "${CYAN}🎯 Available Windows:${NC}"
echo -e "  ${YELLOW}0${NC} - Agents 0-3  (Core Setup, Voice, Lip-Sync, Avatar)"
echo -e "  ${YELLOW}1${NC} - Agents 4-7  (Video, API, Models, Config)"
echo -e "  ${YELLOW}2${NC} - Agents 8-11 (Docker, Testing, Docs, Monitor)"
echo -e "  ${YELLOW}3${NC} - Main Orchestrator"
echo -e "  ${YELLOW}4${NC} - Monitoring Dashboard"
echo ""
echo -e "${CYAN}⌨️  Commands:${NC}"
echo -e "  Attach:        ${YELLOW}tmux attach -t orchestrator${NC}"
echo -e "  Switch window: ${YELLOW}Ctrl+b <number>${NC}"
echo -e "  Detach:        ${YELLOW}Ctrl+b d${NC}"
echo -e "  Kill session:  ${YELLOW}tmux kill-session -t orchestrator${NC}"
echo ""
echo -e "${PURPLE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}🎬 Attaching to session in 2 seconds...${NC}"
sleep 2

# Attach to session
tmux attach -t orchestrator
