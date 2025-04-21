#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Navigate to the root directory of the project
cd "$(dirname "$0")"

# Variables
FRONTEND_DIR="starter-next-js"
BACKEND_DIR="api"
BACKEND_NAME="nestjs-api"
FRONTEND_NAME="nextjs-frontend"

echo "Starting deployment..."

# Pull the latest code for both frontend and backend
echo "Stashing local changes (if any)..."
git stash

echo "Pulling latest changes from Git for both frontend and backend..."
git pull origin dev

# Update Backend
echo "Updating backend..."
cd $BACKEND_DIR
echo "Installing backend dependencies..."
npm install
echo "Building backend..."
npm run build
echo "Restarting backend service with PM2..."
pm2 restart $BACKEND_NAME
cd ..

# Update Frontend
echo "Updating frontend..."
cd $FRONTEND_DIR
echo "Installing frontend dependencies..."
npm install
echo "Building frontend..."
npm run build
echo "Deploying frontend build to Nginx directory..."
pm2 restart $FRONTEND_NAME || pm2 start npm --name $FRONTEND_NAME -- start
cd ..

echo "Deployment completed successfully!"
