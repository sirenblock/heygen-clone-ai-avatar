"""
Real-time Dashboard for Multi-Agent Orchestrator
Visual monitoring and control interface
"""

import asyncio
import curses
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List
import json


class Dashboard:
    """
    Real-time terminal dashboard for monitoring agent orchestrator
    """

    def __init__(self, stdscr):
        self.stdscr = stdscr
        self.running = True

        # Initialize colors
        curses.start_color()
        curses.init_pair(1, curses.COLOR_GREEN, curses.COLOR_BLACK)
        curses.init_pair(2, curses.COLOR_YELLOW, curses.COLOR_BLACK)
        curses.init_pair(3, curses.COLOR_RED, curses.COLOR_BLACK)
        curses.init_pair(4, curses.COLOR_CYAN, curses.COLOR_BLACK)
        curses.init_pair(5, curses.COLOR_MAGENTA, curses.COLOR_BLACK)
        curses.init_pair(6, curses.COLOR_WHITE, curses.COLOR_BLACK)

        # Colors
        self.GREEN = curses.color_pair(1)
        self.YELLOW = curses.color_pair(2)
        self.RED = curses.color_pair(3)
        self.CYAN = curses.color_pair(4)
        self.MAGENTA = curses.color_pair(5)
        self.WHITE = curses.color_pair(6)

        # Hide cursor
        curses.curs_set(0)

        # Agent data
        self.agents = self.initialize_agents()
        self.tasks = self.load_tasks()

    def initialize_agents(self) -> Dict[int, Dict]:
        """Initialize agent tracking data"""
        agent_names = [
            "Core-Setup-Agent",
            "Voice-Synthesis-Agent",
            "Lip-Sync-Agent",
            "Avatar-Training-Agent",
            "Video-Generator-Agent",
            "API-Backend-Agent",
            "Model-Integration-Agent",
            "Config-Manager-Agent",
            "Docker-Deploy-Agent",
            "Testing-QA-Agent",
            "Documentation-Agent",
            "Monitor-Health-Agent"
        ]

        agents = {}
        for i, name in enumerate(agent_names):
            agents[i] = {
                "id": i,
                "name": name,
                "status": "idle",
                "current_task": None,
                "tasks_completed": 0,
                "uptime": 0
            }

        return agents

    def load_tasks(self) -> Dict[str, Dict]:
        """Load task definitions"""
        # This would load from orchestrator state
        return {
            "T001": {"name": "Project Structure Setup", "status": "idle"},
            "T002": {"name": "Environment Configuration", "status": "idle"},
            "T003": {"name": "Settings Module", "status": "idle"},
            # ... more tasks
        }

    def draw_header(self):
        """Draw dashboard header"""
        height, width = self.stdscr.getmaxyx()

        # Title
        title = "╔════════════════════════════════════════════════════════════════════════════╗"
        subtitle = "║         MULTI-AGENT ORCHESTRATOR - AI AVATAR PLATFORM BUILDER            ║"
        separator = "╚════════════════════════════════════════════════════════════════════════════╝"

        self.stdscr.attron(self.CYAN | curses.A_BOLD)
        self.stdscr.addstr(0, 0, title[:width-1])
        self.stdscr.addstr(1, 0, subtitle[:width-1])
        self.stdscr.addstr(2, 0, separator[:width-1])
        self.stdscr.attroff(self.CYAN | curses.A_BOLD)

        # Timestamp
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.stdscr.addstr(1, width - 22, f" {timestamp} ", self.WHITE)

    def draw_agent_grid(self, start_row: int):
        """Draw agent status grid"""
        height, width = self.stdscr.getmaxyx()

        # Section title
        self.stdscr.attron(self.YELLOW | curses.A_BOLD)
        self.stdscr.addstr(start_row, 2, "AGENT STATUS (12 Agents)")
        self.stdscr.attroff(self.YELLOW | curses.A_BOLD)

        row = start_row + 2
        col = 2

        agents_per_row = 3
        agent_width = 25

        for i, agent in self.agents.items():
            if i > 0 and i % agents_per_row == 0:
                row += 5
                col = 2

            # Agent box
            self.draw_agent_box(row, col, agent)

            col += agent_width

    def draw_agent_box(self, row: int, col: int, agent: Dict):
        """Draw individual agent status box"""
        status = agent["status"]
        name = agent["name"][:20]  # Truncate long names
        tasks = agent["tasks_completed"]

        # Status color
        if status == "working":
            color = self.GREEN
            symbol = "⚡"
        elif status == "idle":
            color = self.YELLOW
            symbol = "◉"
        elif status == "completed":
            color = self.CYAN
            symbol = "✓"
        else:
            color = self.RED
            symbol = "✗"

        # Draw box
        self.stdscr.addstr(row, col, "┌" + "─" * 21 + "┐", self.WHITE)
        self.stdscr.addstr(row + 1, col, "│", self.WHITE)
        self.stdscr.addstr(row + 1, col + 1, f"{symbol} {name[:18]}", color | curses.A_BOLD)
        self.stdscr.addstr(row + 1, col + 22, "│", self.WHITE)

        self.stdscr.addstr(row + 2, col, "│", self.WHITE)
        self.stdscr.addstr(row + 2, col + 1, f"Tasks: {tasks:2d}  ", self.WHITE)
        self.stdscr.addstr(row + 2, col + 13, status.upper()[:8], color)
        self.stdscr.addstr(row + 2, col + 22, "│", self.WHITE)

        self.stdscr.addstr(row + 3, col, "└" + "─" * 21 + "┘", self.WHITE)

    def draw_progress_bar(self, row: int, col: int, label: str, current: int, total: int, width: int = 40):
        """Draw a progress bar"""
        if total == 0:
            percentage = 0
        else:
            percentage = (current / total) * 100

        filled = int((current / total) * width) if total > 0 else 0
        bar = "█" * filled + "░" * (width - filled)

        # Color based on progress
        if percentage >= 100:
            color = self.GREEN
        elif percentage >= 50:
            color = self.YELLOW
        else:
            color = self.RED

        self.stdscr.addstr(row, col, f"{label:20s}", self.WHITE)
        self.stdscr.addstr(row, col + 21, "[", self.WHITE)
        self.stdscr.addstr(row, col + 22, bar, color | curses.A_BOLD)
        self.stdscr.addstr(row, col + 22 + width, "]", self.WHITE)
        self.stdscr.addstr(row, col + 24 + width, f"{percentage:5.1f}% ({current}/{total})", self.WHITE)

    def draw_task_progress(self, start_row: int):
        """Draw task progress section"""
        height, width = self.stdscr.getmaxyx()

        # Section title
        self.stdscr.attron(self.YELLOW | curses.A_BOLD)
        self.stdscr.addstr(start_row, 2, "BUILD PROGRESS")
        self.stdscr.attroff(self.YELLOW | curses.A_BOLD)

        row = start_row + 2

        # Overall progress
        total_tasks = 20  # Total tasks from PDF
        completed_tasks = sum(1 for a in self.agents.values() if a["tasks_completed"] > 0)

        self.draw_progress_bar(row, 2, "Overall Progress", completed_tasks, total_tasks)
        row += 2

        # Component progress
        components = [
            ("Core Modules", 5, 3),
            ("API Backend", 8, 5),
            ("Deployment", 12, 8),
            ("Documentation", 16, 12),
        ]

        for name, total, completed in components:
            self.draw_progress_bar(row, 2, name, completed, total)
            row += 1

    def draw_logs(self, start_row: int):
        """Draw recent logs"""
        height, width = self.stdscr.getmaxyx()

        # Section title
        self.stdscr.attron(self.YELLOW | curses.A_BOLD)
        self.stdscr.addstr(start_row, 2, "RECENT ACTIVITY")
        self.stdscr.attroff(self.YELLOW | curses.A_BOLD)

        row = start_row + 2

        # Read recent logs
        log_file = Path("orchestrator.log")
        if log_file.exists():
            with open(log_file, 'r') as f:
                lines = f.readlines()[-10:]  # Last 10 lines

            for i, line in enumerate(lines):
                if row + i >= height - 2:
                    break

                # Colorize based on log level
                if "ERROR" in line or "FAILED" in line:
                    color = self.RED
                elif "WARNING" in line:
                    color = self.YELLOW
                elif "Completed" in line or "SUCCESS" in line:
                    color = self.GREEN
                else:
                    color = self.WHITE

                # Truncate line to fit
                display_line = line.strip()[:width - 4]
                self.stdscr.addstr(row + i, 2, display_line, color)

    def draw_stats(self, start_row: int):
        """Draw statistics panel"""
        height, width = self.stdscr.getmaxyx()

        # Section title
        self.stdscr.attron(self.YELLOW | curses.A_BOLD)
        self.stdscr.addstr(start_row, 2, "STATISTICS")
        self.stdscr.attroff(self.YELLOW | curses.A_BOLD)

        row = start_row + 2

        # Calculate stats
        total_agents = len(self.agents)
        working_agents = sum(1 for a in self.agents.values() if a["status"] == "working")
        total_completed = sum(a["tasks_completed"] for a in self.agents.values())

        stats = [
            ("Total Agents:", f"{total_agents}", self.CYAN),
            ("Active Agents:", f"{working_agents}", self.GREEN),
            ("Tasks Completed:", f"{total_completed}", self.CYAN),
            ("Uptime:", "00:15:32", self.YELLOW),
        ]

        for label, value, color in stats:
            self.stdscr.addstr(row, 2, f"{label:20s}", self.WHITE)
            self.stdscr.addstr(row, 23, value, color | curses.A_BOLD)
            row += 1

    def draw_footer(self):
        """Draw dashboard footer"""
        height, width = self.stdscr.getmaxyx()

        footer_row = height - 1

        # Commands
        commands = "  [Q]uit  [R]efresh  [L]ogs  [A]gents  [H]elp  "

        self.stdscr.attron(self.CYAN | curses.A_REVERSE)
        self.stdscr.addstr(footer_row, 0, commands.ljust(width - 1))
        self.stdscr.attroff(self.CYAN | curses.A_REVERSE)

    async def update_data(self):
        """Update agent data from logs/state files"""
        while self.running:
            await asyncio.sleep(2)

            # Update agent statuses (in real implementation, read from state files)
            # For demo, simulate some activity
            import random

            for agent in self.agents.values():
                if random.random() < 0.3:
                    agent["status"] = random.choice(["idle", "working", "completed"])
                    if agent["status"] == "completed":
                        agent["tasks_completed"] += 1

    def render(self):
        """Render the dashboard"""
        self.stdscr.clear()

        height, width = self.stdscr.getmaxyx()

        # Draw sections
        self.draw_header()
        self.draw_agent_grid(4)
        self.draw_task_progress(26)
        self.draw_stats(34)
        self.draw_logs(42)
        self.draw_footer()

        self.stdscr.refresh()

    async def run(self):
        """Main dashboard loop"""
        # Start data update task
        update_task = asyncio.create_task(self.update_data())

        # Set non-blocking input
        self.stdscr.nodelay(True)

        try:
            while self.running:
                # Render dashboard
                self.render()

                # Check for key press
                try:
                    key = self.stdscr.getch()

                    if key == ord('q') or key == ord('Q'):
                        self.running = False
                    elif key == ord('r') or key == ord('R'):
                        # Refresh
                        pass

                except:
                    pass

                await asyncio.sleep(0.5)

        finally:
            update_task.cancel()


def main(stdscr):
    """Main entry point for curses"""
    dashboard = Dashboard(stdscr)
    asyncio.run(dashboard.run())


if __name__ == "__main__":
    curses.wrapper(main)
