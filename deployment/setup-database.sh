#!/bin/bash

# The Birds Business Manager - Database Setup Script

set -e

echo "=========================================="
echo "The Birds Business Manager - Database Setup"
echo "=========================================="
echo ""

# Configuration
DB_NAME="the_birds_db"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "Error: PostgreSQL is not installed or not in PATH"
    exit 1
fi

echo "✓ PostgreSQL found"
echo ""

# Create database if it doesn't exist
echo "Creating database..."
sudo -u postgres psql -c "SELECT 'CREATE DATABASE $DB_NAME' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec"

echo "✓ Database created or already exists"
echo ""

# Run schema
echo "Running database schema..."
sudo -u postgres psql -d $DB_NAME -f ../database/schema.sql

echo "✓ Database schema applied successfully"
echo ""

# Grant permissions
echo "Granting permissions..."
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;"

echo "✓ Permissions granted"
echo ""

echo "=========================================="
echo "Database setup completed successfully!"
echo "=========================================="
echo ""
echo "You can now start the application:"
echo "  cd backend && npm install && npm run dev"
echo "  cd frontend && npm install && npm run dev"
echo ""
