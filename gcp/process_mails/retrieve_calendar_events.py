import os
from datetime import datetime, timedelta
import functions_framework
import sentry_sdk
import chromadb

from config import load_config
from user_utils import get_user_by_email
from google_utils import setup_calendar_service
from db_manager import MongoDBConnectionManager
# from chromadb_utils import insert_calendar_event_to_chromadb

# Initialize Sentry for error tracking
def init_sentry():
    sentry_sdk.init(
        dsn=os.environ.get('SENTRY_SDK'),
        traces_sample_rate=1.0,
        profiles_sample_rate=1.0,
    )

API_KEY_MISTRAL = os.environ.get('API_KEY_MISTRAL')
        
init_sentry()

chroma_client = chromadb.PersistentClient(path="/tmp/chroma_db")

def fetch_calendar_events(service, user_email, days=30, days_ahead=30):
    """
    Fetch calendar events from Google Calendar for a specified time period.
    
    Args:
        service: Google Calendar service object
        user_email: User's email address
        days: Number of days to fetch events for
        
    Returns:
        List of calendar events
    """
    try:
        # Calculate time range
        now = datetime.utcnow()
        time_min = (now - timedelta(days=days)).isoformat() + 'Z'  # Start from X days ago
        # time_max = now.isoformat() + 'Z'  # Up to now
        time_max = (now + timedelta(days=days_ahead)).isoformat() + 'Z'
        
        all_events = []
        
        # Start with the primary calendar
        primary_calendar_id = 'primary'
    
        # Test service attributes
        print("Service object:", service)
        print("Service dir:", dir(service))
        
        # Test if the service has the calendars() method
        if hasattr(service, 'calendars'):
            print("Service has calendars() method")
        else:
            print("Service DOES NOT have calendars() method")
        
        # Test if the service has the events() method
        if hasattr(service, 'events'):
            print("Service has events() method")
        else:
            print("Service DOES NOT have events() method")
            
        # Test if the service has the calendarList() method
        if hasattr(service, 'calendarList'):
            print("Service has calendarList() method")
        else:
            print("Service DOES NOT have calendarList() method")
        
        try:
            # Try to access the primary calendar
            calendar = service.calendars().get(calendarId='primary').execute()
            print(f"Successfully accessed primary calendar: {calendar['summary']}")
        except Exception as e:
            print(f"Error accessing primary calendar: {e}")
        
        try:
            # Get events from primary calendar
            events_result = service.events().list(
                calendarId=primary_calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                maxResults=2500,  # Adjust as needed
                singleEvents=True,
                orderBy='startTime'
            ).execute()
            
            print(f"Fetching events from primary calendar: {primary_calendar_id}")
            print("events_result:", events_result)
            
            events = events_result.get('items', [])
            
            # Get calendar details for primary
            primary_calendar = service.calendars().get(calendarId=primary_calendar_id).execute()
            primary_calendar_title = primary_calendar.get('summary', 'Primary Calendar')
            
            # Add calendar info to each event
            for event in events:
                event['calendarId'] = primary_calendar_id
                event['calendarTitle'] = primary_calendar_title
                all_events.append(event)
                
            print(f"Found {len(events)} events in primary calendar")
            
        except Exception as e:
            print(f"Error fetching primary calendar: {str(e)}")
        
        # Try to get the list of additional calendars
        try:
            calendar_list = service.calendarList().list().execute()
            calendars = calendar_list.get('items', [])
            
            # For each calendar (except primary which we already processed)
            for calendar in calendars:
                calendar_id = calendar['id']
                
                # Skip primary calendar as we already processed it
                if calendar_id == 'primary':
                    continue
                    
                try:
                    events_result = service.events().list(
                        calendarId=calendar_id,
                        timeMin=time_min,
                        timeMax=time_max,
                        maxResults=2500,  # Adjust as needed
                        singleEvents=True,
                        orderBy='startTime'
                    ).execute()
                    
                    events = events_result.get('items', [])
                    
                    # Add calendar info to each event
                    for event in events:
                        event['calendarId'] = calendar_id
                        event['calendarTitle'] = calendar.get('summary', 'Unknown Calendar')
                        all_events.append(event)
                        
                    print(f"Found {len(events)} events in calendar: {calendar.get('summary')}")
                    
                except Exception as e:
                    print(f"Error fetching events for calendar {calendar_id}: {str(e)}")
                    continue
                    
        except Exception as e:
            print(f"Error fetching calendar list: {str(e)}")
            # Continue with just the primary calendar events
        
        print(f"Total events found: {len(all_events)}")
        return all_events
    
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error fetching calendar events: {str(e)}")
        return []
    
def process_calendar_events(service, user_email, db, days=30):
    """
    Process calendar events for a user.
    
    Args:
        service: Google Calendar service object
        user_email: User's email address
        db: MongoDB connection
        days: Number of days to fetch events for
        
    Returns:
        Number of events processed
    """
    try:
        # Fetch calendar events
        events = fetch_calendar_events(service, user_email, days)
        
        if not events:
            print(f"No events found for user: {user_email}")
            return 0
        
        print(f"Found {len(events)} events for user: {user_email}")
        
        # Get events collection from MongoDB
        events_collection = db.calendar_events
        processed_count = 0
        
        # Process each event
        for event in events:
            # Extract event information
            event_id = event.get('id', '')
            calendar_id = event.get('calendarId', '')
            
            # Check if event already exists in MongoDB
            existing_event = events_collection.find_one({
                'event_id': event_id,
                'calendar_id': calendar_id,
                'user_email': user_email
            })
            
            if existing_event:
                # Skip if event already processed
                continue
            
            # Extract event details
            summary = event.get('summary', 'No Title')
            description = event.get('description', '')
            location = event.get('location', '')
            
            # Extract start and end times
            start_time = None
            end_time = None
            
            if 'dateTime' in event.get('start', {}):
                start_time = event['start']['dateTime']
            elif 'date' in event.get('start', {}):
                start_time = event['start']['date'] + 'T00:00:00Z'
                
            if 'dateTime' in event.get('end', {}):
                end_time = event['end']['dateTime']
            elif 'date' in event.get('end', {}):
                end_time = event['end']['date'] + 'T23:59:59Z'
            
            # Get attendees
            attendees = []
            for attendee in event.get('attendees', []):
                attendee_email = attendee.get('email', '')
                if attendee_email:
                    attendees.append(attendee_email)
            
            # Create event document for MongoDB
            event_doc = {
                'event_id': event_id,
                'calendar_id': calendar_id,
                'calendar_title': event.get('calendarTitle', 'Unknown Calendar'),
                'user_email': user_email,
                'summary': summary,
                'description': description,
                'location': location,
                'start_time': start_time,
                'end_time': end_time,
                'attendees': attendees,
                'created': event.get('created', ''),
                'updated': event.get('updated', ''),
                'status': event.get('status', ''),
                'htmlLink': event.get('htmlLink', ''),
                'processed_at': datetime.utcnow().isoformat(),
                'raw_event': event  # Store the original event data
            }
            
            # Insert into MongoDB
            events_collection.insert_one(event_doc)
            
            # Insert into ChromaDB for semantic search
            # try:
            #     insert_calendar_event_to_chromadb(
            #         calendar_id=calendar_id,
            #         calendar_title=event.get('calendarTitle', 'Unknown Calendar'),
            #         event_id=event_id,
            #         summary=summary,
            #         description=description,
            #         location=location,
            #         start_time=start_time,
            #         end_time=end_time,
            #         attendees=attendees,
            #         user_email=user_email,
            #         collection_name=f"calendar_{user_email.split('@')[0]}",
            #         db_path="/tmp/chroma_db",
            #         additional_metadata={
            #             'status': event.get('status', ''),
            #             'htmlLink': event.get('htmlLink', ''),
            #             'created': event.get('created', ''),
            #             'updated': event.get('updated', '')
            #         }
            #     )
            # except Exception as e:
            #     sentry_sdk.capture_exception(e)
            #     print(f"Error inserting event into ChromaDB: {str(e)}")
            
            processed_count += 1
        
        return processed_count
    
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error processing calendar events: {str(e)}")
        return 0

@functions_framework.http
def batch_calendar_events(request):
    """
    Process calendar events for a specified user.
    
    Args:
        request: HTTP request containing user email
        
    Returns:
        Dict with status and processing information
    """
    try:
        config = load_config()
        
        # Extract request data
        data = request.get_json()
        user_email = data.get('user_email', "")
        days = data.get('days', 30)  # Default to 30 days
        
        with MongoDBConnectionManager() as db:    
            accounts_collection = db.accounts
            
            existing_account = accounts_collection.find_one({'email': user_email})
    
            # Check if account exists
            if not existing_account:
                print(f"No account found for email: {user_email}")
                return {'status': 'error', 'message': 'Account not found'}, 404
            
            print(f"Processing calendar events for account: {user_email}")

            user = get_user_by_email(user_email, db)
            # Update categories if needed, similar to email processing
            # update_categories_from_user(user)
            
            calendar_service = setup_calendar_service(db, existing_account, config)
            if not calendar_service:
                return {'status': 'error', 'message': 'Failed to authenticate with Calendar API'}, 401
            
            events_processed = process_calendar_events(
                calendar_service, 
                user_email, 
                db, 
                days=days
            )
            
            return {
                'status': 'success',
                'events_processed': events_processed
            }
            
    except Exception as e:
        sentry_sdk.capture_exception(e)
        print(f"Error in batch_calendar_events: {str(e)}")
        return {'status': 'error', 'message': str(e)}