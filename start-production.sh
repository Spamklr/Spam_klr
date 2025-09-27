#!/bin/bash

# SPAMKLR Production Startup Script
# Usage: ./start-production.sh

set -e  # Exit on any error

echo "🚀 Starting SPAMKLR in Production Mode..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating template..."
    cp .env.example .env 2>/dev/null || echo "Please create .env file with required variables"
    echo "📋 Please edit .env file with your production values"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Set production environment
export NODE_ENV=production

# Check if MongoDB connection is working
echo "🔄 Testing database connection..."
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => { console.log('✅ Database connection successful'); process.exit(0); })
  .catch(err => { console.error('❌ Database connection failed:', err.message); process.exit(1); });
"

# Start the server
echo "🌟 Starting SPAMKLR server..."
exec node presentation/presentation.js