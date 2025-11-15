#!/bin/bash

# The Birds Business Manager - Quick Start Script

set -e

echo "=========================================="
echo "🐦 The Birds Business Manager"
echo "Quick Start Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js $(node --version) found"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    echo "Please install PostgreSQL 12+ first"
    echo ""
    echo "Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "macOS: brew install postgresql"
    exit 1
fi

echo "✓ PostgreSQL found"
echo ""

# Install root dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
    echo "✓ Root dependencies installed"
    echo ""
fi

# Install backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    echo "✓ Backend dependencies installed"
    echo ""
fi

# Install frontend dependencies
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    echo "✓ Frontend dependencies installed"
    echo ""
fi

# Setup environment file if not exists
if [ ! -f "backend/.env" ]; then
    echo "Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "✓ Environment file created"
    echo "⚠  Please edit backend/.env with your database credentials"
    echo ""
fi

# Setup database
echo "Do you want to setup the database now? (y/n)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "Setting up database..."
    cd deployment
    chmod +x setup-database.sh
    ./setup-database.sh
    cd ..
    echo ""
fi

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "To start the application in development mode:"
echo ""
echo "  Option 1 - Run both servers together:"
echo "  $ npm run dev"
echo ""
echo "  Option 2 - Run separately (in different terminals):"
echo "  $ npm run dev:backend    # Start backend on port 3001+"
echo "  $ npm run dev:frontend   # Start frontend on port 3000+"
echo ""
echo "Then open http://localhost:3000 in your browser"
echo ""
echo "For production deployment, see README.md"
echo ""
