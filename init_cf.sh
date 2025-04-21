#!/bin/bash

# Script to run multiple Google Cloud Functions simultaneously
# -------------------------------------------------------------

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Multiple Google Cloud Functions Locally${NC}\n"

# Base directory for all functions
BASE_DIR="/Users/charlieapcher/Documents/GitHub/melify_app/gcp"

# Path to the .env file (placed in the same directory as this script)
ENV_FILE="$(dirname "$0")/.env"

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}.env file not found at $ENV_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}Loading environment variables from $ENV_FILE${NC}\n"

# Load environment variables from .env file
set -a  # automatically export all variables
source "$ENV_FILE"
set +a  # stop automatically exporting

# Function to start a cloud function in the background
run_function() {
    local function_dir="$1"
    local target_function="$2"
    local port="$3"
    
    echo -e "${YELLOW}Starting function: ${target_function} on port ${port}${NC}"
    
    cd "${BASE_DIR}/${function_dir}"
    
    # Check if virtual environment exists
    if [ ! -d ".venv" ]; then
        echo -e "${RED}Virtual environment not found in ${function_dir}. Creating one...${NC}"
        python3 -m venv .venv
        .venv/bin/pip install -r requirements.txt
        echo -e "${GREEN}Virtual environment created and dependencies installed.${NC}"
    fi
    
    # Run the function in background and save the PID
    .venv/bin/functions-framework --target=${target_function} --port=${port} --debug > "${function_dir}_${target_function}.log" 2>&1 &
    local pid=$!
    
    echo -e "${GREEN}Function ${target_function} started with PID: ${pid}${NC}"
    echo $pid >> running_pids.txt
}

# Remove any existing PID file
rm -f running_pids.txt

# Run all functions in parallel
run_function "process_mails" "last_30_days" "8082"
run_function "process_mails" "retrieve_email_by_labels_entry_point" "8083" 

echo -e "\n${GREEN}All functions are now running in the background${NC}"
echo -e "${BLUE}Function logs are being saved to respective log files${NC}"
echo -e "${BLUE}To access a function, use the following URLs:${NC}"
echo -e "  - last_30_days: ${GREEN}http://localhost:8082${NC}"
echo -e "  - retrieve_email_by_labels_entry_point: ${GREEN}http://localhost:8083${NC}"

# Display active environment variables (for debugging)
echo -e "\n${BLUE}Active environment variables:${NC}"
echo -e "  - DATABASE_NAME: ${GREEN}${DATABASE_NAME}${NC}"
echo -e "  - URI_MONGODB: ${GREEN}${URI_MONGODB}${NC}"

# Function to handle script termination
cleanup() {
    echo -e "\n${YELLOW}Stopping all running functions...${NC}"
    if [ -f running_pids.txt ]; then
        while read pid; do
            if ps -p $pid > /dev/null; then
                echo -e "${BLUE}Stopping process with PID: ${pid}${NC}"
                kill $pid
            fi
        done < running_pids.txt
        rm running_pids.txt
    fi
    echo -e "${GREEN}All functions stopped${NC}"
    exit 0
}

# Register the cleanup function for script termination
trap cleanup SIGINT SIGTERM

echo -e "\n${YELLOW}Press Ctrl+C to stop all functions${NC}"

# Keep the script running
while true; do
    sleep 1
done