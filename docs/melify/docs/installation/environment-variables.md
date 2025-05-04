---
sidebar_position: 5
---


# 🔐 Environment Variables

Melify uses environment variables across all services.

# Environment Variables

This page documents all environment variables used across different components of the project.

## Development Environment

### Client Configuration

Configuration for the Next.js client application.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Specifies the environment in which the application is running | Yes | `development` |
| `NEXT_PUBLIC_SERVER_URL` | The URL of the backend API server | Yes | `http://localhost:8080` |
| `NEXT_PUBLIC_ASSET_URL` | The URL for serving static assets | Yes | `http://localhost:8080` |
| `NEXT_PUBLIC_CLIENT_ID` | Google OAuth client ID for authentication | Yes | - |
| `NEXT_CF_URL` | Cloud Function base URL  | No | - |
| `NEXT_PUBLIC_USE_TIPTAP` | Flag to enable/disable Tiptap editor | No | `false` |

### API Configuration

Configuration for the backend API service.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Specifies the environment in which the application is running | Yes | `development` |
| `FRONT_URL` | The URL of the frontend client application | Yes | `http://localhost:3030` |
| `ENVIRONMENT_URL` | The API environment's public URL | Yes | `http://localhost:8080` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID for authentication | Yes | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret for authentication | Yes | - |
| `MONGODB_URI` | MongoDB connection string | Yes | `mongodb://localhost:27017/melifydevelopment` |
| `LAST30DAYS` | URL for service retrieving last 30 days of email data | Yes | `http://localhost:8082/last30days` |
| `RETRIEVEEMAILBYLABELS` | URL for service retrieving emails by labels | Yes | `http://localhost:8083/retrieveemailbylabels` |
| `TOPICNAME` | Google Cloud Pub/Sub topic name for Gmail notifications | No | `projects/melify-development/topics/gmail-notifications` |

### GCP Process Mails Service

Configuration for the Google Cloud Platform email processing service.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `SENTRY_SDK` | Sentry SDK key for error tracking | Yes | - |

### Root Configuration

Global configuration at the project root level.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_NAME` | Name of the MongoDB database | Yes | `melifydevelopment` |
| `URI_MONGODB` | MongoDB connection URI | Yes | `mongodb://127.0.0.1:27017` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes | - |

## Shared Configuration

Environment variables shared across all components.

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key for AI services | Yes | - |
| `API_KEY_MISTRAL` | Mistral AI API key for AI services | Yes | - |

## Notes

- All variables marked as "Required" must be set for the application to function properly.
- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser in Next.js applications.
- Sensitive variables like API keys and secrets should never be committed to version control.
- For local development, copy `.env.example` to `.env` and fill in your values.

Remember to:
- Keep all secrets and API keys secure
- Use different values for development, staging, and production environments
- Rotate secrets regularly
- Use environment variable management tools in production (e.g., AWS Secrets Manager, HashiCorp Vault)