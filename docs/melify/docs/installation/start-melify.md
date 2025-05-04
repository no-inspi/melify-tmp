---
sidebar_position: 4
---

# ▶️ Starting Melify

This guide will help you start the Melify platform and all its required services.

## Prerequisites

Before starting Melify, ensure you have:
- ✅ Set up [Gmail Integration](./gmail-integration)
- ✅ Completed the [Local Setup](./local-setup)
- ✅ MongoDB running locally or connection details ready

:::caution Important
If you haven't completed the installation steps, please go back to the [Installation Guide](./installation) first. The application won't start properly without the necessary configuration.
:::

## Step 1: Start Required Services

### Start Microservices
Initialize and start the CloudFront microservices:

```bash
# Make the initialization script executable
chmod +x ./init_cf.sh

# Run the initialization script
./init_cf.sh
```

This script will:
- Initialize CloudFront configuration
- Start email processing microservices
- Set up necessary API endpoints

## Step 2: Start the Melify Platform

### Install Dependencies
First, install all required dependencies:

```bash
# Install root dependencies
npm install
```

### Start Development Servers
Start all services concurrently:

```bash
npm start
```

This command will start:
- 🖥️ **Frontend**: Next.js development server at `http://localhost:3030`
- 🔧 **Backend API**: Node.js server at `http://localhost:8080`
- 🔄 **Hot Reloading**: Automatic reload on code changes

## Development Workflow

### Starting Individual Services
If you need to start services individually:

```bash
# Start only the frontend
npm run start:frontend

# Start only the API
npm run start:backend
```

### Useful Development Commands

```bash
# Run tests
npm test

# Run linting
npm run lint

# Build for production
npm run build
```

## Next Steps

Once all services are running successfully:

1. **Access the Application**: Open http://localhost:3030 in your browser
2. **Sign In**: Use Google SSO to authenticate
4. **Start Using Melify**: Begin processing and organizing your emails

## Production Deployment

Coming soon!

---

💡 **Tip**: Use `npm run dev` for a development environment with enhanced debugging capabilities and faster rebuilds.

🔍 **Note**: If you encounter any issues not covered here, please check our [Troubleshooting Guide](./troubleshooting) or open an issue on GitHub.