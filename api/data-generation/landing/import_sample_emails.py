import json
from pymongo import MongoClient
import uuid
from datetime import datetime

def load_json_file(json_file_path):
    """Load the JSON file containing email data."""
    with open(json_file_path, 'r') as file:
        data = json.load(file)
    return data

def connect_to_mongo(db_name, collection_name, client):
    """Connect to MongoDB and return the specified collection."""
    db = client[db_name]
    collection = db[collection_name]
    return collection

def format_email(email_data, thread_id):
    """Format email data according to the Email schema."""
    formatted_email = {
        "messageId": str(uuid.uuid4()),  # Generate a unique message ID
        "threadId": thread_id,  # Generate a unique thread ID
        "snippet": email_data.get("summary", ""),  # Use summary as snippet
        "to": "contact@melify.fr",  # Placeholder for "to" field
        "cc": "",  # Placeholder for "cc" field
        "bcc": "",  # Placeholder for "bcc" field
        "deliveredTo": "contact@melify.fr",  # Placeholder for "deliveredTo" field
        "from": email_data.get("email", {}).get("from", ""),  # Placeholder for "from" field
        "labelIds": ["INBOX"],  # Empty array for label IDs
        "categories": [email_data.get("category", "")],  # Category from email data
        "text": email_data.get("email", {}).get("body", ""),  # Plain text body
        "html": email_data.get("email", {}).get("body", ""),  # Placeholder for HTML version of the email
        "subject": email_data.get("email", {}).get("subject", ""),  # Subject from email data
        "resume": email_data.get("summary", ""),  # Use summary as resume
        "chatgptprop": "",  # Placeholder for ChatGPT prop
        "priority": 1,  # Default priority
        "headers": "",  # Placeholder for email headers
        "category": email_data.get("category", ""),  # Category
        "summary": email_data.get("summary", ""),  # Summary
        "attachments": [],  # Empty array for attachments
        "payload": [],  # Empty array for payload
        "initialCategory": email_data.get("category", ""),  # Initial category
        "generated": True,
        "date": email_data.get("email", {}).get("date", ""),
    }
    return formatted_email

def format_thread(email_data, thread_id):
    """Format thread data according to the Thread schema."""
    formatted_thread = {
        "threadId": thread_id,
        "summary": email_data.get("summary", ""),
        "category": email_data.get("category", ""),
        "generated": True,
    }
    return formatted_thread

def insert_emails_and_threads_to_mongo(email_collection, thread_collection, emails):
    """Insert emails and threads into MongoDB collections."""
    for email_data in emails:
        thread_id = str(uuid.uuid4())  # Generate a unique thread ID for each email
        thread = format_thread(email_data, thread_id)  # Format the thread
        email = format_email(email_data, thread_id)  # Format the email with the thread ID
        print("thread", thread)
        # Insert thread and email into respective collections
        thread_collection.insert_one(thread)
        email_collection.insert_one(email)
        print("wtf")
        print(f"Inserted email with threadId: {thread_id}")

if __name__ == "__main__":
    # Path to the JSON file
    json_file_path = 'emails.json'
    
    # Load the email data from JSON file
    email_data = load_json_file(json_file_path)
    
    # Connect to MongoDB (replace db_name and collection_name as needed)
    mongo_uri = 'mongodb+srv://karma:ashoo4Aici3k@clusterprofus.caolqum.mongodb.net/melifydev?retryWrites=true&w=majority'
    db_name = 'melifydev'
    email_collection_name = 'emails'
    thread_collection_name = 'threads'
    
    client = MongoClient(mongo_uri)
    
    # Connect to MongoDB collections
    email_collection = connect_to_mongo(db_name, email_collection_name, client)
    thread_collection = connect_to_mongo(db_name, thread_collection_name, client)
    
    print("connected to mongo")
    
    
    # Insert emails into MongoDB collection
    insert_emails_and_threads_to_mongo(email_collection, thread_collection, email_data['emails'])
