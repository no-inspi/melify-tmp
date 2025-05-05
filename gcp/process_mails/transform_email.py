import os
import functions_framework
import sentry_sdk

from constants import CATEGORIES, PROMPT_CATEGORIES, INSTRUCTIONS_TEMPLATE, INSTRUCTIONS_WITH_CONTEXT_TEMPLATE
from config import load_config
from user_utils import get_user_by_email
from google_utils import setup_gmail_service
from db_manager import MongoDBConnectionManager
from email_processor import fetch_email

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

API_KEY_MISTRAL = os.environ.get('API_KEY_MISTRAL')

@functions_framework.http
def transform_email(request):
    try:
        config = load_config()
        data = request.get_json()
            
        user_email = data.get('user_email', "")
        messageId = data.get('messageId', "")
        
        with MongoDBConnectionManager() as db:
            accounts_collection = db.accounts
            
            existing_account = accounts_collection.find_one({'email': user_email})
    
            # Check if account exists
            if not existing_account:
                print(f"No account found for email: {user_email}")
                return None
            
            print(f"Existing account: {existing_account}")
            
            gmail_service = setup_gmail_service(db, existing_account, config)
            
            email_data = fetch_email(gmail_service, user_email, messageId, db, INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, INSTRUCTIONS_TEMPLATE, PROMPT_CATEGORIES, API_KEY_MISTRAL, CATEGORIES)
            
            return email_data
    
            
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error in transform emails: {str(e)}")
        return {'status': 'error', 'message': str(e)}