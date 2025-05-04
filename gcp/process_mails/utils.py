from email.utils import parsedate_tz, mktime_tz
import base64
import pytz
from datetime import datetime
import string
import re
import json
from typing import Dict, Any, List
import requests
import sentry_sdk
import tiktoken

encoder = tiktoken.encoding_for_model("gpt-3.5-turbo")

TOKEN_LIMIT = 30000

def count_tokens(text):
    return len(encoder.encode(text))

def truncate_text(text, max_tokens):
    """Truncate text to fit within the max token limit."""
    tokens = encoder.encode(text)
    if len(tokens) > max_tokens:
        return encoder.decode(tokens[:max_tokens])  # Truncate to max_tokens
    return text

def convert_to_iso8601_utc(date_str):
    """
    Convert a date string to ISO 8601 format in UTC.
    
    Parameters:
    date_str (str): The date string to be converted, including timezone info.
                    If no timezone is provided, defaults to UTC.
    
    Returns:
    str: The date in ISO 8601 format (UTC).
    """
    try:
        # Parse the date string into a tuple (struct_time + timezone offset in seconds)
        parsed_date = parsedate_tz(date_str)
        
        if parsed_date is None:
            raise ValueError("Date parsing failed.")

        # If the timezone offset is None, assume UTC
        if parsed_date[-1] is None:
            # Convert to datetime without timezone info
            date_dt = datetime(*parsed_date[:6])
            # Assign UTC timezone
            date_dt_utc = date_dt.replace(tzinfo=pytz.utc)
        else:
            # Convert the parsed date to a timestamp considering the timezone offset
            timestamp = mktime_tz(parsed_date)
            # Create a UTC datetime object from the timestamp
            date_dt_utc = datetime.utcfromtimestamp(timestamp).replace(tzinfo=pytz.utc)
        
        # Convert to ISO 8601 format (UTC)
        date_iso = date_dt_utc.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        return date_iso
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error parsing date: {e}")
        return None
    
def contains_category(text, categories):
    """
    Checks if the given text contains any of the specified categories.

    This function searches for categories within the provided text using a 
    case-insensitive and word-boundary-sensitive approach. It normalizes the
    text and category names by converting them to lowercase and stripping 
    whitespace before checking for matches.

    Parameters:
    text (str): The text to be searched for category names.
    categories (list of str): A list of category names to search for within the text.

    Returns:
    str: The first matching category found in the text. If no category is found, returns None.
    """
    # Normalize the input text
    normalized_text = normalize_string(text)
    
    # Check if any category is a substring of the text using regex for accurate boundary checks
    for category in categories:
        # Prepare the regex pattern to match whole words/phrases, case-insensitive
        pattern = r'\b' + re.escape(normalize_string(category)) + r'\b'
        if re.search(pattern, normalized_text, re.IGNORECASE):
            return category  # Return the found category

    return None  # No category was found in the text
    
def parse_mistral_response(result, CATEGORIES):
    """
    Parses a JSON string and returns a structured object with category, text, and summary fields.
    
    Parameters:
    result (str): A JSON string containing 'category' and 'summary'.
    
    Returns:
    dict: A dictionary with 'category', 'text', and 'summary' fields.
    """
    try:
        # Parse the JSON input        
        data = json.loads(result)
        
        # Extract category and normalize it
        raw_category = data.get('category', 'Other')
        
        # Find a known category in the text
        category_found = contains_category(raw_category, CATEGORIES)
        category = category_found if category_found else 'Other'
        
        # Extract summary
        summary = data.get('summary', '')
        
        # Return the structured result
        return {
            "category": category,
            "text": result,  # Return the original JSON string as text
            "summary": summary
        }
    except (json.JSONDecodeError, TypeError) as e:
        sentry_sdk.capture_exception(e)

        print(f"Error parsing JSON: {e}")
        return {"category": "Other", "text": result, "summary": ""}

def normalize_string(s):
    """
    Normalizes a given string for consistent comparison.

    This function transforms the input string into a standardized format by:
    - Converting all characters to lowercase.
    - Removing punctuation marks.
    - Stripping leading and trailing whitespace.

    These normalization steps help in achieving uniformity in text data, which is 
    particularly useful for comparison or searching tasks where case and punctuation 
    variations might otherwise lead to mismatches.

    Parameters:
    s (str): The input string to be normalized.

    Returns:
    str: The normalized string, ready for consistent comparison or analysis.
    """
    # Lowercase the string
    s = s.lower()
    # Remove punctuation
    s = s.translate(str.maketrans('', '', string.punctuation))
    # Strip leading and trailing whitespace
    s = s.strip()
    return s

def fetch_email(service, user_email, message_id, db, INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, INSTRUCTIONS_TEMPLATE, PROMPT_CATEGORIES, API_KEY_MISTRAL, CATEGORIES):
    """Fetch an email's details using the Gmail API."""
    try:
        threads_collection = db.threads
        
        message = service.users().messages().get(userId=user_email, id=message_id, format='full').execute()
        
        decoded_body = decode_email_body(message['payload'], service, user_email, message_id)
        
        existing_thread = threads_collection.find_one({'threadId': message["threadId"]})
        
        # Initialize default category and summary
        default_category = "Draft"
        default_summary = "Hey I'm a draft."
        if 'DRAFT' in message.get('labelIds', []):
            category_obj = {
                "category": default_category,
                "summary": default_summary,
                "text": "Draft email - Mistral not called."
            }
        else: 
            category_obj = {
                "category": "Other",
                "summary": "No summary available.",
                "text": "No text email or no content - Mistral not called."
            }
            
        # MISTRAL API #
        email_text = decoded_body.get('text', '').strip()
        # Check if the email contains the 'DRAFT' label
        if email_text and 'DRAFT' not in message.get('labelIds', []):
            # Prepare Mistral API prompt
            if existing_thread:
                
                categoryTmp = (
                    existing_thread.get('userCategory') 
                    if existing_thread.get('userCategory') not in (None, '') 
                    else existing_thread.get('generatedCategory', '')
                )
                prompt = INSTRUCTIONS_WITH_CONTEXT_TEMPLATE.format(
                    sender=next(header['value'] for header in message['payload']['headers'] if header['name'] == 'From'), 
                    subject=next(header['value'] for header in message['payload']['headers'] if header['name'] == 'Subject'),
                    past_thread_summary=existing_thread['summary'],
                    past_thread_category=categoryTmp,
                    text=truncate_text(clean_email_text(email_text), 5000), 
                    PROMPT_CATEGORIES=PROMPT_CATEGORIES
                )
            else:        
                prompt = INSTRUCTIONS_TEMPLATE.format(
                    sender=next(header['value'] for header in message['payload']['headers'] if header['name'] == 'From'), 
                    subject=next(header['value'] for header in message['payload']['headers'] if header['name'] == 'Subject'), 
                    text=truncate_text(clean_email_text(email_text), 5000), 
                    PROMPT_CATEGORIES=PROMPT_CATEGORIES
                )
            
            token_count = count_tokens(prompt)
            print(f"Token count: {token_count}")

            # Make the Mistral API call if within token limit
            if token_count <= TOKEN_LIMIT:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {API_KEY_MISTRAL}"
                }
                data = {
                    "model": "open-mistral-7b",
                    "messages": [{"role": "user", "content": prompt}],
                }
                response = requests.post("https://api.mistral.ai/v1/chat/completions", json=data, headers=headers)
                
                # Process the response
                mistral_response = response.json()
                category_obj = parse_mistral_response(mistral_response["choices"][0]["message"]["content"], CATEGORIES)
            else:
                print("Error: Token count exceeds the limit even after truncation.")
                category_obj = {
                    "category": "Other",
                    "summary": "Token limit exceeded - Mistral not called.",
                    "text": "Token limit exceeded."
                }
        
        headers = {header['name']: header['value'] for header in message['payload']['headers']}
        print(headers)
        delivered_to = headers.get('Delivered-To', None)
        delivered_cc = headers.get('Cc', None)
        delivered_bcc = headers.get('Bcc', None)
        
        # If the thread exists, update it
        if existing_thread:
            threads_collection.update_one(
                {'threadId': message["threadId"]},
                {'$set': {
                    'summary': category_obj['summary'],
                    "userCategory": "",
                    "generatedCategory": category_obj['category'],
                }}
            )
        # If the thread doesn't exist, create a new one
        else:
            new_thread = {
                'threadId': message["threadId"],
                'summary': category_obj['summary'],
                "userCategory": "",
                "generatedCategory": category_obj['category'],
            }
            if delivered_to:
                new_thread['deliveredTo'] = delivered_to
            threads_collection.insert_one(new_thread)
        
        # Find the Date header and convert it to a datetime object
        date_str = next(header['value'] for header in message['payload']['headers'] if header['name'] == 'Date')
        date_iso = convert_to_iso8601_utc(date_str)
    
        # Check if 'Delivered-To' exists in headers            
        message_details = {
            'messageId': message_id,
            'subject': next(header['value'] for header in message['payload']['headers'] if header['name'] == 'Subject'),
            'from': next(header['value'] for header in message['payload']['headers'] if header['name'] == 'From'),
            'to': next(header['value'] for header in message['payload']['headers'] if header['name'] == 'To'),
            'date': date_iso,
            'labelIds': message["labelIds"],
            'threadId': message["threadId"],
            'snippet': message["snippet"],
            "html": decoded_body["html"],
            "text": decoded_body["text"],
            "summary": category_obj["summary"],
            "userCategory": "",
            "generatedCategory": category_obj['category'],
            "mistralOutputText": category_obj["text"],
            "attachments": decoded_body["attachments"],
            "payload": message['payload'],
        }
        
        if delivered_to:
            message_details['deliveredTo'] = delivered_to
        
        if delivered_cc:
            message_details['cc'] = delivered_cc
        
        if delivered_bcc:
            message_details['bcc'] = delivered_bcc
            
             # Check if the message is a draft
        if 'DRAFT' in message.get('labelIds', []):
            # Fetch drafts and find the matching draftId
            drafts = service.users().drafts().list(userId=user_email).execute().get('drafts', [])
            for draft in drafts:
                draft_details = service.users().drafts().get(userId=user_email, id=draft['id']).execute()
                if draft_details['message']['id'] == message_id:
                    message_details['draftId'] = draft['id']
                    break
    
        return message_details
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error fetching email with ID {message_id}: {e}")
        return None
   
def decode_email_body(payload: Dict[str, Any], service, user_email, message_id) -> Dict[str, Any]:
    """
    Decodes the email body from the message payload.
    Returns a dictionary containing both the plain text, HTML parts (if available),
    and any attachments.
    """
    decoded_body = {"text": "", "html": "", "attachments": []}
    
    def safe_base64_decode(data: str) -> str:
        # Adjust the padding of the data if necessary before decoding
        padding = len(data) % 4
        if padding != 0:
            data += '=' * (4 - padding)
        try:
            return base64.urlsafe_b64decode(data).decode('utf-8')
        except Exception as e:
            sentry_sdk.capture_exception(e)

            print(f"Failed to decode base64 data: {e}")
            return None
        
    def fetch_attachment(attachment_id: str) -> str:
        attachment = service.users().messages().attachments().get(
            userId=user_email, messageId=message_id, id=attachment_id).execute()
        attachment_data = attachment.get('data')
        return attachment_data
    
    def process_parts(parts: List[Dict[str, Any]]):
        for part in parts:
            mime_type = part.get('mimeType', '')
            body = part.get('body', {})
            part_data = body.get('data')
            filename = part.get('filename')
            
            if 'parts' in part:
                process_parts(part['parts'])  # Recursively handle nested parts
            elif part_data:
                if mime_type.startswith('text/'):
                    decoded_part = safe_base64_decode(part_data)
                    if decoded_part:
                        if mime_type == 'text/plain':
                            decoded_body['text'] += decoded_part
                        elif mime_type == 'text/html':
                            decoded_body['html'] += decoded_part
                elif filename:
                    # Handle attachments
                    attachment = {
                        'filename': filename,
                        'mimeType': mime_type,
                        'data': part_data,  # Store base64 encoded data
                        'attachment_id': body['attachmentId'],
                    }
                    decoded_body['attachments'].append(attachment)
            elif filename and 'attachmentId' in body:
                # Handle attachments with attachmentId
                attachment_id = body['attachmentId']
                attachment_data = fetch_attachment(attachment_id)
                if attachment_data:
                    attachment = {
                        'filename': filename,
                        'mimeType': mime_type,
                        'data': attachment_data,
                        'attachment_id': attachment_id,
                    }
                    decoded_body['attachments'].append(attachment)
    
    # Check the main mimeType
    mime_type = payload.get('mimeType', '')
    if mime_type.startswith('multipart/'):
        process_parts(payload.get('parts', []))
    else:
        # Handle non-multipart (simple) messages
        data = payload['body'].get('data')
        if data:
            decoded_part = safe_base64_decode(data)
            if decoded_part is not None:
                if mime_type == 'text/plain':
                    decoded_body['text'] = decoded_part
                elif mime_type == 'text/html':
                    decoded_body['html'] = decoded_part

    return decoded_body

def clean_email_text(email_text):
    # Remove web links
    cleaned_text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', email_text)
    
    # Remove non-ASCII characters
    #cleaned_text = re.sub(r'[^\x00-\x7F]+', ' ', cleaned_text)
    
    # Remove newline and carriage return characters
    cleaned_text = cleaned_text.replace('\n', ' ').replace('\r', ' ')
    
    # Remove multiple spaces
    cleaned_text = re.sub(' +', ' ', cleaned_text)
    
    return cleaned_text.strip()

def fetch_email_without_category(service, user_email, message_id, message, db, INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, INSTRUCTIONS_TEMPLATE, API_KEY_MISTRAL, category):
    """Fetch an email's details using the Gmail API."""
    try:
        threads_collection = db.threads
                
        decoded_body = decode_email_body(message['payload'], service, user_email, message_id)
        
        existing_thread = threads_collection.find_one({'threadId': message["threadId"]})
        
        # Initialize default category and summary
        default_category = "Draft"
        default_summary = "Hey I'm a draft."
        if 'DRAFT' in message.get('labelIds', []):
            category_obj = {
                "category": default_category,
                "summary": default_summary,
                "text": "Draft email - Mistral not called."
            }
        else: 
            category_obj = {
                "category": "Other",
                "summary": "No summary available.",
                "text": "No text email or no content - Mistral not called."
            }
            
        # MISTRAL API #
        email_text = decoded_body.get('text', '').strip()
        # Check if the email contains the 'DRAFT' label
        if email_text and 'DRAFT' not in message.get('labelIds', []):
            # Prepare Mistral API prompt
            if existing_thread:
                prompt = INSTRUCTIONS_WITH_CONTEXT_TEMPLATE.format(
                    sender=next(header['value'] for header in message['payload']['headers'] if header['name'] == 'From'), 
                    subject=next(header['value'] for header in message['payload']['headers'] if header['name'] == 'Subject'),
                    past_thread_summary=existing_thread['summary'],
                    text=truncate_text(clean_email_text(email_text), 5000), 
                )
            else:        
                prompt = INSTRUCTIONS_TEMPLATE.format(
                    sender=next(header['value'] for header in message['payload']['headers'] if header['name'] == 'From'), 
                    subject=next(header['value'] for header in message['payload']['headers'] if header['name'] == 'Subject'), 
                    text=truncate_text(clean_email_text(email_text), 5000), 
                )
            
            token_count = count_tokens(prompt)
            print(f"Token count: {token_count}")

            # Make the Mistral API call if within token limit
            if token_count <= TOKEN_LIMIT:
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {API_KEY_MISTRAL}"
                }
                data = {
                    "model": "open-mistral-7b",
                    "messages": [{"role": "user", "content": prompt}],
                }
                response = requests.post("https://api.mistral.ai/v1/chat/completions", json=data, headers=headers)
                
                # Process the response
                mistral_response = response.json()
                category_obj = parse_mistral_response(mistral_response["choices"][0]["message"]["content"], ['Other'])
            else:
                print("Error: Token count exceeds the limit even after truncation.")
                category_obj = {
                    "category": "Other",
                    "summary": "Token limit exceeded - Mistral not called.",
                    "text": "Token limit exceeded."
                }
        
        headers = {header['name']: header['value'] for header in message['payload']['headers']}

        delivered_to = headers.get('Delivered-To', None)
        delivered_cc = headers.get('Cc', None)
        delivered_bcc = headers.get('Bcc', None)
        
        # If the thread exists, update it
        if existing_thread:
            threads_collection.update_one(
                {'threadId': message["threadId"]},
                {'$set': {
                    'summary': category_obj['summary'],
                    "userCategory": "",
                    "generatedCategory": category,
                }}
            )
        # If the thread doesn't exist, create a new one
        else:
            new_thread = {
                'threadId': message["threadId"],
                'summary': category_obj['summary'],
                "userCategory": "",
                "generatedCategory": category,
            }
            if delivered_to:
                new_thread['deliveredTo'] = delivered_to
            threads_collection.insert_one(new_thread)
        
        # Find the Date header and convert it to a datetime object
        date_str = next(header['value'] for header in message['payload']['headers'] if header['name'] == 'Date')
        date_iso = convert_to_iso8601_utc(date_str)
        
        # Check if 'Delivered-To' exists in headers
        message["labelIds"].append('INBOX')
        
        message_details = {
            'messageId': message_id,
            'subject': next(header['value'] for header in message['payload']['headers'] if header['name'] == 'Subject'),
            'from': next(header['value'] for header in message['payload']['headers'] if header['name'] == 'From'),
            'to': next(header['value'] for header in message['payload']['headers'] if header['name'] == 'To'),
            'date': date_iso,
            'labelIds': message["labelIds"],
            'threadId': message["threadId"],
            'snippet': message["snippet"],
            "html": decoded_body["html"],
            "text": decoded_body["text"],
            "summary": category_obj["summary"],
            "userCategory": "",
            "generatedCategory": category,
            "mistralOutputText": category_obj["text"],
            "attachments": decoded_body["attachments"],
            "payload": message['payload'],
        }
        
        if delivered_to:
            message_details['deliveredTo'] = delivered_to
        
        if delivered_cc:
            message_details['cc'] = delivered_cc
        
        if delivered_bcc:
            message_details['bcc'] = delivered_bcc
            
             # Check if the message is a draft
        if 'DRAFT' in message.get('labelIds', []):
            # Fetch drafts and find the matching draftId
            drafts = service.users().drafts().list(userId=user_email).execute().get('drafts', [])
            for draft in drafts:
                draft_details = service.users().drafts().get(userId=user_email, id=draft['id']).execute()
                if draft_details['message']['id'] == message_id:
                    message_details['draftId'] = draft['id']
                    break
    
        return message_details
        
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error fetching email with ID {message_id}: {e}")
        return None

def get_user_by_email(email, db):
    accounts_collection = db.accounts
    users_collection = db.users
    
    # Use find_one() instead of find() to get a single document
    existing_account = accounts_collection.find_one({'email': email})
    
    # Check if account exists
    if not existing_account:
        print(f"No account found for email: {email}")
        return None
    
    print(f"Existing account: {existing_account}")
    
    # Make sure the account has a userId field
    if 'userId' not in existing_account:
        print(f"Account doesn't have userId field: {existing_account}")
        return None
    
    pipeline = [
        {"$match": {"_id": existing_account['userId']}},  # Access userId as a dictionary key
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

def is_access_token_valid(access_token):
    # Check if token is valid by making a simple API call
    response = requests.get('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + access_token)
    return response.status_code == 200

def refresh_access_token(refresh_token, client_id, client_secret):
    data = {
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token'
    }
    response = requests.post('https://oauth2.googleapis.com/token', data=data)
    response_data = response.json()
    return response_data.get('access_token'), response_data.get('refresh_token', refresh_token)