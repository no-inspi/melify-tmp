import os

def load_config():
    """
    Load application configuration from environment variables.
    
    Returns:
        Dict containing configuration parameters
    """
    return {
        'client_id': os.environ.get('GOOGLE_CLIENT_ID'),
        'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET'),
        'api_key_mistral': os.environ.get('API_KEY_MISTRAL'),
        'mongodb_uri': os.getenv('URI_MONGODB', "mongodb://localhost:27017"),
        'database_name': os.environ.get('DATABASE_NAME'),
    }