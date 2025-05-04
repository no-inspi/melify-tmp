#!/bin/bash

# Script to generate .env files from existing JSON configuration
# Usage: ./generate-env.sh [environment]
# Example: ./generate-env.sh production

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CONFIG_FILE="env.config.json"
DEFAULT_ENV="development"

# Function to print messages
error() { echo -e "${RED}Error: $1${NC}" >&2; exit 1; }
info() { echo -e "${BLUE}Info: ${NC}$1"; }
success() { echo -e "${GREEN}✓${NC} $1"; }
warning() { echo -e "${YELLOW}Warning: ${NC}$1"; }

# Check dependencies
command -v jq >/dev/null 2>&1 || error "jq is required but not installed. Please install jq first."

# Get environment from argument or use default
ENVIRONMENT="${1:-$DEFAULT_ENV}"

# Check if configuration file exists
if [ ! -f "$CONFIG_FILE" ]; then
    error "Configuration file not found: $CONFIG_FILE
    
Please create a JSON configuration file at the root of your project with the following structure:

{
  \"environments\": {
    \"development\": {
      \"client\": { ... },
      \"api\": { ... },
      \"gcp/process_mails\": { ... }
      \"./\": { ... }
    },
    \"production\": {
      \"client\": { ... },
      \"api\": { ... },
      \"gcp/process_mails\": { ... }
       \"./\": { ... }
    }
  },
  \"shared\": {
    \"OPENAI_API_KEY\": \"YOUR_API_KEY\",
    \"API_KEY_MISTRAL\": \"YOUR_API_KEY\"
  }
}"
fi

# Validate JSON configuration
if ! jq empty "$CONFIG_FILE" 2>/dev/null; then
    error "Invalid JSON in $CONFIG_FILE. Please check the JSON syntax."
fi

# Check if environment exists
if ! jq -e ".environments.\"$ENVIRONMENT\"" "$CONFIG_FILE" >/dev/null; then
    error "Environment '$ENVIRONMENT' not found in $CONFIG_FILE
    
Available environments:"
    jq -r '.environments | keys[]' "$CONFIG_FILE" | sed 's/^/  - /'
    exit 1
fi

# Function to create .env file
create_env_file() {
    local service=$1
    local target_path=$2
    local env_vars
    local shared_vars
    
    # Get environment-specific variables
    env_vars=$(jq -r ".environments.\"$ENVIRONMENT\".\"$service\" // {}" "$CONFIG_FILE")
    
    # Get shared variables
    shared_vars=$(jq -r ".shared // {}" "$CONFIG_FILE")
    
    # Create directory if it doesn't exist
    mkdir -p "$(dirname "$target_path")"
    
    # Create .env file
    {
        echo "# Generated from $CONFIG_FILE"
        echo "# Environment: $ENVIRONMENT"
        echo "# Service: $service"
        echo "# Generated: $(date)"
        echo ""
        
        # Add shared variables
        if [ "$(echo "$shared_vars" | jq 'length')" -gt 0 ]; then
            echo "# Shared variables"
            echo "$shared_vars" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"'
            echo ""
        fi
        
        # Add service-specific variables
        echo "# Service-specific variables"
        echo "$env_vars" | jq -r 'to_entries | .[] | "\(.key)=\(.value)"'
    } > "$target_path"
    
    success "Created $target_path"
}

# Function to validate configuration
validate_config() {
    local has_error=0
    
    # Check for placeholder variables in production/staging
    if [[ "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
        local services=("frontend" "backend" "scripts")
        
        for service in "${services[@]}"; do
            # Check if service exists in the environment
            if ! jq -e ".environments.\"$ENVIRONMENT\".\"$service\"" "$CONFIG_FILE" >/dev/null; then
                continue
            fi
            
            local vars=$(jq -r ".environments.\"$ENVIRONMENT\".\"$service\" // {}" "$CONFIG_FILE")
            
            # Find variables with ${} placeholders
            local placeholders=$(echo "$vars" | jq -r 'to_entries | .[] | select(.value | test("^\\$\\{.*\\}$")) | .key')
            
            if [ -n "$placeholders" ]; then
                warning "The following $service variables in $ENVIRONMENT contain placeholders:"
                echo "$placeholders" | sed 's/^/  - /'
                has_error=1
            fi
        done
        
        if [ $has_error -eq 1 ]; then
            echo
            warning "These placeholders should be replaced with actual values in your CI/CD pipeline"
        fi
    fi
    
    return $has_error
}

# Function to list all available environments
list_environments() {
    echo "Available environments in $CONFIG_FILE:"
    jq -r '.environments | keys[]' "$CONFIG_FILE" | sed 's/^/  - /'
}

# Main execution
echo "Environment Generator for Monorepo"
echo "================================="
echo

# Handle help command
if [[ "$1" == "help" || "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Usage: $0 [environment]"
    echo
    echo "Arguments:"
    echo "  environment   The environment to use (default: $DEFAULT_ENV)"
    echo
    echo "Examples:"
    echo "  $0              # Use default environment (development)"
    echo "  $0 production   # Use production environment"
    echo "  $0 staging      # Use staging environment"
    echo
    echo "The script expects a configuration file at: $CONFIG_FILE"
    echo
    list_environments
    exit 0
fi

info "Using configuration file: $CONFIG_FILE"
info "Using environment: $ENVIRONMENT"
echo

# Validate configuration
validate_config

# Generate .env files
info "Generating .env files..."
echo

# Get all services defined for the environment
services=$(jq -r ".environments.\"$ENVIRONMENT\" | keys[]" "$CONFIG_FILE")

if [ -z "$services" ]; then
    error "No services found for environment '$ENVIRONMENT'"
fi

for service in $services; do
    case "$service" in
        "client")
            create_env_file "$service" "./client/.env"
            ;;
        "api")
            create_env_file "$service" "./api/.env"
            ;;
        "gcp/process_mails")
            create_env_file "$service" "./gcp/process_mails/.env"
            ;;
        *)
            # For any other service, create in a directory with the service name
            create_env_file "$service" "./$service/.env"
            ;;
    esac
done

# Create example files if in development environment
if [ "$ENVIRONMENT" = "development" ]; then
    echo
    info "Creating .env.dev files..."
    echo
    
    for service in $services; do
        case "$service" in
            "client")
                cp "./client/.env" "./client/.env.dev" 2>/dev/null && success "Created ./client/.env.dev"
                ;;
            "api")
                cp "./api/.env" "./api/.env.dev" 2>/dev/null && success "Created ./api/.env.dev"
                ;;
            "gcp/process_mails")
                cp "./gcp/process_mails/.env" "./gcp/process_mails/.env.dev" 2>/dev/null && success "Created ./gcp/process_mails/.env.dev"
                ;;
            *)
                cp "./$service/.env" "./$service/.env.dev" 2>/dev/null && success "Created ./$service/.env.dev"
                ;;
        esac
    done
fi

# Update .gitignore
if [ ! -f .gitignore ]; then
    touch .gitignore
fi

if ! grep -q "^\.env$" .gitignore; then
    echo ".env" >> .gitignore
    success "Added .env to .gitignore"
fi

echo
success "Environment files generated successfully!"
echo
echo "Summary:"
echo "- Configuration file: $CONFIG_FILE"
echo "- Environment: $ENVIRONMENT"
echo "- Services configured: $services"
echo

if [[ "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
    echo "Note: For production/staging environments, make sure to replace"
    echo "placeholder values (e.g., \${DATABASE_URL}) with actual values"
    echo "in your deployment pipeline."
    echo
fi