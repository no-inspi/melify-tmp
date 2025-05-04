---
sidebar_position: 4
---

# 📧 Gmail Integration

Melify uses the Gmail API to read and process emails securely.

## 🔐 OAuth2 Flow

1. User logs in with Google OAuth2.
2. A refresh token and access token are stored.
3. Backend uses the Gmail API to fetch messages.

## 🔔 Real-Time Updates

Google Pub/Sub pushes notifications to a Cloud Function when new emails arrive. The function:

- Verifies the request
- Fetches new emails
- Stores them in MongoDB
- Notifies the frontend via WebSocket

## 📦 Email Data Model

Emails are stored with fields like `subject`, `sender`, `labels`, `threadId`, `vector_embedding`, etc.

