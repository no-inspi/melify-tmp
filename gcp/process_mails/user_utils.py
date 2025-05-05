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