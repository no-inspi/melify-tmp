import chromadb

def setup_chroma_collection():
    # Connect to the local persistent ChromaDB
    chroma_client = chromadb.PersistentClient(path="/tmp/chroma_db")
    
    # Get all collection names
    collection_names = [col.name for col in chroma_client.list_collections()]
    
    # Check if our collection exists
    if "melifycollection" not in collection_names:
        # Create the collection if it doesn't exist
        collection = chroma_client.create_collection(name="melifycollection")
        print("Collection 'melifycollection' created successfully.")
    else:
        # Get the existing collection if it already exists
        collection = chroma_client.get_collection(name="melifycollection")
        print("Collection 'melifycollection' already exists.")
    
    return collection

if __name__ == "__main__":
    try:
        collection = setup_chroma_collection()
        print(f"Connected to collection: {collection.name}")
    except Exception as e:
        print(f"Error: {e}")