from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from auth_utils import refresh_access_token

def setup_gmail_service(db, existing_account, config):
    user_tokens = db.tokens.find_one({'accountId': existing_account['_id']})
    if not user_tokens:
        return None
    
    access_token = user_tokens.get('accessToken')
    refresh_token = user_tokens.get('refreshToken')

    access_token, new_refresh_token = refresh_access_token(refresh_token, config['client_id'], config['client_secret'])
    
    if new_refresh_token != refresh_token:
        db.tokens.update_one({'accountId': existing_account['_id']}, {'$set': {'refreshToken': new_refresh_token}})
            
    token_data = {
        "token": access_token,  # Your access token
        "refresh_token": refresh_token,  # Your refresh token
        "token_uri": "https://oauth2.googleapis.com/token",  # Token URI for Google
        "client_id": config['client_id'],  # Your OAuth2 client ID
        "client_secret": config['client_secret'],  # Your OAuth2 client secret
        "scopes": ["https://www.googleapis.com/auth/gmail.readonly"],
    }
    credentials = Credentials(**token_data)    
    gmail = build('gmail', 'v1', credentials=credentials)
    return gmail

def setup_calendar_service(db, existing_account, config):
    user_tokens = db.tokens.find_one({'accountId': existing_account['_id']})
    if not user_tokens:
        return None
    
    access_token = user_tokens.get('accessToken')
    refresh_token = user_tokens.get('refreshToken')
    
    access_token, new_refresh_token = refresh_access_token(refresh_token, config['client_id'], config['client_secret'])
    
    if new_refresh_token != refresh_token:
        db.tokens.update_one({'accountId': existing_account['_id']}, {'$set': {'refreshToken': new_refresh_token}})
            
    token_data = {
        "token": access_token,  # Your access token
        "refresh_token": refresh_token,  # Your refresh token
        "token_uri": "https://oauth2.googleapis.com/token",  # Token URI for Google
        "client_id": config['client_id'],  # Your OAuth2 client ID
        "client_secret": config['client_secret'],  # Your OAuth2 client secret
        "scopes": ["https://www.googleapis.com/auth/calendar.readonly"],
    }
    credentials = Credentials(**token_data)    
    gmail = build('calendar', 'v3', credentials=credentials)
    return gmail
    