---
sidebar_position: 2
---

# 🧱 Architecture Overview

Melify is a modular system designed for extensibility and performance.

## 📐 Components

- **Frontend**: React + Material UI
- **Backend**: NestJS (Node.js), JWT-auth, REST & WebSocket APIs
- **Database**: MongoDB (Mongoose ODM)
- **AI Layer**: Python workers using LangChain + vector search
- **Infrastructure**:
  - Gmail API + Pub/Sub notifications
  - Google Cloud Functions for Gmail webhooks
  - Azure VMs or Kubernetes for hosting

## 🔁 Email Lifecycle

1. OAuth2 login grants Gmail access.
2. Gmail push notifications trigger a Cloud Function.
3. Emails are stored and processed in MongoDB.
4. Summarization/categorization jobs are run by AI workers.
5. Frontend receives real-time updates via WebSocket.

