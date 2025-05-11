import re
import base64
from icalendar import Calendar
from google_utils import setup_calendar_service

def is_calendar_invitation(message):
    # Get email headers and parts
    headers = message.get('payload', {}).get('headers', [])
    parts = message.get('payload', {}).get('parts', [])
    
    # Check for calendar-related headers
    for header in headers:
        if header.get('name', '').lower() == 'content-type':
            content_type = header.get('value', '')
            if 'text/calendar' in content_type or 'application/ics' in content_type:
                return True
    
    # Check for .ics attachments
    for part in parts:
        filename = part.get('filename', '')
        if filename.endswith('.ics'):
            return True
            
        # Check nested parts
        nested_parts = part.get('parts', [])
        for nested_part in nested_parts:
            if nested_part.get('filename', '').endswith('.ics'):
                return True
            
            # Check for calendar MIME type
            mime_type = nested_part.get('mimeType', '')
            if mime_type == 'text/calendar':
                return True
    
    # Look for Google Calendar specific patterns
    for header in headers:
        if header.get('name', '').lower() == 'subject':
            subject = header.get('value', '')
            if re.search(r'invitation:|invited you to', subject, re.IGNORECASE):
                return True
                
    return False

def check_invitation_status_from_calendar_api(calendar_service, event_id, user_email=None):
    """
    Check invitation status using the Calendar API (more reliable than email)
    
    Args:
        credentials: Google API credentials
        event_id: The Google Calendar event ID
        user_email: User's email (if None, will use credentials email)
        
    Returns:
        str: 'accepted', 'declined', 'tentative', 'needsAction', or None
    """
    try:        
        # If user_email not provided, try to get it from credentials
        if user_email is None:
            return None
        print(f"Checking invitation status for event ID: {event_id} and user email: {user_email}")
        # Get the event from the primary calendar
        event = calendar_service.events().get(calendarId='primary', eventId=event_id).execute()
        
        # Find the user in attendees
        attendees = event.get('attendees', [])
        for attendee in attendees:
            if attendee.get('email') == user_email:
                response_status = attendee.get('responseStatus')
                
                if response_status == 'accepted':
                    return 'accepted'
                elif response_status == 'declined':
                    return 'declined'
                elif response_status == 'tentative':
                    return 'tentative'
                elif response_status == 'needsAction':
                    return 'needsAction'
                else:
                    return 'needsAction'
        
        return None  # User not found in attendees
        
    except Exception as e:
        print(f"Error checking calendar invitation status: {e}")
        return None

def get_event_invitation_status(calendar_service, attachment_data=None):
    """
    Get invitation status using both ICS and Calendar API methods
    
    Args:
        message: Gmail message
        attachment_data: Optional ICS attachment data
        credentials: Optional Google API credentials
        
    Returns:
        str: Invitation status
    """
    # First try to extract event ID from the message or ICS data
    event_id = None
    
    event_id = get_event_id(attachment_data)
    
    # 2. If we have credentials and event ID, use Calendar API (more reliable)
    if calendar_service and event_id:
        status = check_invitation_status_from_calendar_api(calendar_service, event_id, "charlie.apcher@gmail.com")
        if status:
            return status
    
    # 4. Default to needsAction if nothing else worked
    return 'needsAction'

def get_event_id(attachment_data=None):
    event_id = None
    
    # 1. Try to get event ID from ICS attachment
    if attachment_data and 'data' in attachment_data:
        try:
            ics_data = base64.urlsafe_b64decode(attachment_data['data']).decode('utf-8')
            cal = Calendar.from_ical(ics_data)
            
            for component in cal.walk():
                if component.name == "VEVENT":
                    full_uid = str(component.get('UID', '')).strip()
                    event_id = full_uid.split('@google.com')[0] if '@google.com' in full_uid else full_uid
                    break
        except Exception as e:
            print(f"Error extracting event ID from ICS: {e}")
    return event_id