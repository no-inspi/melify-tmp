import os
import pymongo
from pymongo import MongoClient
from datetime import datetime, timedelta
import pytz
import functions_framework
import time
import requests
import json
import re
import string
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import base64
from typing import Dict, Any, List
from email.utils import parsedate_to_datetime
from utils import fetch_email, get_user_by_email, refresh_access_token
import sentry_sdk

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_SDK'),
    # Set traces_sample_rate to 1.0 to capture 100%
    # of transactions for tracing.
    traces_sample_rate=1.0,
    # Set profiles_sample_rate to 1.0 to profile 100%
    # of sampled transactions.
    # We recommend adjusting this value in production.
    profiles_sample_rate=1.0,
)

PROMPT_CATEGORIES = """
Personal, Work-Related, Transactional, Notifications/Promotions, Educational, Legal and Administrative, Health, Travel
"""

CATEGORIES = [
    "Personal", 
    "Work-Related", 
    "Transactional", 
    "Notifications/Promotions", 
    "Educational",
    "Legal and Administrative",
    "Health",
    "Travel"
]

INSTRUCTIONS_TEMPLATE = """
You are an expert in email categorization and summarization, assisting a user within an email client. Your task is to:

1. Categorize the email or thread:
   - Select the category that best represents the main purpose of the email or thread. 
   - Choose from the list below, updating the category if a new email in the thread shifts the primary focus:
   {PROMPT_CATEGORIES}
   If no category fits, classify it as: Other.

2. Summarize the email or thread:
   - Generate a concise summary that allows the user to quickly grasp the key information without reading the entire thread.
   - Preserve any links as interactive if referenced in the summary.
   - For short emails, use a single-sentence summary. For longer threads, provide a list format that captures crucial details, such as prices, quantities, appointment times, meeting links, or recipient actions.

Use a neutral, clear tone, and present only the most relevant information for quick reference.

Respond with a JSON object containing:
- "category": the selected category
- "summary": the summary

Do not include any text outside of this JSON object.

<<<
sender: {sender}
subject: {subject}
email text: {text}
>>>
"""


INSTRUCTIONS_WITH_CONTEXT_TEMPLATE = """
You are an expert in email categorization and summarization, assisting a user within an email client. Your task is to:

1. Categorize the email or thread:
   - Select the category that best represents the main purpose of the email or thread.
   - Choose from the list below, updating the category if a new email in the thread shifts the primary focus:
   {PROMPT_CATEGORIES}
   If no category fits, classify it as: Other.

2. Summarize the email or thread:
   - Generate a concise summary, using past thread summaries as context.
   - Preserve any links as interactive if referenced in the summary.
   - For short emails, use a single-sentence summary. For longer threads, provide a list format that captures crucial details, such as prices, quantities, appointment times, meeting links, or recipient actions.

Use a neutral, clear tone, and present only the most relevant information for quick reference.

Respond with a JSON object containing:
- "category": the selected category
- "summary": the summary

Do not include any text outside of this JSON object.

<<<
sender: {sender}
subject: {subject}
email text: {text}
summary and category of past email threads:
    category: {past_thread_category}
    summary: {past_thread_summary}
>>>
"""
client_id = os.environ.get('GOOGLE_CLIENT_ID')
client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')

API_KEY_MISTRAL = os.environ.get('API_KEY_MISTRAL')

class MongoDBConnectionManager:
    def __enter__(self):
        self.client = MongoClient(os.getenv('URI_MONGODB', "mongodb://127.0.0.1:27017"))
        self.db = self.client[os.environ.get('DATABASE_NAME')]
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()

@functions_framework.http
def transform_email(request):
    try:
        with MongoDBConnectionManager() as db:
            tokens_collection = db.tokens
            accounts_collection = db.accounts
            
            data = request.get_json()
            
            user_email = data.get('user_email', "")
            messageId = data.get('messageId', "")
            
            existing_account = accounts_collection.find_one({'email': user_email})
    
            # Check if account exists
            if not existing_account:
                print(f"No account found for email: {user_email}")
                return None
            
            print(f"Existing account: {existing_account}")

            user = get_user_by_email(user_email, db)
            
            user_tokens = tokens_collection.find_one({'accountId': existing_account['_id']})
            
            if not user_tokens:
                return 'User tokens not found', 404
            
            access_token = user_tokens.get('accessToken')
            refresh_token = user_tokens.get('refreshToken')
            
            access_token, new_refresh_token = refresh_access_token(refresh_token, client_id, client_secret)
            if new_refresh_token != refresh_token:
                db.tokens.update_one({'accountId': existing_account['_id']}, {'$set': {'refreshToken': new_refresh_token}})
            
            token_data = {
                "token": access_token,  # Your access token
                "refresh_token": refresh_token,  # Your refresh token
                "token_uri": "https://oauth2.googleapis.com/token",  # Token URI for Google
                "client_id": client_id,  # Your OAuth2 client ID
                "client_secret": client_secret,  # Your OAuth2 client secret
                "scopes": ["https://www.googleapis.com/auth/gmail.readonly"],
            }
            credentials = Credentials(**token_data) 
            
            gmail = build('gmail', 'v1', credentials=credentials)
            
            email_data = fetch_email(gmail, user_email, messageId, db, INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, INSTRUCTIONS_TEMPLATE, PROMPT_CATEGORIES, API_KEY_MISTRAL, CATEGORIES)
            
            return email_data
    
            
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error in transform emails: {str(e)}")
        return {'status': 'error', 'message': str(e)}