#!/bin/bash

echo "🏏 Cricket Ranking System - Quick Setup"
echo "========================================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install PostgreSQL first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

echo "✅ Prerequisites found"
echo ""

# Create database
echo "📊 Creating database..."
createdb cricket_ranking 2>/dev/null || echo "Database may already exist"

# Run schema
echo "📋 Setting up database schema..."
psql -d cricket_ranking -f backend/database.sql

# Install npm dependencies
echo "📦 Installing Node.js dependencies..."
cd backend
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 To start the server, run:"
echo "   cd backend && npm start"
echo ""
echo "🌐 Then open in browser:"
echo "   Admin Panel: frontend/admin.html"
echo "   Public View: frontend/public.html"
echo ""
