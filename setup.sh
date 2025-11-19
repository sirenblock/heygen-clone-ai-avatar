#!/bin/bash

# AI Avatar Platform - Setup Script
# Automated installation and configuration

set -e  # Exit on error

echo "======================================"
echo "AI Avatar Platform - Setup"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "$1"
}

# Check Python version
echo "Checking Python version..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)

    if [ "$PYTHON_MAJOR" -ge 3 ] && [ "$PYTHON_MINOR" -ge 8 ]; then
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3.8+ required, found $PYTHON_VERSION"
        exit 1
    fi
else
    print_error "Python 3 not found. Please install Python 3.8+"
    exit 1
fi

# Check FFmpeg
echo ""
echo "Checking FFmpeg..."
if command -v ffmpeg &> /dev/null; then
    print_success "FFmpeg found"
else
    print_warning "FFmpeg not found"
    echo "Please install FFmpeg:"
    echo "  macOS: brew install ffmpeg"
    echo "  Ubuntu: sudo apt-get install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org/download.html"
fi

# Create virtual environment
echo ""
echo "Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_info "Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source venv/bin/activate
print_success "Virtual environment activated"

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
print_success "Pip upgraded"

# Install dependencies
echo ""
echo "Installing dependencies (this may take 5-10 minutes)..."
pip install -r requirements.txt
print_success "Dependencies installed"

# Create directories
echo ""
echo "Creating directories..."
mkdir -p data/models
mkdir -p data/avatars
mkdir -p data/temp
mkdir -p data/output
mkdir -p logs
print_success "Directories created"

# Setup .env file
echo ""
echo "Setting up environment file..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    print_success ".env file created"
    print_warning "Please edit .env and add your ELEVENLABS_API_KEY"
else
    print_info ".env file already exists"
fi

# Check GPU
echo ""
echo "Checking GPU availability..."
python3 -c "import torch; print('GPU available:', torch.cuda.is_available())" 2>/dev/null || print_warning "Could not check GPU (PyTorch not fully installed yet)"

# Run tests
echo ""
echo "Running installation tests..."
if python3 test_installation.py; then
    print_success "Installation tests passed"
else
    print_warning "Some tests failed, but setup is complete"
fi

# Print summary
echo ""
echo "======================================"
echo "Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit .env file and add your ELEVENLABS_API_KEY:"
echo "   nano .env"
echo ""
echo "2. Run test installation:"
echo "   python test_installation.py"
echo ""
echo "3. Start the server:"
echo "   python main.py"
echo ""
echo "4. Visit API docs:"
echo "   http://localhost:8000/docs"
echo ""
echo "5. Run examples:"
echo "   python examples.py"
echo ""
echo "For more information, see:"
echo "  - README.md (full documentation)"
echo "  - QUICKSTART.md (quick start guide)"
echo ""
print_success "Happy generating! 🚀"
