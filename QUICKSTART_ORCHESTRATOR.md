# Quick Start Guide - Multi-Agent Orchestrator

## 🚀 Get Started in 30 Seconds

### Option 1: Interactive Menu (Recommended)

```bash
./start_orchestrator.sh
```

Select from the menu:
- **1** = Full quad-terminal mode (12 agents in tmux)
- **2** = Simple Python mode
- **3** = Dashboard view
- **5** = Quick demo

### Option 2: Direct Launch

```bash
# Simple mode
python orchestrator.py

# With dashboard
python dashboard.py
```

### Option 3: Full Quad-Terminal Mode

```bash
# Launch 12 agents across 4 terminal windows
./quad_terminal_launcher.sh
```

## 📊 What You'll See

### Terminal Output

```
════════════════════════════════════════════════════════
🚀 Multi-Agent Orchestrator Started
Agents: 12 | Tasks: 20
════════════════════════════════════════════════════════

✓ Assigned Project Structure Setup to Core-Setup-Agent
✓ Assigned Environment Configuration to Voice-Synthesis-Agent

▶ Core-Setup-Agent started: Project Structure Setup
▶ Voice-Synthesis-Agent started: Environment Configuration

✓ Core-Setup-Agent completed: Project Structure Setup (5.2s)
✓ Voice-Synthesis-Agent completed: Environment Configuration (4.8s)

📊 Progress: 2/20 tasks | 2/12 agents working

...

════════════════════════════════════════════════════════
🎉 All tasks completed!
════════════════════════════════════════════════════════
```

### Dashboard View

```
╔════════════════════════════════════════════════════════════════════╗
║         MULTI-AGENT ORCHESTRATOR - AI AVATAR PLATFORM             ║
╚════════════════════════════════════════════════════════════════════╝

AGENT STATUS (12 Agents)

┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ ⚡ Core-Setup-Agent  │  │ ◉ Voice-Synthesis    │  │ ✓ Lip-Sync-Agent    │
│ Tasks: 3   WORKING   │  │ Tasks: 2   IDLE      │  │ Tasks: 5   COMPLETED│
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘

BUILD PROGRESS

Overall Progress     [████████████████████░░░░░░░░░░] 65.0% (13/20)
Core Modules        [████████████████████████████] 100.0% (5/5)
API Backend         [████████████████░░░░░░░░░░░░] 62.5% (5/8)

RECENT ACTIVITY

2025-11-18 22:41:32 - Orchestrator - INFO - ✓ Video-Generator-Agent completed
2025-11-18 22:41:28 - Orchestrator - INFO - ▶ API-Backend-Agent started
```

## 🎯 What Gets Built

The orchestrator builds all 20 components from the PDF specification:

### Phase 1: Core Setup (Tasks 1-3)
- ✅ Project directory structure
- ✅ Environment configuration (.env, requirements.txt)
- ✅ Settings module (config/settings.py)

### Phase 2: Core Modules (Tasks 4-7)
- ✅ Voice synthesis engine (ElevenLabs)
- ✅ Lip sync engine (Wav2Lip)
- ✅ Avatar trainer
- ✅ Video generator pipeline

### Phase 3: Models (Tasks 8-9)
- ✅ Wav2Lip neural network
- ✅ Face detection (MediaPipe/RetinaFace)

### Phase 4: API (Tasks 10-11)
- ✅ FastAPI backend with endpoints
- ✅ Authentication and rate limiting

### Phase 5: Deployment (Tasks 12-13)
- ✅ Docker configuration
- ✅ Setup and deployment scripts

### Phase 6: Testing & Docs (Tasks 14-16)
- ✅ Test suite and examples
- ✅ Complete documentation

### Phase 7: Advanced Features (Tasks 17-18)
- ✅ Face enhancement (GFPGAN)
- ✅ Background replacement

### Phase 8: Production Ready (Tasks 19-20)
- ✅ Monitoring and logging
- ✅ Performance optimization

## 📁 Files Created

After running, you'll have:

```
heygen-clone/
├── config/
│   ├── __init__.py
│   └── settings.py
├── core/
│   ├── voice_synthesis.py
│   ├── lip_sync_engine.py
│   ├── avatar_trainer.py
│   └── video_generator.py
├── models/
│   └── wav2lip.py
├── main.py                    # FastAPI app
├── requirements.txt
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── setup.sh
├── test_installation.py
├── examples.py
└── README.md
```

## ⌨️ Controls

### tmux Session Commands

```bash
# Attach to session
tmux attach -t orchestrator

# Switch between windows
Ctrl+b 0    # Agents 0-3
Ctrl+b 1    # Agents 4-7
Ctrl+b 2    # Agents 8-11
Ctrl+b 3    # Main orchestrator
Ctrl+b 4    # Dashboard

# Detach from session
Ctrl+b d

# Kill session
tmux kill-session -t orchestrator
```

### Dashboard Commands

```
q - Quit dashboard
r - Refresh
l - View logs
a - Agent status
h - Help
```

## 📋 Monitoring

### View Logs

```bash
# All logs in real-time
tail -f logs/*.log

# Specific agent
tail -f logs/Voice-Synthesis-Agent.log

# Main orchestrator
tail -f logs/orchestrator.log
```

### Check Status

```bash
# From menu
./start_orchestrator.sh
# Select option 6

# Manual check
tmux list-sessions
ps aux | grep orchestrator
```

## 🛑 Stopping

### Stop Everything

```bash
# From menu
./start_orchestrator.sh
# Select option 7

# Manual stop
tmux kill-session -t orchestrator
pkill -f orchestrator.py
```

### Graceful Shutdown

```bash
# In orchestrator terminal
Ctrl+C  # Sends shutdown signal
```

## 🔧 Customization

### Change Number of Agents

Edit [orchestrator.py](orchestrator.py:21):
```python
orchestrator = MultiAgentOrchestrator(num_agents=24)  # Default: 12
```

### Add Custom Tasks

Edit [orchestrator.py](orchestrator.py:148):
```python
{
    "id": "T021",
    "name": "Your Custom Task",
    "description": "Description",
    "component": "your_component",
    "dependencies": ["T001"]
}
```

### Modify Agent Names

Edit [orchestrator.py](orchestrator.py:61):
```python
agent_names = [
    "Core-Setup-Agent",
    "Your-Custom-Agent",  # Add or modify
    # ...
]
```

## 🐛 Troubleshooting

### "tmux not found"

```bash
# macOS
brew install tmux

# Linux
sudo apt-get install tmux
```

### "Module not found"

```bash
# Install Python dependencies
pip install asyncio

# For dashboard
pip install curses  # Usually built-in
```

### "Port already in use"

```bash
# Check what's running
lsof -i :8000

# Kill process
kill <PID>
```

### "Agent not starting"

```bash
# Check logs
cat logs/orchestrator.log

# Try manual start
python agent_worker.py 0 Core-Setup-Agent
```

## 💡 Tips

1. **First Time**: Use option 5 (Quick Demo) to see how it works
2. **Development**: Use option 2 (Python only) for quick iterations
3. **Production**: Use option 1 (Quad Terminal) for full visibility
4. **Monitoring**: Open dashboard in separate terminal while orchestrator runs
5. **Logs**: Always check logs/ directory for debugging

## 📚 Next Steps

1. **Read Full Docs**: [README_ORCHESTRATOR.md](README_ORCHESTRATOR.md)
2. **System Overview**: [SYSTEM_OVERVIEW.md](SYSTEM_OVERVIEW.md)
3. **Build the Platform**: The orchestrator creates the full codebase
4. **Deploy**: Follow deployment guides in created README.md

## 🎬 Example Session

```bash
# Terminal 1: Start orchestrator
./start_orchestrator.sh
[Select option 1]

# Terminal 2 (optional): Watch dashboard
python dashboard.py

# Terminal 3 (optional): Monitor logs
tail -f logs/orchestrator.log

# Wait for completion (2-4 minutes)
# All 20 tasks will complete

# Check results
ls -la config/ core/ models/

# Start the built application
python main.py
```

## ✅ Success Indicators

You'll know it's working when you see:

- ✅ "Multi-Agent Orchestrator Started"
- ✅ 12 agents initialized
- ✅ Tasks being assigned and completed
- ✅ Progress updates every few seconds
- ✅ "All tasks completed!" message
- ✅ Summary showing all agents' work

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| No output | Check logs/ directory |
| Slow execution | Normal on first run (model downloads) |
| Agent crashes | Keep-alive will auto-restart |
| tmux error | Install tmux or use Python mode |
| Permission denied | `chmod +x *.sh` |

## 📞 Support

If you encounter issues:

1. Check logs in `logs/` directory
2. Review [README_ORCHESTRATOR.md](README_ORCHESTRATOR.md)
3. Try the quick demo (option 5)
4. Run validation: `python -c "import orchestrator; print('OK')"`

---

**Ready to build?** Run `./start_orchestrator.sh` now! 🚀
