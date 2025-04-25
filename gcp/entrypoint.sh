#!/bin/bash

# Color codes for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Google Cloud Functions in Docker${NC}\n"

# Create and activate virtual environments for each function
setup_function() {
    local function_dir="$1"
    
    echo -e "${YELLOW}Setting up environment for ${function_dir}${NC}"
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "${function_dir}/.venv" ]; then
        echo -e "${GREEN}Creating virtual environment for ${function_dir}${NC}"
        cd "${function_dir}"
        python -m venv .venv
        .venv/bin/pip install -r requirements.txt
    fi
}

# Setup virtual environments
setup_function "process_mails"

# Start functions in background
echo -e "${GREEN}Starting last_30_days function on port 8082${NC}"
cd /app/process_mails
.venv/bin/functions-framework --target=last_30_days --port=8082 --debug > /app/last_30_days.log 2>&1 &
PID1=$!

echo -e "${GREEN}Starting retrieve_email_by_labels function on port 8083${NC}"
cd /app/process_mails
.venv/bin/functions-framework --target=retrieve_email_by_labels_entry_point --port=8083 --debug > /app/retrieve_email_by_labels.log 2>&1 &
PID2=$!

echo -e "\n${GREEN}All functions are now running${NC}"
echo -e "${BLUE}Function URLs:${NC}"
echo -e "  - last_30_days: ${GREEN}http://localhost:8082${NC}"
echo -e "  - retrieve_email_by_labels_entry_point: ${GREEN}http://localhost:8083${NC}"

# Function to handle container termination
cleanup() {
    echo -e "\n${YELLOW}Stopping all running functions...${NC}"
    kill $PID1 $PID2
    echo -e "${GREEN}All functions stopped${NC}"
    exit 0
}

# Register the cleanup function
trap cleanup SIGINT SIGTERM

# Display logs in real-time
echo -e "\n${YELLOW}Displaying logs:${NC}"
tail -f /app/*.log &

# Keep the container running
wait $PID1 $PID2