#!/bin/bash

# Automated Deployment Script for Multi-Agent Orchestrator
# This script will guide you through deploying to GitHub and Vercel

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║              🚀 AUTOMATED DEPLOYMENT TO GITHUB & VERCEL 🚀              ║
║                                                                          ║
║                   Multi-Agent Orchestrator Deployment                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo ""
echo -e "${YELLOW}This script will help you deploy your project to:${NC}"
echo -e "  1. GitHub (for version control)"
echo -e "  2. Vercel (for live hosting)"
echo ""

# Check if git is configured
echo -e "${CYAN}📋 Checking prerequisites...${NC}"
echo ""

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git installed${NC}"

if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠ GitHub CLI (gh) not installed${NC}"
    echo -e "  Install with: brew install gh"
    echo -e "  Or continue with manual GitHub setup"
    USE_GH_CLI=false
else
    echo -e "${GREEN}✓ GitHub CLI installed${NC}"
    USE_GH_CLI=true
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                    STEP 1: GITHUB SETUP                        ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}Enter your GitHub username:${NC}"
read -p "> " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo -e "${RED}❌ GitHub username is required!${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Enter repository name (default: multi-agent-orchestrator):${NC}"
read -p "> " REPO_NAME
REPO_NAME=${REPO_NAME:-multi-agent-orchestrator}

echo ""
echo -e "${CYAN}📦 Repository Configuration:${NC}"
echo -e "  GitHub User: ${GREEN}$GITHUB_USERNAME${NC}"
echo -e "  Repository:  ${GREEN}$REPO_NAME${NC}"
echo -e "  URL:         ${GREEN}https://github.com/$GITHUB_USERNAME/$REPO_NAME${NC}"
echo ""

if [ "$USE_GH_CLI" = true ]; then
    echo -e "${YELLOW}Do you want to create the GitHub repository automatically? (y/n)${NC}"
    read -p "> " AUTO_CREATE

    if [ "$AUTO_CREATE" = "y" ] || [ "$AUTO_CREATE" = "Y" ]; then
        echo ""
        echo -e "${CYAN}🔐 Authenticating with GitHub...${NC}"
        gh auth status || gh auth login

        echo ""
        echo -e "${CYAN}📦 Creating GitHub repository...${NC}"
        gh repo create "$REPO_NAME" --public --description "Multi-Agent Orchestrator - AI Avatar Platform Builder with 12 Parallel Agents" --source=. --remote=origin --push

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Repository created and code pushed!${NC}"
            REPO_CREATED=true
        else
            echo -e "${RED}❌ Failed to create repository${NC}"
            REPO_CREATED=false
        fi
    else
        REPO_CREATED=false
    fi
else
    REPO_CREATED=false
fi

if [ "$REPO_CREATED" = false ]; then
    echo ""
    echo -e "${YELLOW}📝 Manual GitHub Setup Required:${NC}"
    echo ""
    echo -e "${CYAN}1. Create repository:${NC}"
    echo -e "   Go to: ${BLUE}https://github.com/new${NC}"
    echo -e "   Name: ${GREEN}$REPO_NAME${NC}"
    echo -e "   Set to: ${GREEN}Public${NC}"
    echo -e "   Click: ${GREEN}Create repository${NC}"
    echo ""
    echo -e "${CYAN}2. Push your code:${NC}"
    echo -e "   ${GREEN}git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git${NC}"
    echo -e "   ${GREEN}git push -u origin main${NC}"
    echo ""
    echo -e "${YELLOW}Press Enter when you've completed these steps...${NC}"
    read
fi

echo ""
echo -e "${GREEN}✅ GitHub setup complete!${NC}"
echo -e "   Repository: ${CYAN}https://github.com/$GITHUB_USERNAME/$REPO_NAME${NC}"
echo ""

echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                    STEP 2: VERCEL DEPLOYMENT                   ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""

if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✓ Vercel CLI installed${NC}"
    echo ""
    echo -e "${YELLOW}Deploy to Vercel now? (y/n)${NC}"
    read -p "> " DEPLOY_NOW

    if [ "$DEPLOY_NOW" = "y" ] || [ "$DEPLOY_NOW" = "Y" ]; then
        echo ""
        echo -e "${CYAN}🚀 Deploying to Vercel...${NC}"
        vercel --prod

        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✅ Deployed successfully!${NC}"
        else
            echo -e "${RED}❌ Deployment failed${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠ Vercel CLI not installed${NC}"
    echo ""
    echo -e "${CYAN}Option 1: Install Vercel CLI${NC}"
    echo -e "  ${GREEN}npm install -g vercel${NC}"
    echo -e "  ${GREEN}vercel login${NC}"
    echo -e "  ${GREEN}vercel --prod${NC}"
    echo ""
    echo -e "${CYAN}Option 2: Deploy via Dashboard (Easiest)${NC}"
    echo -e "  1. Go to: ${BLUE}https://vercel.com${NC}"
    echo -e "  2. Sign in with GitHub"
    echo -e "  3. Click: ${GREEN}Add New... → Project${NC}"
    echo -e "  4. Import: ${GREEN}$GITHUB_USERNAME/$REPO_NAME${NC}"
    echo -e "  5. Click: ${GREEN}Deploy${NC}"
    echo -e "  6. Live in: ${GREEN}30-60 seconds!${NC}"
    echo ""
    echo -e "${YELLOW}Opening Vercel in your browser...${NC}"
    sleep 2
    open "https://vercel.com/new"
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                     ✅ DEPLOYMENT COMPLETE!                     ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}🎉 Your Multi-Agent Orchestrator is ready!${NC}"
echo ""
echo -e "${YELLOW}📊 Project Summary:${NC}"
echo -e "  GitHub:  ${CYAN}https://github.com/$GITHUB_USERNAME/$REPO_NAME${NC}"
echo -e "  Vercel:  ${CYAN}https://$REPO_NAME.vercel.app${NC} (after deployment)"
echo -e "  Local:   ${CYAN}file://$(pwd)/index.html${NC}"
echo ""
echo -e "${YELLOW}📚 Quick Links:${NC}"
echo -e "  • Documentation: ${CYAN}README_ORCHESTRATOR.md${NC}"
echo -e "  • Quick Start:   ${CYAN}QUICKSTART_ORCHESTRATOR.md${NC}"
echo -e "  • Architecture:  ${CYAN}SYSTEM_OVERVIEW.md${NC}"
echo ""
echo -e "${GREEN}✨ Share your project:${NC}"
echo -e "  • Live Demo: https://$REPO_NAME.vercel.app"
echo -e "  • GitHub:    https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo -e "  • Docs:      https://$REPO_NAME.vercel.app/README_ORCHESTRATOR.md"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo ""
