import json
import uuid
from datetime import datetime
from pymongo import MongoClient


def connect_to_mongo(db_name, collection_name, client):
    """Connect to MongoDB and return the specified collection."""
    db = client[db_name]
    collection = db[collection_name]
    return collection


def create_email_data(thread_id):
    """Create a new email document."""
    email_data = {
        "messageId": str(uuid.uuid4()),  # Generate a unique message ID
        "threadId": thread_id,  # Use the specified thread ID
        "snippet": "Hi James, Thank you for ...",  # Example snippet
        "to": "james.miller@globalenterprises.com",  # Example recipient
        "cc": "",  # Empty cc
        "bcc": "",  # Empty bcc
        "deliveredTo": "contact@melify.fr",  # Example delivered to
        "from": "contact@melify.fr",  # Example sender
        "labelIds": ["INBOX"],  # Label for the email
        "categories": ["category_example"],  # Example category
        "text": "This is a test email body in plain text",  # Email text
        "html": """
        <body>
    <p>Hi James,</p>

    <p>Thank you for confirming the appointment on October 12th at 11 AM. Everything looks good on my end as well.</p>

    <p>Just a quick question—would it be possible to receive a brief agenda or any preparation materials in advance?</p>

    <p>Looking forward to our meeting.</p>

    <p>Best regards,<br>
    David</p>

    <hr>
        </body>
        """,  # Email HTML
        "subject": "Test Email Subject",  # Example subject
        "resume": "Test email summary",  # Email summary
        "priority": 1,  # Default priority
        "headers": {},  # Placeholder for headers
        "attachments": [],  # No attachments
        "payload": [],  # No payload
        "initialCategory": "category_example",  # Initial category
        "generated": True,
        "date": "2024-09-30T17:47:00Z",  # Current date in ISO format
    }
    return email_data


def insert_email(email_collection, thread_id):
    """Insert a new email document into MongoDB based on thread ID."""
    email_data = create_email_data(thread_id)
    email_collection.insert_one(email_data)
    print(f"Inserted new email with threadId: {thread_id}")


if __name__ == "__main__":
    # MongoDB connection details
    mongo_uri = 'mongodb+srv://karma:ashoo4Aici3k@clusterprofus.caolqum.mongodb.net/melifydev?retryWrites=true&w=majority'
    db_name = 'melifydev'
    email_collection_name = 'emails'
    
    # Specify the threadId to associate the new email with
    thread_id = "cc739e42-1a3a-41a7-9f36-4953efee80f2"

    # Connect to MongoDB
    client = MongoClient(mongo_uri)
    email_collection = connect_to_mongo(db_name, email_collection_name, client)
    
    # Insert the new email
    insert_email(email_collection, thread_id)

    # Close the connection
    client.close()
