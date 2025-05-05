import requests
import json

def refresh_access_token(refresh_token, client_id, client_secret):
    """
    Refresh OAuth2 access token using the refresh token.
    
    Args:
        refresh_token: OAuth2 refresh token
        client_id: Google OAuth2 client ID
        client_secret: Google OAuth2 client secret
        
    Returns:
        Tuple of (new_access_token, new_refresh_token)
    """
    data = {
        'client_id': client_id,
        'client_secret': client_secret,
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token'
    }
    response = requests.post('https://oauth2.googleapis.com/token', data=data)
    response_data = response.json()
    return response_data.get('access_token'), response_data.get('refresh_token', refresh_token)