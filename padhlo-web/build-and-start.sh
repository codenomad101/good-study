#!/bin/bash

# Build script for Padhlo Web Application
echo "🚀 Building Padhlo Web Application..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

# Set production environment
export NODE_ENV=production

# Start production server
echo "🌐 Starting production server..."
cd backend
npm start



