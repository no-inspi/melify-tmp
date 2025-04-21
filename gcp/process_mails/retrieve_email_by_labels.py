import os
import pymongo
from pymongo import MongoClient
from datetime import datetime, timedelta
import functions_framework
import sentry_sdk
import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from flask import jsonify, make_response
from mistralai import File,Mistral
from io import BytesIO
import time
import tempfile
from utils import fetch_email_without_category
from bson import ObjectId

INSTRUCTIONS_TEMPLATE = """
You are an expert in email summarization, assisting a user within an email client. Your task is to:

1. Summarize the email or thread:
   - Generate a concise summary that allows the user to quickly grasp the key information without reading the entire thread.
   - Preserve any links as interactive if referenced in the summary.
   - For short emails, use a single-sentence summary. For longer threads, provide a list format that captures crucial details, such as prices, quantities, appointment times, meeting links, or recipient actions.

Use a neutral, clear tone, and present only the most relevant information for quick reference.

Respond with a JSON object containing:
- "summary": the summary

Do not include any text outside of this JSON object.

<<<
sender: {sender}
subject: {subject}
email text: {text}
>>>
"""


INSTRUCTIONS_WITH_CONTEXT_TEMPLATE = """
You are an expert in email summarization, assisting a user within an email client. Your task is to:

1. Summarize the email or thread:
   - Generate a concise summary, using past thread summaries as context.
   - Preserve any links as interactive if referenced in the summary.
   - For short emails, use a single-sentence summary. For longer threads, provide a list format that captures crucial details, such as prices, quantities, appointment times, meeting links, or recipient actions.

Use a neutral, clear tone, and present only the most relevant information for quick reference.

Respond with a JSON object containing:
- "summary": the summary

Do not include any text outside of this JSON object.

<<<
sender: {sender}
subject: {subject}
email text: {text}
summary of past email threads:
    summary: {past_thread_summary}
>>>
"""

API_KEY_MISTRAL = os.environ.get('API_KEY_MISTRAL')

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

if (os.environ.get('URI_MONGODB')):
    mongo_db_url = os.environ.get('URI_MONGODB')
else:
    mongo_db_url = "mongodb://localhost:27017"
    
    
ALLOWED_ORIGINS = {'http://localhost:3030'}

client = Mistral(api_key=os.environ.get('API_KEY_MISTRAL'))

@functions_framework.http
def retrieve_email_by_labels(request):
    try:
        client = MongoClient(mongo_db_url)
        # db = client.melifydev # Connect to the database
        db = client[os.environ.get('DATABASE_NAME')] # Connect to the database
        print("Connected to the database successfully!")
    except pymongo.errors.ConnectionFailure as e:
        print("Could not connect to MongoDB:", e)
        return "Database connection failed", 500
    except Exception as e:
        print("An error occurred:", e)
        return "Error", 500 
    try:
        origin = request.headers.get('Origin')
        if request.method == 'OPTIONS':
            response = make_response()
            if origin in ALLOWED_ORIGINS:
                response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
            response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
            response.headers['Access-Control-Allow-Credentials'] = 'true'
            response.headers['Access-Control-Max-Age'] = '3600'
            return response
        
        data = request.get_json()
        user_email = data.get('user_email', "")
        
        tokens_collection = db['tokens']
        users_collection = db['users']
        profiletypes_collection = db['profiletypes']
        
        user = get_user_by_email(user_email, users_collection)
                
        service = get_gmail_service(tokens_collection, user['_id'])
        
        labels = get_user_labels(service)
        
        
        
        if not labels:
            return jsonify({'status': 'warning', 'message': 'No labels found for this user.'}), 200
        
        emails_by_label = {}
        
        profiletype_obj = {
            'description': "description",
            'categories': [
                {
                    'name': label['name'],
                    'description': f"Description for {label['name']}",
                    'color': "#FFFFFF",  # Replace with desired default or dynamic color
                    'displayName': label['name'].capitalize(),
                    'disable': False  # Default value, can be changed as needed
                } for label in labels
            ],
            'createdAt': datetime.now(),
            'updatedAt': datetime.now(),
        }
        
        # Check if a profiletype with the same categories already exists
        existing_profiletype = profiletypes_collection.find_one({
            'categories': profiletype_obj['categories']
        })

        if existing_profiletype:
            profiletype_id = existing_profiletype['_id']
            print(f"Profiletype with matching categories already exists with ID: {profiletype_id}")
        else:
            # Insert the new profiletype
            profiletype_id = profiletypes_collection.insert_one(profiletype_obj).inserted_id
            print(f"Inserted new profiletype with ID: {profiletype_id}")
                
        # Update the user's profiletype reference
        users_collection.update_one(
            {'_id': user['_id']},
            {'$set': {'profileType': ObjectId(profiletype_id)}}
        )    
        for label in labels:
            label_id = label['id']
            label_name = label['name']
            
            emails = get_emails_by_label(service, label_id)
            emails_by_label[label_name] = emails

            message_ids = [msg["id"] for msg in emails]
            retrieve_emails(service, message_ids, db, label, user_email)
            
        if origin in ALLOWED_ORIGINS:
                response.headers['Access-Control-Allow-Origin'] = origin
        # categorized = categorize_emails(emails_details)
        return jsonify({'status': 'success', 'message': 'everything worked well'}), 200
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error in retrieve emails by labels: {str(e)}")
        response = jsonify({'status': 'error', 'message': str(e)})
        if origin in ALLOWED_ORIGINS:
                response.headers['Access-Control-Allow-Origin'] = origin
        return response, 500
    
    
def get_user_by_email(email, users_collection):
    user = users_collection.find_one({'email': email})
    return user

def get_gmail_service(tokens_collection, userId):
    # Retrieve access token from MongoDB
    token_data = tokens_collection.find_one({"userId": userId})
    access_token = token_data['accessToken']

    # Use the access token to authenticate Gmail API
    creds = Credentials(token=access_token)
    service = build('gmail', 'v1', credentials=creds)
    return service

def get_user_labels(service):
    """
    Retrieve user-created labels from the Gmail API.
    
    Args:
        service: The Gmail API service object.

    Returns:
        A list of user-created labels.
    """
    # Call the Gmail API to retrieve labels
    results = service.users().labels().list(userId='me').execute()
    labels = results.get('labels', [])
    
    # Filter labels to include only those with type 'user'
    user_labels = [label for label in labels if label.get('type') == 'user']
    
    return user_labels

def get_emails_by_label(service, label_id):
    """
    Retrieve emails for a given label ID from the Gmail API.
    
    Args:
        service: The Gmail API service object.
        label_id: The ID of the label to filter emails.

    Returns:
        A list of emails associated with the label.
    """
    messages = []
    response = service.users().messages().list(userId='me', labelIds=[label_id]).execute()

    if 'messages' in response:
        messages.extend(response['messages'])

    # Handle pagination if necessary
    while 'nextPageToken' in response:
        response = service.users().messages().list(
            userId='me', labelIds=[label_id], pageToken=response['nextPageToken']
        ).execute()
        if 'messages' in response:
            messages.extend(response['messages'])

    return messages

def retrieve_emails(service, message_ids, db, label, user_email):
    emails_collection = db['emails']

    # Function to process each message in the batch request
    def handle_message_request(request_id, response, exception):
        current_time = datetime.now()
        if exception is not None:
            print(f"Error fetching message {request_id}: {exception}")
        else:
            existing_email = emails_collection.find_one({"messageId": response['id']})
            if existing_email:
                print(f"Email with ID {response['id']} already exists in the database. Skipping fetch and insertion.")
            else:
                # print(f"Message {response} fetched successfully")
                email_detail = fetch_email_without_category(service, user_email, response['id'], response, db, INSTRUCTIONS_WITH_CONTEXT_TEMPLATE, INSTRUCTIONS_TEMPLATE, API_KEY_MISTRAL, label['name'])
            
                if email_detail:
                    email_detail['createdAt'] = current_time
                    email_detail['updatedAt'] = current_time
                    # Insert the fetched email into the 'emails' collection
                    insert_result = emails_collection.insert_one(email_detail)
                    
                    if insert_result.acknowledged:
                        print(f"New email with ID {message_id} added to the database.")
                    else:
                        print(f"Failed to insert email with ID {message_id}.")

    # Create a batch request
    batch = service.new_batch_http_request()

    # Add each message retrieval request to the batch
    for message_id in message_ids:
        batch.add(service.users().messages().get(userId="me", id=message_id, format="full"), callback=handle_message_request)


    # Execute the batch request
    batch.execute()

def prepare_email_batch(client, emails):
    """
    Prepare and upload a batch file for email processing.

    Args:
        client (Mistral): The Mistral client instance.
        emails (list): List of email details to process.

    Returns:
        File: The uploaded input file object.
    """
    buffer = BytesIO()
    for idx, email in enumerate(emails):
        request = {
            "custom_id": str(idx),
            "body": {
                "max_tokens": 500,
                "messages": [
                    {
                        "role": "user",
                        "content": f"Categorize this email: {email['body']}. Subject: {email['subject']}."
                    }
                ]
            }
        }
        buffer.write(json.dumps(request).encode("utf-8"))
        buffer.write("\n".encode("utf-8"))
    return client.files.upload(file=File(file_name="emails_batch.jsonl", content=buffer.getvalue()), purpose="batch")

def run_batch_job(client, input_file, model="mistral-small-latest"):
    """
    Run a batch job using the provided input file and model.

    Args:
        client (Mistral): The Mistral client instance.
        input_file (File): The input file object.
        model (str): The model to use for the batch job.

    Returns:
        BatchJob: The completed batch job object.
    """
    batch_job = client.batch.jobs.create(
        input_files=[input_file.id],
        model=model,
        endpoint="/v1/chat/completions",
        metadata={"job_type": "email_categorization"}
    )

    while batch_job.status in ["QUEUED", "RUNNING"]:
        batch_job = client.batch.jobs.get(job_id=batch_job.id)
        
        # Avoid division by zero
        if batch_job.total_requests > 0:
            percent_done = round(
                (batch_job.succeeded_requests + batch_job.failed_requests) / batch_job.total_requests * 100, 2
            )
        else:
            percent_done = 0

        time.sleep(1)

    print(f"Batch job {batch_job.id} completed with status: {batch_job.status}")
    return batch_job

def download_file(client, file_id, output_path):
    """
    Download a file from the Mistral server.

    Args:
        client (Mistral): The Mistral client instance.
        file_id (str): The ID of the file to download.
        output_path (str): The path where the file will be saved.
    """
    if file_id is not None:
        print(f"Downloading file to {output_path}")
        output_file = client.files.download(file_id=file_id)
        with open(output_path, "w") as f:
            for chunk in output_file.stream:
                f.write(chunk.decode("utf-8"))
        print(f"Downloaded file to {output_path}")
        
def categorize_emails(emails, model="codestral-latest"):
    """
    Main function to categorize emails using Mistral batch API.

    Args:
        emails (list): List of email details to categorize.
        model (str): Model name to use.

    Returns:
        list: List of emails with their respective categories.
    """
    input_file = prepare_email_batch(client, emails)
    print(f"Uploaded batch file: {input_file}")

    batch_job = run_batch_job(client, input_file, model)
    print(f"Batch job completed in {batch_job.completed_at - batch_job.created_at} seconds")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jsonl") as temp_file:
        output_path = temp_file.name
        
    try:
        # Download results to temporary file
        download_file(client, batch_job.output_file, output_path)
        categorized_emails = []

        # Process the downloaded file
        with open(output_path, "r") as f:
            for line in f:
                result = json.loads(line)  # Parse JSONL line
                custom_id = int(result["custom_id"])
                category = result["response"]['body']['choices'][0]['message']['content']
                emails[custom_id]["category"] = category
                categorized_emails.append(emails[custom_id])

        return categorized_emails
    finally:
        # Remove the temporary file
        if os.path.exists(output_path):
            os.remove(output_path)
        print(f"Temporary file removed at {output_path}")