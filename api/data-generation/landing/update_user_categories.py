import json
import random
from pymongo import MongoClient
from bson import ObjectId

def random_color():
    """Generate a random hex color."""
    return "#{:06x}".format(random.randint(0, 0xFFFFFF))


def load_categories(json_file_path):
    """Load the categories from a JSON file and format them for insertion."""
    with open(json_file_path, 'r') as file:
        data = json.load(file)
    
    # Assuming the categories are just names, we will format them into a full structure
    formatted_categories = []
    for category_name in data["profile_categories"]:
        formatted_category = {
            "name": category_name,
            "description": f"Description for {category_name}",
            "color": random_color(),  # Default color, can be customized
            "displayName": category_name,
            "disable": False
        }
        formatted_categories.append(formatted_category)
    
    return formatted_categories

def connect_to_mongo(db_name, mongo_uri):
    """Connect to MongoDB and return the database."""
    client = MongoClient(mongo_uri)
    db = client[db_name]
    return db

def update_user_categories(db, user_email, new_categories):
    """Find user by email, update profile's categories with new categories."""
    try:
        # Find the user by email
        user = db['users'].find_one({"email": user_email})
        if not user:
            print(f"User with email {user_email} not found.")
            return
        
        # Get the user's profileType ID
        profile_type_id = user.get("profileType")
        if not profile_type_id:
            print(f"User {user_email} does not have a profileType associated.")
            return
        
        # Find the profileType by its ObjectId
        profile_type = db['profiletypes'].find_one({"_id": ObjectId(profile_type_id)})
        if not profile_type:
            print(f"ProfileType with ID {profile_type_id} not found.")
            return
        
        # Update the profileType's categories: remove old categories and insert new ones
        db['profiletypes'].update_one(
            {"_id": ObjectId(profile_type_id)},
            {"$set": {"categories": new_categories}}
        )
        print(f"Updated categories for user {user_email}.")
    
    except Exception as e:
        print(f"Error updating categories: {e}")

if __name__ == "__main__":
    # Path to the categories JSON file
    json_file_path = 'categories.json'
    
    # Load the new categories from JSON file
    new_categories = load_categories(json_file_path)
    
    # MongoDB connection details
    mongo_uri = 'mongodb+srv://karma:ashoo4Aici3k@clusterprofus.caolqum.mongodb.net/melifydev?retryWrites=true&w=majority'
    db_name = 'melifydev'
    
    # Connect to MongoDB
    db = connect_to_mongo(db_name, mongo_uri)
    
    # User email to update
    user_email = 'contact@melify.fr'
    
    # Update the user's profileType categories
    update_user_categories(db, user_email, new_categories)
