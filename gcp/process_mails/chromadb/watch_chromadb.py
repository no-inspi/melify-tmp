# Simple script to view collection data
import chromadb

# Connect to your local ChromaDB
client = chromadb.PersistentClient(path="/tmp/chroma_db")

# List all collections
collections = client.list_collections()
print(f"Available collections: {[col.name for col in collections]}")

# Get your specific collection
collection = client.get_collection("melifycollection")

# Peek at the data (shows a sample)
print(collection.peek())

# Get collection count
print(f"Total items in collection: {collection.count()}")