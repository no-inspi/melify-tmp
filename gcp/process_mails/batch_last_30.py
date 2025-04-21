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
from utils import convert_to_iso8601_utc, parse_mistral_response, fetch_email
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
        self.client = MongoClient(os.getenv('URI_MONGODB', "mongodb://localhost:27017"))
        self.db = self.client[os.environ.get('DATABASE_NAME')]
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.client.close()

@functions_framework.http
def batch_last_30_days(request):
    try:
        with MongoDBConnectionManager() as db:
                
            tokens_collection = db.tokens
            emails_collection = db.emails
            
            data = request.get_json()
            
            user_email = data.get('user_email', "")

            user = get_user_by_email(user_email, db)

            update_categories_from_user(user)
            #user = users_collection.find_one({'email': user_email})
            user_tokens = tokens_collection.find_one({'userId': user['_id']})
            
            if not user_tokens:
                return 'User tokens not found', 404
            
            access_token = user_tokens.get('accessToken')
            refresh_token = user_tokens.get('refreshToken')
            
            access_token, new_refresh_token = refresh_access_token(refresh_token)
            if new_refresh_token != refresh_token:
                db.tokens.update_one({'userId': user['_id']}, {'$set': {'refreshToken': new_refresh_token}})
            
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
            
            # Query emails from the past 30 days
            thirty_days_ago = int((datetime.now() - timedelta(days=15)).timestamp())
            query = f'after:{thirty_days_ago}'

            # Fetch email IDs
            messages = gmail.users().messages().list(userId='me', q=query).execute().get('messages', [])

            # Fetch email details
            numberofmailsinserted = 0
            processed_count = 0
            
            for message in messages:
                try:
                    email = emails_collection.find_one({'messageId': message['id']})
                    
                    if email:
                        continue
                    
                    email_data = fetch_email(gmail, user_email, message['id'], db, INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, INSTRUCTIONS_TEMPLATE, PROMPT_CATEGORIES, API_KEY_MISTRAL, CATEGORIES)
                    current_time = datetime.now()
                    if email_data:
                        email_data['createdAt'] = current_time
                        email_data['updatedAt'] = current_time
                        
                        emails_collection.insert_one(email_data)
                        
                        numberofmailsinserted += 1
                        processed_count += 1
                    else:
                        print(f"Failed to fetch details for email ID {message['id']}.")
                    
                    
                    if processed_count % 10 == 0:
                        print("Processed 10 emails, waiting for 1 second...")
                        time.sleep(1)
                except Exception as e:
                    sentry_sdk.capture_exception(e)
                    print(f"Error processing message {message['id']}: {str(e)}")
                    continue
            return {
                'status': 'success',
                #'emails': emails
                "email_processed": numberofmailsinserted
            }
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error in batch_last_30_days: {str(e)}")
        return {'status': 'error', 'message': str(e)}

def is_access_token_valid(access_token):
    # Check if token is valid by making a simple API call
    response = requests.get('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + access_token)
    return response.status_code == 200

def refresh_access_token(refresh_token):
    data = {
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token'
    }
    response = requests.post('https://oauth2.googleapis.com/token', data=data)
    response_data = response.json()
    return response_data.get('access_token'), response_data.get('refresh_token', refresh_token)

def get_user_by_email(email, db):
    users_collection = db.users
    
    pipeline = [
        {"$match": {"email": email}},  # Match the user by email
        {"$lookup": {
            "from": "profiletypes",  # The collection to join with
            "localField": "profileType",  # The field from the users collection
            "foreignField": "_id",  # The field from the profileTypes collection
            "as": "profileTypeInfo"  # The output array field which will contain the joined data
        }},
        {"$unwind": "$profileTypeInfo"},  # Optional: Deconstructs the array field from the output to promote its objects to the top level
    ]
    
    result = users_collection.aggregate(pipeline)
    
     # Convert the result to a list and return
    user_info = list(result)
    return user_info[0] if user_info else None

def update_categories_from_user(user):
    global PROMPT_CATEGORIES, CATEGORIES

    # Extract categories and descriptions from the user's profile type information
    new_categories = []
    category_descriptions = []

    for category in user['profileTypeInfo']['categories']:
        if category['disable'] == False:
            new_categories.append(category['name'])
            description = category.get('description', '')  # Default to empty string if no description
            category_descriptions.append(f"{category['name']}: {description}")

    # Update the CATEGORIES list
    CATEGORIES = new_categories

    # Update the PROMPT_CATEGORIES string with descriptions
    PROMPT_CATEGORIES = "\n" + "\n".join(category_descriptions) + "\n"