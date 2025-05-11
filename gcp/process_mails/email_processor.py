import sentry_sdk
import requests

from utils import decode_email_body, clean_email_text, truncate_text, count_tokens, parse_mistral_response, convert_to_iso8601_utc
from calendar_utils import is_calendar_invitation

TOKEN_LIMIT = 30000

def fetch_email(service, user_email, message_id, db, INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, 
             INSTRUCTIONS_TEMPLATE, PROMPT_CATEGORIES, API_KEY_MISTRAL, CATEGORIES):
    """
    Fetch and process an email's details using the Gmail API.
    
    Args:
        service: Authenticated Gmail API service
        user_email: User's email address
        message_id: Gmail message ID
        db: Database connection
        INSTRUCTIONS_WITH_CONTEXT_TEMPLATE: Template for emails with thread context
        INSTRUCTIONS_TEMPLATE: Template for new emails
        PROMPT_CATEGORIES: Categories formatted for AI prompt
        API_KEY_MISTRAL: API key for Mistral AI
        CATEGORIES: List of valid email categories
        
    Returns:
        Dictionary containing processed email details or None if processing failed
    """
    try:
        # Get database collections
        threads_collection = db.threads
        
        # Fetch the message from Gmail API
        message = service.users().messages().get(userId=user_email, id=message_id, format='full').execute()
        
        # Extract message headers for easier access
        headers = {header['name']: header['value'] for header in message['payload']['headers']}
        
        # Decode email body (HTML and text)
        decoded_body = decode_email_body(message['payload'], service, user_email, message_id)
        
        # Check if this message is part of an existing thread
        existing_thread = threads_collection.find_one({'threadId': message["threadId"]})
        
        # Process email category and summary
        category_obj = process_email_categorization(
            message, 
            decoded_body, 
            existing_thread, 
            headers,
            INSTRUCTIONS_WITH_CONTEXT_TEMPLATE,
            INSTRUCTIONS_TEMPLATE,
            PROMPT_CATEGORIES,
            API_KEY_MISTRAL,
            CATEGORIES
        )
        
        # Update or create thread in database
        update_thread_in_database(
            threads_collection,
            message["threadId"],
            category_obj,
            headers.get('Delivered-To')
        )
        
        # Build complete message details
        message_details = build_message_details(
            message, 
            message_id, 
            headers, 
            decoded_body, 
            category_obj
        )
        
        # Add draft ID if message is a draft
        if 'DRAFT' in message.get('labelIds', []):
            add_draft_id_to_message(service, user_email, message_id, message_details)
        
        return message_details
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error fetching email with ID {message_id}: {e}")
        return None


def process_email_categorization(message, decoded_body, existing_thread, headers,
                               INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, INSTRUCTIONS_TEMPLATE,
                               PROMPT_CATEGORIES, API_KEY_MISTRAL, CATEGORIES):
    """
    Process email to determine category and summary.
    
    Args:
        message: Gmail message object
        decoded_body: Decoded email content
        existing_thread: Existing thread document from database
        headers: Email headers dictionary
        INSTRUCTIONS_WITH_CONTEXT_TEMPLATE: Template for emails with thread context
        INSTRUCTIONS_TEMPLATE: Template for new emails
        PROMPT_CATEGORIES: Categories formatted for AI prompt
        API_KEY_MISTRAL: API key for Mistral AI
        CATEGORIES: List of valid email categories
        
    Returns:
        Dictionary with category, summary and text
    """
    # Initialize with default values
    if 'DRAFT' in message.get('labelIds', []):
        # For draft emails, use default values
        return {
            "category": "Draft",
            "summary": "Hey I'm a draft.",
            "text": "Draft email - Mistral not called."
        }
    
    # Get email text content
    email_text = decoded_body.get('text', '').strip()
    
    # If no text content, return default
    if not email_text:
        return {
            "category": "Other",
            "summary": "No summary available.",
            "text": "No text email or no content - Mistral not called."
        }
        
    # Prepare Mistral API prompt based on whether thread exists
    prompt = prepare_mistral_prompt(
        email_text, 
        headers, 
        existing_thread, 
        INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, 
        INSTRUCTIONS_TEMPLATE, 
        PROMPT_CATEGORIES
    )
    
    # Check token count
    token_count = count_tokens(prompt)
    print(f"Token count: {token_count}")

    # Process with Mistral API if within token limit
    if token_count <= TOKEN_LIMIT:
        return call_mistral_api(prompt, API_KEY_MISTRAL, CATEGORIES)
    else:
        print("Error: Token count exceeds the limit even after truncation.")
        return {
            "category": "Other",
            "summary": "Token limit exceeded - Mistral not called.",
            "text": "Token limit exceeded."
        }


def prepare_mistral_prompt(email_text, headers, existing_thread, 
                          INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, INSTRUCTIONS_TEMPLATE, 
                          PROMPT_CATEGORIES):
    """
    Prepare the prompt for Mistral API.
    
    Args:
        email_text: Email text content
        headers: Email headers dictionary
        existing_thread: Existing thread document from database
        INSTRUCTIONS_WITH_CONTEXT_TEMPLATE: Template for emails with thread context
        INSTRUCTIONS_TEMPLATE: Template for new emails
        PROMPT_CATEGORIES: Categories formatted for AI prompt
        
    Returns:
        Formatted prompt string
    """
    # Clean and truncate the email text
    cleaned_text = truncate_text(clean_email_text(email_text), 5000)
    
    # Get sender and subject from headers
    sender = headers.get('From', 'Unknown Sender')
    subject = headers.get('Subject', 'No Subject')
    
    # If thread exists, use context template
    if existing_thread:
        # Get the category prioritizing user category over generated
        thread_category = (
            existing_thread.get('userCategory') 
            if existing_thread.get('userCategory') not in (None, '') 
            else existing_thread.get('generatedCategory', '')
        )
        
        return INSTRUCTIONS_WITH_CONTEXT_TEMPLATE.format(
            sender=sender,
            subject=subject,
            past_thread_summary=existing_thread['summary'],
            past_thread_category=thread_category,
            text=cleaned_text,
            PROMPT_CATEGORIES=PROMPT_CATEGORIES
        )
    else:
        # For new threads, use the basic template
        return INSTRUCTIONS_TEMPLATE.format(
            sender=sender,
            subject=subject,
            text=cleaned_text,
            PROMPT_CATEGORIES=PROMPT_CATEGORIES
        )


def call_mistral_api(prompt, API_KEY_MISTRAL, CATEGORIES):
    """
    Call Mistral API to categorize and summarize email.
    
    Args:
        prompt: Formatted prompt string
        API_KEY_MISTRAL: API key for Mistral
        CATEGORIES: List of valid categories
        
    Returns:
        Dictionary with category, summary and text
    """
    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY_MISTRAL}"
        }
        data = {
            "model": "open-mistral-7b",
            "messages": [{"role": "user", "content": prompt}],
        }
        
        response = requests.post("https://api.mistral.ai/v1/chat/completions", 
                               json=data, headers=headers)
        
        # Process the response
        mistral_response = response.json()
        return parse_mistral_response(
            mistral_response["choices"][0]["message"]["content"], 
            CATEGORIES
        )
    except Exception as e:
        print(f"Error calling Mistral API: {e}")
        return {
            "category": "Other",
            "summary": "Error processing with AI.",
            "text": f"Error: {str(e)}"
        }


def update_thread_in_database(threads_collection, thread_id, category_obj, delivered_to):
    """
    Update or create thread in database.
    
    Args:
        threads_collection: Database collection for threads
        thread_id: Gmail thread ID
        category_obj: Object containing category and summary
        delivered_to: Email's Delivered-To header value
    """
    # Check if thread exists
    existing_thread = threads_collection.find_one({'threadId': thread_id})
    
    if existing_thread:
        # Update existing thread
        threads_collection.update_one(
            {'threadId': thread_id},
            {'$set': {
                'summary': category_obj['summary'],
                "userCategory": "",
                "generatedCategory": category_obj['category'],
            }}
        )
    else:
        # Create new thread
        new_thread = {
            'threadId': thread_id,
            'summary': category_obj['summary'],
            "userCategory": "",
            "generatedCategory": category_obj['category'],
        }
        
        # Add delivered_to if available
        if delivered_to:
            new_thread['deliveredTo'] = delivered_to
            
        threads_collection.insert_one(new_thread)


def build_message_details(message, message_id, headers, decoded_body, category_obj):
    """
    Build complete message details object.
    
    Args:
        message: Gmail message object
        message_id: Gmail message ID
        headers: Email headers dictionary
        decoded_body: Decoded email content
        category_obj: Object containing category and summary
        
    Returns:
        Dictionary with complete message details
    """
    # Convert date string to ISO format
    date_str = headers.get('Date', '')
    date_iso = convert_to_iso8601_utc(date_str)
    
    # Build the message details object
    message_details = {
        'messageId': message_id,
        'subject': headers.get('Subject', 'No Subject'),
        'from': headers.get('From', 'Unknown Sender'),
        'to': headers.get('To', 'No Recipients'),
        'date': date_iso,
        'labelIds': message.get("labelIds", []),
        'threadId': message.get("threadId", ""),
        'snippet': message.get("snippet", ""),
        "html": decoded_body.get("html", ""),
        "text": decoded_body.get("text", ""),
        "summary": category_obj.get("summary", ""),
        "isGoogleInvitation": is_calendar_invitation(message),
        "userCategory": "",
        "generatedCategory": category_obj.get('category', "Other"),
        "mistralOutputText": category_obj.get("text", ""),
        "attachments": decoded_body.get("attachments", []),
        "payload": message.get('payload', {}),
    }
    
    # Add optional fields if present
    for field, header in [
        ('deliveredTo', 'Delivered-To'),
        ('cc', 'Cc'),
        ('bcc', 'Bcc')
    ]:
        if header in headers:
            message_details[field] = headers[header]
    
    return message_details


def add_draft_id_to_message(service, user_email, message_id, message_details):
    """
    Add draft ID to message details if message is a draft.
    
    Args:
        service: Authenticated Gmail API service
        user_email: User's email address
        message_id: Gmail message ID
        message_details: Message details dictionary to update
    """
    try:
        # Fetch drafts and find the matching draftId
        drafts = service.users().drafts().list(userId=user_email).execute().get('drafts', [])
        
        for draft in drafts:
            draft_details = service.users().drafts().get(userId=user_email, id=draft['id']).execute()
            
            if draft_details['message']['id'] == message_id:
                message_details['draftId'] = draft['id']
                break
    except Exception as e:
        print(f"Error adding draft ID: {e}")
        # Continue without adding draftId