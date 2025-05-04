---
sidebar_position: 3
---

# 📦 Local Setup

### Clone Repository

```bash
git clone https://github.com/melifypublicrepo/melify.git
```

### Install Dependencies

```bash
cd melify

npm install
```

### Init MongoDb (Optionnal)

if you don't already have a mongodb instance running locally or self hosted, you can init it using melify init script

```bash
chmod +x ./db_init.sh
./db_init.sh
```

### Generate env files

To generate all env files easily, we created a simple script. But first, you need to create a env.config.json file.
It will contain every env value we need.

First create the file :

```bash
touch env.config.json
```

Here is an example of env.config.json (you can check env.config.example.json)

```json
{
  "environments": {
    "development": {
      "client": {
        "NODE_ENV": "development",
        "NEXT_PUBLIC_SERVER_URL": "http://localhost:8080",
        "NEXT_PUBLIC_ASSET_URL": "http://localhost:8080",
        "NEXT_PUBLIC_CLIENT_ID": "<YOUR_CLIENT_ID>",
        "NEXT_CF_URL": "<YOUR_CF_URL>",
        "NEXT_PUBLIC_USE_TIPTAP": false
      },
      "api": {
        "NODE_ENV": "development",
        "FRONT_URL": "http://localhost:3030",
        "ENVIRONMENT_URL": "http://localhost:8080",
        "GOOGLE_CLIENT_ID": "<YOUR_CLIENT_ID>",
        "GOOGLE_CLIENT_SECRET": "<YOUR_CLIENT_SECRET>",
        "MONGODB_URI": "mongodb://localhost:27017/melifydevelopment",
        "LAST30DAYS": "http://localhost:8082/last30days",
        "RETRIEVEEMAILBYLABELS": "http://localhost:8083/retrieveemailbylabels",
        "TOPICNAME": "projects/melify-development/topics/gmail-notifications"
      },
      "gcp/process_mails": {
        "SENTRY_SDK": "<YOUR_SENTRY_SDK>"
      },
      "./": {
        "DATABASE_NAME": "melifydevelopment",
        "URI_MONGODB": "mongodb://127.0.0.1:27017",
        "GOOGLE_CLIENT_ID": "<YOUR_CLIENT_ID>",
        "GOOGLE_CLIENT_SECRET": "<YOUR_CLIENT_SECRET>"
      }
    }
  },
  "shared": {
    "OPENAI_API_KEY": "<YOUR_OPENAI_API_KEY>",
    "API_KEY_MISTRAL": "<YOUR_API_KEY_MISTRAL>"
  }
}
```

Once you have your env.config.json setup, we can use the script to generate all .env files

```bash
chmod +x ./generate_env.sh
./generate_env.sh
```

You'll see something like this

```bash
Environment Generator for Monorepo
=================================

Info: Using configuration file: env.config.json
Info: Using environment: development

Info: Generating .env files...

✓ Created ././/.env
✓ Created ./api/.env
✓ Created ./client/.env
✓ Created ./gcp/process_mails/.env

Info: Creating .env.dev files...

✓ Created ././/.env.dev
✓ Created ./api/.env.dev
✓ Created ./client/.env.dev
✓ Created ./gcp/process_mails/.env.dev

✓ Environment files generated successfully!

Summary:
- Configuration file: env.config.json
- Environment: development
- Services configured: ./
api
client
gcp/process_mails
```
