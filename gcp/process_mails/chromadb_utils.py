import chromadb
import hashlib
from datetime import datetime
from typing import Dict, Optional, Any, Union
from bs4 import BeautifulSoup
import re

def insert_email_to_chromadb(
    sender_email: str,
    receiver_email: str,
    subject: str,
    date: Union[str, datetime],
    content_html: str,
    collection_name: str = "melifycollection",
    db_path: str = "/tmp/chroma_db",
    additional_metadata: Optional[Dict[str, Any]] = None,
    store_original_html: bool = False
) -> str:
    """
    Insert email metadata into a ChromaDB collection.
    
    Args:
        sender_email: The email address of the sender
        receiver_email: The email address of the receiver
        subject: The subject line of the email
        date: The date the email was sent (string or datetime object)
        content_html: The HTML content of the email
        collection_name: The name of the ChromaDB collection to use
        db_path: The path to the ChromaDB database
        additional_metadata: Any additional metadata to store with the email
        store_original_html: Whether to keep the original HTML in metadata
        
    Returns:
        The ID of the inserted document
    """
    # Connect to ChromaDB
    chroma_client = chromadb.PersistentClient(path=db_path)
    
    # Get or create the collection
    try:
        collection = chroma_client.get_collection(name=collection_name)
        print(f"Using existing collection: {collection_name}")
    except ValueError:
        collection = chroma_client.create_collection(name=collection_name)
        print(f"Created new collection: {collection_name}")
    
    # Format the date if it's a datetime object
    if isinstance(date, datetime):
        date_str = date.isoformat()
    else:
        date_str = date
    
    # Create a unique ID for the email (hash of sender + receiver + date + subject)
    id_string = f"{sender_email}:{receiver_email}:{date_str}:{subject}"
    email_id = hashlib.md5(id_string.encode()).hexdigest()
    
    # Extract plain text from HTML content
    content_text = html_to_text(content_html)
    
    # Prepare metadata
    metadata = {
        "sender": sender_email,
        "receiver": receiver_email,
        "subject": subject,
        "date": date_str,
        "type": "email"
    }
    
    # Add any additional metadata if provided
    if additional_metadata:
        metadata.update(additional_metadata)
    
    # Store the content text in metadata
    metadata["content_text"] = content_text
    
    # Optionally store the original HTML content
    if store_original_html:
        metadata["content_html"] = content_html
    
    # Create a document that contains key information for embedding search
    document = f"""
    From: {sender_email}
    To: {receiver_email}
    Subject: {subject}
    Date: {date_str}
    
    {subject}
    
    {content_text[:1000]}  # Include a preview of the content for better embeddings
    """
    
    # Add the email to the collection
    collection.add(
        documents=[document],
        metadatas=[metadata],
        ids=[email_id]
    )
    
    print(f"Successfully added email with ID: {email_id}")
    return email_id

def html_to_text(html_content: str) -> str:
    """
    Convert HTML content to plain text by removing HTML tags and cleaning up whitespace.
    
    Args:
        html_content: The HTML content to convert
        
    Returns:
        Clean plain text extracted from the HTML
    """
    # Use BeautifulSoup to parse the HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Remove script and style elements that we don't want in our text
    for script in soup(["script", "style", "head"]):
        script.extract()
    
    # Get text and clean up whitespace
    text = soup.get_text(separator=' ')
    
    # Clean up whitespace - replace multiple spaces with single space
    text = re.sub(r'\s+', ' ', text)
    
    # Remove any remaining HTML entities
    text = re.sub(r'&[a-zA-Z]+;', ' ', text)
    
    # Trim leading/trailing whitespace
    text = text.strip()
    
    return text
