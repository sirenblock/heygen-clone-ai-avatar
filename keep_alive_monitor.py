"""
Keep-Alive Monitor for Multi-Agent Orchestrator
Ensures all agents stay running and automatically restarts failed agents
"""

import asyncio
import logging
import subprocess
import signal
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class AgentProcess:
    """Tracks an agent process"""
    id: int
    name: str
    process: Optional[subprocess.Popen] = None
    last_heartbeat: datetime = field(default_factory=datetime.now)
    restart_count: int = 0
    max_restarts: int = 5
    is_healthy: bool = True


class KeepAliveMonitor:
    """
    Monitors all agent processes and keeps them alive
    - Checks heartbeats
    - Restarts failed agents
    - Monitors resource usage
    - Sends alerts
    """

    def __init__(self, check_interval: int = 10):
        self.check_interval = check_interval
        self.agents: Dict[int, AgentProcess] = {}
        self.running = False
        self.setup_logging()

    def setup_logging(self):
        """Setup logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - KeepAlive - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('logs/keep_alive.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('KeepAliveMonitor')

    def register_agent(self, agent_id: int, agent_name: str, process: subprocess.Popen):
        """Register an agent for monitoring"""
        self.agents[agent_id] = AgentProcess(
            id=agent_id,
            name=agent_name,
            process=process
        )
        self.logger.info(f"✓ Registered {agent_name} for monitoring (PID: {process.pid})")

    async def check_process_health(self, agent: AgentProcess) -> bool:
        """Check if an agent process is healthy"""
        if not agent.process:
            return False

        # Check if process is still running
        poll = agent.process.poll()
        if poll is not None:
            self.logger.warning(f"⚠ {agent.name} process exited with code {poll}")
            return False

        # Check log file for recent activity
        log_file = Path(f"logs/{agent.name}.log")
        if log_file.exists():
            # Check if log has been modified recently
            mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
            time_since_update = datetime.now() - mtime

            if time_since_update > timedelta(seconds=30):
                self.logger.warning(f"⚠ {agent.name} no activity for {time_since_update.seconds}s")
                # Not necessarily dead, just quiet
                return True

        return True

    async def restart_agent(self, agent: AgentProcess):
        """Restart a failed agent"""
        if agent.restart_count >= agent.max_restarts:
            self.logger.error(f"❌ {agent.name} exceeded max restarts ({agent.max_restarts})")
            agent.is_healthy = False
            return

        self.logger.info(f"🔄 Restarting {agent.name} (attempt {agent.restart_count + 1})")

        # Kill old process if it exists
        if agent.process:
            try:
                agent.process.terminate()
                agent.process.wait(timeout=5)
            except:
                agent.process.kill()

        # Start new process
        try:
            process = subprocess.Popen(
                ["python", "agent_worker.py", str(agent.id), agent.name],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )

            agent.process = process
            agent.restart_count += 1
            agent.last_heartbeat = datetime.now()

            self.logger.info(f"✓ {agent.name} restarted successfully (PID: {process.pid})")

        except Exception as e:
            self.logger.error(f"❌ Failed to restart {agent.name}: {e}")
            agent.is_healthy = False

    async def monitor_loop(self):
        """Main monitoring loop"""
        self.running = True
        self.logger.info("🚀 Keep-Alive Monitor started")

        while self.running:
            await asyncio.sleep(self.check_interval)

            # Check all agents
            for agent in self.agents.values():
                if not agent.is_healthy:
                    continue

                is_healthy = await self.check_process_health(agent)

                if not is_healthy:
                    self.logger.warning(f"⚠ {agent.name} is unhealthy, restarting...")
                    await self.restart_agent(agent)

            # Print status summary
            healthy_count = sum(1 for a in self.agents.values() if a.is_healthy)
            total_count = len(self.agents)

            self.logger.info(f"💚 Health Check: {healthy_count}/{total_count} agents healthy")

    async def shutdown(self):
        """Graceful shutdown"""
        self.logger.info("🛑 Shutting down Keep-Alive Monitor...")
        self.running = False

        # Terminate all agent processes
        for agent in self.agents.values():
            if agent.process:
                try:
                    self.logger.info(f"  Stopping {agent.name}...")
                    agent.process.terminate()
                    agent.process.wait(timeout=5)
                except:
                    agent.process.kill()

        self.logger.info("✓ All agents stopped")


class SystemMonitor:
    """
    Monitors system resources and overall health
    """

    def __init__(self):
        self.setup_logging()

    def setup_logging(self):
        """Setup logging"""
        self.logger = logging.getLogger('SystemMonitor')

    async def monitor_resources(self):
        """Monitor system resources"""
        while True:
            await asyncio.sleep(30)

            try:
                # Get CPU and memory usage
                import psutil

                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')

                self.logger.info(f"📊 System Resources:")
                self.logger.info(f"  CPU: {cpu_percent}%")
                self.logger.info(f"  Memory: {memory.percent}% ({memory.used / (1024**3):.1f}GB / {memory.total / (1024**3):.1f}GB)")
                self.logger.info(f"  Disk: {disk.percent}% ({disk.used / (1024**3):.1f}GB / {disk.total / (1024**3):.1f}GB)")

                # Check GPU if available
                try:
                    result = subprocess.run(
                        ['nvidia-smi', '--query-gpu=utilization.gpu,memory.used,memory.total', '--format=csv,noheader,nounits'],
                        capture_output=True,
                        text=True,
                        timeout=5
                    )

                    if result.returncode == 0:
                        gpu_info = result.stdout.strip().split(',')
                        self.logger.info(f"  GPU: {gpu_info[0]}% util, {gpu_info[1]}MB / {gpu_info[2]}MB")

                except:
                    pass  # No GPU or nvidia-smi not available

            except Exception as e:
                self.logger.error(f"Error monitoring resources: {e}")


class AlertSystem:
    """
    Alert system for critical events
    """

    def __init__(self):
        self.setup_logging()

    def setup_logging(self):
        """Setup logging"""
        self.logger = logging.getLogger('AlertSystem')

    async def send_alert(self, level: str, message: str):
        """Send alert (can be extended to email, Slack, etc.)"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        alert_msg = f"[{level}] {timestamp} - {message}"

        if level == "CRITICAL":
            self.logger.critical(f"🚨 {alert_msg}")
        elif level == "WARNING":
            self.logger.warning(f"⚠️  {alert_msg}")
        else:
            self.logger.info(f"ℹ️  {alert_msg}")

        # Write to alerts file
        alerts_file = Path("logs/alerts.log")
        with open(alerts_file, "a") as f:
            f.write(f"{alert_msg}\n")


async def main():
    """Main entry point"""
    monitor = KeepAliveMonitor(check_interval=10)
    system_monitor = SystemMonitor()
    alert_system = AlertSystem()

    # Handle graceful shutdown
    def signal_handler(sig, frame):
        asyncio.create_task(monitor.shutdown())
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Send startup alert
    await alert_system.send_alert("INFO", "Keep-Alive Monitor started")

    # Run monitoring tasks
    tasks = [
        monitor.monitor_loop(),
        system_monitor.monitor_resources()
    ]

    await asyncio.gather(*tasks)


if __name__ == "__main__":
    # Ensure logs directory exists
    Path("logs").mkdir(exist_ok=True)

    asyncio.run(main())
