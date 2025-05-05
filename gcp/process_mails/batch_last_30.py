import os
from datetime import datetime, timedelta
import functions_framework
import time
import sentry_sdk
from constants import CATEGORIES, PROMPT_CATEGORIES, INSTRUCTIONS_TEMPLATE, INSTRUCTIONS_WITH_CONTEXT_TEMPLATE
from config import load_config
from user_utils import get_user_by_email
from google_utils import setup_gmail_service
from db_manager import MongoDBConnectionManager
from email_processor import fetch_email


# Initialize Sentry for error tracking
def init_sentry():
    sentry_sdk.init(
        dsn=os.environ.get('SENTRY_SDK'),
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

API_KEY_MISTRAL = os.environ.get('API_KEY_MISTRAL')
        
init_sentry()

@functions_framework.http
def batch_last_30_days(request):
    """
    Process emails from the last 30 days for a specified user.
    
    Args:
        request: HTTP request containing user email
        
    Returns:
        Dict with status and processing information
    """
    try:
        config = load_config()
        
        # Extract request data
        data = request.get_json()
        user_email = data.get('user_email', "")
        
        with MongoDBConnectionManager() as db:    
            accounts_collection = db.accounts
            
            existing_account = accounts_collection.find_one({'email': user_email})
    
            # Check if account exists
            if not existing_account:
                print(f"No account found for email: {user_email}")
                return {'status': 'error', 'message': 'Account not found'}, 404
            
            print(f"Processing account: {user_email}")

            user = get_user_by_email(user_email, db)
            update_categories_from_user(user)
            #user = users_collection.find_one({'email': user_email})
            gmail_service = setup_gmail_service(db, existing_account, config)
            if not gmail_service:
                return {'status': 'error', 'message': 'Failed to authenticate'}, 401
            
            emails_processed = process_recent_emails(
                gmail_service, 
                user_email, 
                db, 
                days=15
            )
            return {
                'status': 'success',
                "email_processed": emails_processed
            }
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error in batch_last_30_days: {str(e)}")
        return {'status': 'error', 'message': str(e)}

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
    
def process_recent_emails(gmail_service, user_email, db, days=30, batch_size=10):
    """
    Process emails from the recent past.
    
    Args:
        gmail_service: Authenticated Gmail API service
        user_email: User's email address
        db: Database connection
        days: Number of days in the past to process
        batch_size: Number of emails to process before pausing
        
    Returns:
        Number of new emails processed and stored
    """
    # Calculate timestamp for query
    days_ago = int((datetime.now() - timedelta(days=days)).timestamp())
    query = f'after:{days_ago}'
    
    # Fetch email IDs
    response = gmail_service.users().messages().list(userId='me', q=query).execute()
    messages = response.get('messages', [])
    
    # Track statistics
    emails_inserted = 0
    processed_count = 0
    
    for message in messages:
        try:
            # Skip already processed emails
            if db.emails.find_one({'messageId': message['id']}):
                continue
            
            # Process email
            email_data = fetch_email(gmail_service, user_email, message['id'], db, INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, INSTRUCTIONS_TEMPLATE, PROMPT_CATEGORIES, API_KEY_MISTRAL, CATEGORIES)

            # Store email data
            if email_data:
                current_time = datetime.now()
                email_data['createdAt'] = current_time
                email_data['updatedAt'] = current_time
                
                db.emails.insert_one(email_data)
                emails_inserted += 1
            
            # Rate limiting
            processed_count += 1
            if processed_count % batch_size == 0:
                print(f"Processed {batch_size} emails, pausing for rate limiting...")
                time.sleep(1)
                
        except Exception as e:
            sentry_sdk.capture_exception(e)
            print(f"Error processing message {message['id']}: {str(e)}")
            continue
    
    return emails_inserted