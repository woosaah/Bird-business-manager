#!/bin/bash

# The Birds Business Manager - Installation Script

set -e

echo "=========================================="
echo "The Birds Business Manager - Installation"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Configuration
INSTALL_DIR="/opt/birds-business-manager"
APP_USER="www-data"

echo "Installation Directory: $INSTALL_DIR"
echo ""

# Check dependencies
echo "Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Install Node.js 18+ before running this script"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL is not installed"
    echo "Install PostgreSQL before running this script"
    exit 1
fi

echo "✓ All dependencies found"
echo ""

# Create installation directory
echo "Creating installation directory..."
mkdir -p $INSTALL_DIR
cp -r ../backend $INSTALL_DIR/
cp -r ../frontend $INSTALL_DIR/
cp -r ../database $INSTALL_DIR/

echo "✓ Files copied"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd $INSTALL_DIR/backend
npm install --production
npm run build

echo "✓ Backend built"
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd $INSTALL_DIR/frontend
npm install
npm run build

echo "✓ Frontend built"
echo ""

# Setup database
echo "Setting up database..."
cd $INSTALL_DIR/deployment
chmod +x setup-database.sh
./setup-database.sh

# Copy environment file
echo "Setting up environment..."
if [ ! -f "$INSTALL_DIR/backend/.env" ]; then
    cp $INSTALL_DIR/backend/.env.example $INSTALL_DIR/backend/.env
    echo "⚠ Please edit $INSTALL_DIR/backend/.env with your configuration"
fi

# Set permissions
echo "Setting permissions..."
chown -R $APP_USER:$APP_USER $INSTALL_DIR

# Install systemd service
echo "Installing systemd service..."
cp birds-backend.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable birds-backend.service

echo "✓ Installation completed"
echo ""

echo "=========================================="
echo "Installation Summary"
echo "=========================================="
echo ""
echo "Installation directory: $INSTALL_DIR"
echo ""
echo "Next steps:"
echo "  1. Edit configuration: nano $INSTALL_DIR/backend/.env"
echo "  2. Start the service: systemctl start birds-backend"
echo "  3. Check status: systemctl status birds-backend"
echo "  4. View logs: journalctl -u birds-backend -f"
echo ""
echo "Frontend is built at: $INSTALL_DIR/frontend/dist"
echo "Serve it with nginx or another web server"
echo ""
