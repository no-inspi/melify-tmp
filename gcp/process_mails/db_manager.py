from pymongo import MongoClient
import os

class MongoDBConnectionManager:
    """
    Context manager for MongoDB connections.
    Ensures proper opening and closing of database connections.
    """
    def __init__(self, uri=None, db_name=None):
        """
        Initialize connection manager with optional URI and database name.
        If not provided, values are read from environment variables.
        
        Args:
            uri: MongoDB connection URI
            db_name: MongoDB database name
        """
        self.uri = uri or os.getenv('URI_MONGODB', "mongodb://localhost:27017")
        self.db_name = db_name or os.environ.get('DATABASE_NAME')
    
    def __enter__(self):
        """
        Enter the context manager, establishing MongoDB connection.
        
        Returns:
            MongoDB database instance
        """
        self.client = MongoClient(self.uri)
        self.db = self.client[self.db_name]
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Exit the context manager, closing MongoDB connection.
        
        Args:
            exc_type: Exception type if an exception occurred
            exc_val: Exception value if an exception occurred
            exc_tb: Exception traceback if an exception occurred
        """
        self.client.close()