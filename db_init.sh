#!/bin/bash

# MongoDB Initialization Script for macOS
# =======================================

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}MongoDB Initialization Script for macOS${NC}\n"

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo -e "${RED}Homebrew is not installed. Installing Homebrew...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install Homebrew. Please install it manually and run this script again.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Homebrew installed successfully!${NC}\n"
else
    echo -e "${GREEN}Homebrew is already installed.${NC}\n"
fi

# Check if MongoDB is installed
if ! brew list mongodb-community &> /dev/null; then
    echo -e "${BLUE}MongoDB is not installed. Installing MongoDB Community Edition...${NC}"
    brew tap mongodb/brew
    brew install mongodb-community
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install MongoDB. Please check the error messages above.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}MongoDB installed successfully!${NC}\n"
else
    echo -e "${GREEN}MongoDB is already installed.${NC}\n"
    # Update MongoDB to the latest version
    echo -e "${BLUE}Updating MongoDB to the latest version...${NC}"
    brew upgrade mongodb-community
    echo -e "${GREEN}MongoDB updated.${NC}\n"
fi

# Create data directory if it doesn't exist
DATA_DIR="$HOME/data/db"
if [ ! -d "$DATA_DIR" ]; then
    echo -e "${BLUE}Creating MongoDB data directory at $DATA_DIR...${NC}"
    mkdir -p "$DATA_DIR"
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create data directory. Please check permissions.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Data directory created successfully!${NC}\n"
else
    echo -e "${GREEN}MongoDB data directory already exists at $DATA_DIR.${NC}\n"
fi

# Set permissions for the data directory
echo -e "${BLUE}Setting appropriate permissions for the data directory...${NC}"
chmod 755 "$DATA_DIR"
echo -e "${GREEN}Permissions set.${NC}\n"

# Check if MongoDB is already running
if pgrep -x "mongod" > /dev/null; then
    echo -e "${GREEN}MongoDB is already running.${NC}\n"
else
    # Start MongoDB service
    echo -e "${BLUE}Starting MongoDB service...${NC}"
    brew services start mongodb-community
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to start MongoDB service. Trying manual start...${NC}"
        mongod --dbpath "$DATA_DIR"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Failed to start MongoDB manually. Please check the error messages above.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}MongoDB service started successfully!${NC}\n"
    fi
fi

# Wait for MongoDB to be ready
echo -e "${BLUE}Waiting for MongoDB to be ready...${NC}"
sleep 2

# Verify MongoDB connection
echo -e "${BLUE}Verifying MongoDB connection...${NC}"
if ! mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    echo -e "${RED}Could not connect to MongoDB. Please check if the service is running correctly.${NC}"
    echo -e "${RED}You might need to run: brew services restart mongodb-community${NC}"
    exit 1
else
    echo -e "${GREEN}MongoDB is up and running!${NC}\n"
fi

# Create melifydevelopment database
echo -e "${BLUE}Creating 'melifydevelopment' database...${NC}"
mongosh --eval "use melifydevelopment; db.createCollection('init'); db.init.insertOne({created: new Date(), message: 'Database initialized successfully'});"

if [ $? -ne 0 ]; then
    echo -e "${RED}Could not create the 'melifydevelopment' database. Please check the error above.${NC}"
else
    echo -e "${GREEN}The 'melifydevelopment' database was created successfully!${NC}\n"
fi

# Display connection information
echo -e "${BLUE}MongoDB Connection Information:${NC}"
echo -e "  - Connection URL: ${GREEN}mongodb://localhost:27017${NC}"
echo -e "  - Development Database URL: ${GREEN}mongodb://localhost:27017/melifydevelopment${NC}"
echo -e "  - Data Directory: ${GREEN}$DATA_DIR${NC}"
echo -e "  - Admin Interface: ${GREEN}http://localhost:27017${NC}"

# Display useful commands
echo -e "\n${BLUE}Useful Commands:${NC}"
echo -e "  - ${GREEN}brew services stop mongodb-community${NC} (Stop MongoDB)"
echo -e "  - ${GREEN}brew services restart mongodb-community${NC} (Restart MongoDB)"
echo -e "  - ${GREEN}mongosh${NC} (Connect to MongoDB shell)"

echo -e "\n${GREEN}MongoDB initialization completed successfully!${NC}"