# Multi-Agent Orchestrator for AI Avatar Platform

A sophisticated multi-agent orchestration system that builds the complete AI Avatar Platform (HeyGen competitor) using 12 parallel agents running in quad-terminal layout.

## Overview

This orchestrator coordinates 12 specialized agents to build all components of the AI Avatar Platform simultaneously:

```
┌─────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT ORCHESTRATOR                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Agent 0   │  │   Agent 1   │  │   Agent 2   │            │
│  │ Core Setup  │  │    Voice    │  │  Lip Sync   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Agent 3   │  │   Agent 4   │  │   Agent 5   │            │
│  │   Avatar    │  │    Video    │  │     API     │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Agent 6   │  │   Agent 7   │  │   Agent 8   │            │
│  │   Models    │  │   Config    │  │   Docker    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Agent 9   │  │  Agent 10   │  │  Agent 11   │            │
│  │   Testing   │  │    Docs     │  │  Monitor    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### Core Capabilities
- **12 Parallel Agents**: Simultaneous execution of independent tasks
- **Quad Terminal Layout**: Visual monitoring across multiple terminal panes
- **Keep-Alive System**: Automatic restart of failed agents
- **Health Monitoring**: Real-time status tracking and alerting
- **Task Orchestration**: Dependency-based task scheduling
- **Live Dashboard**: Real-time visual monitoring interface

### Agent Specializations

| Agent ID | Name | Responsibility |
|----------|------|----------------|
| 0 | Core-Setup-Agent | Project structure, environment setup |
| 1 | Voice-Synthesis-Agent | ElevenLabs integration, TTS |
| 2 | Lip-Sync-Agent | Wav2Lip model, face detection |
| 3 | Avatar-Training-Agent | Avatar processing, metadata |
| 4 | Video-Generator-Agent | Pipeline orchestration |
| 5 | API-Backend-Agent | FastAPI endpoints, authentication |
| 6 | Model-Integration-Agent | Neural network integration |
| 7 | Config-Manager-Agent | Settings, configuration |
| 8 | Docker-Deploy-Agent | Containerization, deployment |
| 9 | Testing-QA-Agent | Test suite, validation |
| 10 | Documentation-Agent | README, guides, docs |
| 11 | Monitor-Health-Agent | System monitoring |

## Installation

### Prerequisites

```bash
# Python 3.9+
python --version

# tmux (for quad terminal layout)
brew install tmux  # macOS
sudo apt-get install tmux  # Linux

# Optional: psutil for system monitoring
pip install psutil
```

### Setup

```bash
# Clone or navigate to project directory
cd "heygen clone"

# Install Python dependencies
pip install asyncio psutil

# Make launcher executable
chmod +x quad_terminal_launcher.sh
```

## Usage

### Quick Start

```bash
# Launch all 12 agents in quad-terminal layout
./quad_terminal_launcher.sh
```

### Alternative: Python-only Mode

```bash
# Run orchestrator directly (no quad terminals)
python orchestrator.py

# Run with dashboard
python dashboard.py
```

### With Keep-Alive Monitor

```bash
# Run orchestrator with automatic agent restart
python keep_alive_monitor.py &
python orchestrator.py
```

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                    orchestrator.py                      │
│           Main coordination and task scheduling         │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│ agent_worker.py │    │ keep_alive_      │
│  (12 instances) │    │   monitor.py     │
└─────────────────┘    └──────────────────┘
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
            ┌──────────────┐
            │ dashboard.py │
            │  (optional)  │
            └──────────────┘
```

### Task Flow

```
1. Orchestrator initializes 20 build tasks
2. Tasks organized with dependency graph
3. Available tasks assigned to idle agents
4. Agents execute tasks independently
5. Completed tasks unlock dependent tasks
6. Keep-alive monitor ensures agent health
7. Dashboard provides real-time visibility
```

### Task Dependencies

```
T001: Project Structure
  ↓
T002: Environment Config
  ↓
T003: Settings Module
  ↓
T004: Voice Synthesis ─┐
T005: Lip Sync Engine ─┼─→ T007: Video Generator
T006: Avatar Trainer  ─┘
  ↓
T010: API Backend
  ↓
T011: Authentication
```

## Configuration

### Environment Variables

Create a `.env` file:

```bash
# Logging
LOG_LEVEL=INFO
LOG_DIR=logs

# Orchestrator
NUM_AGENTS=12
CHECK_INTERVAL=10

# Keep-Alive
MAX_RESTARTS=5
HEARTBEAT_TIMEOUT=30
```

### Agent Configuration

Edit `orchestrator.py` to customize:

```python
# Number of agents
orchestrator = MultiAgentOrchestrator(num_agents=12)

# Task definitions
tasks_config = [
    {
        "id": "T001",
        "name": "Your Task",
        "component": "your_component",
        "dependencies": []
    }
]
```

## Monitoring

### Dashboard View

Launch the dashboard for real-time monitoring:

```bash
python dashboard.py
```

Features:
- Agent status grid (12 agents)
- Build progress bars
- Recent activity logs
- System statistics
- Live updates every 2 seconds

### Log Files

```
logs/
├── orchestrator.log       # Main orchestrator
├── keep_alive.log         # Keep-alive monitor
├── alerts.log             # System alerts
├── Core-Setup-Agent.log   # Agent 0
├── Voice-Synthesis-Agent.log  # Agent 1
└── ...                    # Other agents
```

### Health Checks

Monitor agent health:

```bash
# View all logs
tail -f logs/*.log

# Check specific agent
tail -f logs/Voice-Synthesis-Agent.log

# Monitor orchestrator
tail -f logs/orchestrator.log
```

## tmux Commands

### Session Management

```bash
# Attach to running session
tmux attach -t orchestrator

# Detach from session
Ctrl+b d

# Kill session
tmux kill-session -t orchestrator

# List sessions
tmux list-sessions
```

### Window Navigation

```bash
# Switch to window 0 (Agents 0-3)
Ctrl+b 0

# Switch to window 1 (Agents 4-7)
Ctrl+b 1

# Switch to window 2 (Agents 8-11)
Ctrl+b 2

# Switch to window 3 (Orchestrator)
Ctrl+b 3

# Switch to window 4 (Dashboard)
Ctrl+b 4

# Next window
Ctrl+b n

# Previous window
Ctrl+b p
```

### Pane Navigation

```bash
# Move between panes
Ctrl+b ↑/↓/←/→

# Zoom pane (fullscreen)
Ctrl+b z

# Close pane
Ctrl+b x
```

## Troubleshooting

### Agent Won't Start

```bash
# Check if Python is installed
python --version

# Check if agent_worker.py exists
ls -la agent_worker.py

# Run agent manually
python agent_worker.py 0 Core-Setup-Agent
```

### tmux Session Issues

```bash
# Kill existing session
tmux kill-session -t orchestrator

# Restart launcher
./quad_terminal_launcher.sh
```

### Keep-Alive Not Restarting Agents

```bash
# Check keep-alive monitor logs
tail -f logs/keep_alive.log

# Verify max_restarts not exceeded
grep "exceeded max restarts" logs/keep_alive.log

# Manually restart keep-alive
python keep_alive_monitor.py
```

### Dashboard Not Updating

```bash
# Check if curses is available
python -c "import curses; print('OK')"

# Run dashboard with debug
python dashboard.py 2>&1 | tee dashboard_debug.log
```

## Development

### Adding New Agents

Edit `orchestrator.py`:

```python
def initialize_agents(self):
    agent_names = [
        "Core-Setup-Agent",
        "Your-New-Agent",  # Add here
        # ...
    ]
```

### Adding New Tasks

```python
def initialize_tasks(self):
    tasks_config = [
        {
            "id": "T999",
            "name": "Your New Task",
            "description": "Task description",
            "component": "your_component",
            "dependencies": ["T001"]  # Tasks that must complete first
        }
    ]
```

### Custom Task Handlers

Edit `agent_worker.py`:

```python
async def handle_your_component_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
    """Handle your custom component tasks"""
    self.logger.info("Building your component...")

    # Your implementation here

    return {
        "module": "path/to/module.py",
        "status": "created"
    }
```

## Performance

### Expected Timings

- **Orchestrator startup**: 2-3 seconds
- **Agent initialization**: 1 second per agent
- **Average task duration**: 3-5 seconds
- **Total build time**: 2-4 minutes (with parallelization)
- **Sequential build time**: 10-15 minutes (for comparison)

### Resource Usage

- **CPU**: 5-20% (mostly idle, spikes during task execution)
- **Memory**: ~200-500 MB total (all agents)
- **Disk I/O**: Minimal (logging only)

## Production Considerations

### Scaling

To handle larger builds:

```python
# Increase agents
orchestrator = MultiAgentOrchestrator(num_agents=24)

# Adjust task parallelism
# Edit task dependencies for more parallel execution
```

### Cloud Deployment

```bash
# Deploy on cloud instance
ssh your-server
git clone your-repo
cd heygen-clone
./quad_terminal_launcher.sh
```

### CI/CD Integration

```yaml
# .github/workflows/build.yml
- name: Run Orchestrator
  run: |
    python orchestrator.py
    # Check exit code for success/failure
```

## License

MIT License - See main project README

## Support

For issues or questions:
- Check logs in `logs/` directory
- Review orchestrator.log for errors
- Open issue with log excerpts
