#!/bin/bash

# The Birds Business Manager - Setup Verification Script

echo "=========================================="
echo "🐦 The Birds Business Manager"
echo "Setup Verification"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check status
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# Check Node.js
echo "Checking Node.js..."
node --version > /dev/null 2>&1
check "Node.js installed: $(node --version 2>/dev/null || echo 'NOT FOUND')"
echo ""

# Check npm
echo "Checking npm..."
npm --version > /dev/null 2>&1
check "npm installed: $(npm --version 2>/dev/null || echo 'NOT FOUND')"
echo ""

# Check PostgreSQL
echo "Checking PostgreSQL..."
psql --version > /dev/null 2>&1
check "PostgreSQL installed: $(psql --version 2>/dev/null | head -1 || echo 'NOT FOUND')"
echo ""

# Check if database exists
echo "Checking database..."
sudo -u postgres psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw the_birds_db
if [ $? -eq 0 ]; then
    check "Database 'the_birds_db' exists"
else
    echo -e "${YELLOW}⚠${NC} Database 'the_birds_db' not found (run deployment/setup-database.sh)"
fi
echo ""

# Check backend dependencies
echo "Checking backend dependencies..."
if [ -d "backend/node_modules" ]; then
    check "Backend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Backend dependencies not installed (run: cd backend && npm install)"
fi
echo ""

# Check frontend dependencies
echo "Checking frontend dependencies..."
if [ -d "frontend/node_modules" ]; then
    check "Frontend dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Frontend dependencies not installed (run: cd frontend && npm install)"
fi
echo ""

# Check environment file
echo "Checking configuration..."
if [ -f "backend/.env" ]; then
    check "Backend .env file exists"
else
    echo -e "${YELLOW}⚠${NC} Backend .env file not found (copy from backend/.env.example)"
fi
echo ""

# Check if backend is running
echo "Checking if backend is running..."
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    check "Backend is running on port 3001"
else
    echo -e "${YELLOW}⚠${NC} Backend not running (start with: npm run dev:backend)"
fi
echo ""

# Check if frontend is running
echo "Checking if frontend is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    check "Frontend is running on port 3000"
else
    echo -e "${YELLOW}⚠${NC} Frontend not running (start with: npm run dev:frontend)"
fi
echo ""

# Test database connection
echo "Testing database connection..."
if [ -f "backend/.env" ]; then
    source backend/.env 2>/dev/null
    PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -U ${DB_USER:-postgres} -d ${DB_NAME:-the_birds_db} -c "SELECT COUNT(*) FROM products;" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        PRODUCT_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h ${DB_HOST:-localhost} -U ${DB_USER:-postgres} -d ${DB_NAME:-the_birds_db} -t -c "SELECT COUNT(*) FROM products;" 2>/dev/null | xargs)
        check "Database connection successful (${PRODUCT_COUNT} products found)"
    else
        echo -e "${RED}✗${NC} Database connection failed"
    fi
else
    echo -e "${YELLOW}⚠${NC} Cannot test database (no .env file)"
fi
echo ""

echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""
echo "If all checks passed, you're ready to go! 🎉"
echo ""
echo "To start the application:"
echo "  npm run dev"
echo ""
echo "Or start backend and frontend separately:"
echo "  Terminal 1: npm run dev:backend"
echo "  Terminal 2: npm run dev:frontend"
echo ""
echo "Then open: http://localhost:3000"
echo ""
