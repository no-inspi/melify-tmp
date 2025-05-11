---
sidebar_position: 2
---

# 📧 Gmail Integration

Melify uses the Gmail API to read and process emails securely. This guide will walk you through setting up Google OAuth 2.0 authentication to enable Gmail integration.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Admin access to your project

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown in the top navigation bar
3. Click "New Project"
4. Enter a project name (e.g., "melify-development")
5. Click "Create"

## Step 2: Enable the Gmail API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Gmail API"
3. Click on "Gmail API" in the results
4. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Navigate to "APIs & Services" > "OAuth consent screen"
2. Select "External" if you want to allow any Google account, or "Internal" for organization-only access
3. Click "Create"
4. Fill in the required information:
   - **App name**: Melify
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add the following scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://mail.google.com/`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
   - `https://www.googleapis.com/auth/calendar.readonly`
8. Click "Update" and then "Save and Continue"
9. Add your email in test users to be able to use it in Melify platform
10. Review and click "Back to Dashboard"

## Step 4: Create OAuth 2.0 Client ID

1. Navigate to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Fill in the following:
   - **Name**: Melify Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3030` (for development)
     - Your production URL (when deploying)
   - **Authorized redirect URIs**:
     - `http://localhost:8080/api/auth/googleredirect`
     - Your production redirect URIs
5. Click "Create"

## Step 5: Retrieve Client ID and Secret

After creating the OAuth client, you'll see a dialog with your credentials:

- **Client ID**: Copy this value for `GOOGLE_CLIENT_ID`
- **Client Secret**: Copy this value for `GOOGLE_CLIENT_SECRET`

:::caution
Keep your Client Secret secure! Never commit it to version control or expose it publicly.
:::

## Step 6: Configure Environment Variables

Add the following environment variables to your configuration (We'll do the env setup on the next step):

### Client 
```env
NEXT_PUBLIC_CLIENT_ID=<YOUR_CLIENT_ID>
```

### API 
```env
GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_CLIENT_SECRET>
```

### Root
```env
GOOGLE_CLIENT_ID=<YOUR_CLIENT_ID>
GOOGLE_CLIENT_SECRET=<YOUR_CLIENT_SECRET>
```

## Troubleshooting

### Common Issues

1. **Invalid Client Error**
   - Verify that your Client ID and Secret are correctly copied
   - Ensure redirect URIs match exactly (including http/https and trailing slashes)

2. **Access Denied**
   - Check that all required scopes are added to the OAuth consent screen
   - Verify the user has granted necessary permissions

3. **Redirect URI Mismatch**
   - Double-check that all redirect URIs in Google Cloud Console match your application's configuration
   - Remember to add both development and production URIs

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Cloud Console](https://console.cloud.google.com)

:::tip
For production deployments, consider using Google Cloud Secret Manager or similar services to manage your secrets securely.
:::