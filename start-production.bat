@echo off
REM SPAMKLR Production Startup Script for Windows
REM Usage: start-production.bat

echo 🚀 Starting SPAMKLR in Production Mode...

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating template...
    if exist .env.example (
        copy .env.example .env >nul
        echo 📋 Please edit .env file with your production values
    ) else (
        echo Please create .env file with required variables
    )
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install --production
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Set production environment
set NODE_ENV=production

REM Start the server
echo 🌟 Starting SPAMKLR server...
node presentation/presentation.js

pause