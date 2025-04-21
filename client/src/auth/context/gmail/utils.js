import Cookies from 'js-cookie';

import { paths } from 'src/routes/paths';

// eslint-disable-next-line import/no-cycle
import axios from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

export function jwtDecode(token) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

// ----------------------------------------------------------------------

export async function isValidToken(accessToken) {
  if (!accessToken) {
    return false;
  }

  try {
    // Send a request to Google's Token Info API to validate the token
    const response = await axios.get('https://www.googleapis.com/oauth2/v3/tokeninfo', {
      params: {
        access_token: accessToken,
      },
    });

    if (!response.ok) throw new Error('Failed to validate token');

    // If the token is valid, the response will contain the token details
    return true; // Token is valid
  } catch (error) {
    console.error('Error validating token:', error);
    return false; // Token is invalid or expired
  }
}

// ----------------------------------------------------------------------

export function tokenExpired(exp) {
  // eslint-disable-next-line prefer-const
  let expiredTimer;

  const currentTime = Date.now();

  // Test token expires after 10s
  // const timeLeft = currentTime + 10000 - currentTime; // ~10s
  const timeLeft = exp * 1000 - currentTime;

  clearTimeout(expiredTimer);

  expiredTimer = setTimeout(() => {
    alert('Token expired');

    sessionStorage.removeItem('accessToken');

    window.location.href = paths.auth.jwt.login;
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function setSession(accessToken, refresh_token = null) {
  try {
    if (accessToken) {
      // Store accessToken in sessionStorage
      sessionStorage.setItem('accessToken', accessToken);

      // Store refreshToken if provided
      if (refresh_token) {
        sessionStorage.setItem('refreshToken', refresh_token);
      }

      // Decode the access token to get the expiration time
      const tokenData = JSON.stringify({
        access_token: accessToken,
        refresh_token: refresh_token || sessionStorage.getItem('refreshToken'),
      });

      Cookies.set('cookie', tokenData, {
        path: '/',
        expires: 7,
        secure: false, // Set to false for localhost
        sameSite: 'strict',
      });

      // Set Authorization header for axios
      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
    } else {
      // Remove accessToken from sessionStorage and cookies
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');

      Cookies.remove('cookie');

      delete axios.defaults.headers.common.Authorization;
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}

export const refreshToken = async (email, logout) => {
  try {
    const response = await fetch(`${CONFIG.site.serverUrl}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email }), // Send email in the body
    });

    if (!response.ok) throw new Error('Failed to refresh token');

    const { access_token, refresh_token } = await response.json(); // Expect access and refresh tokens in the response
    setSession(access_token, refresh_token); // Update session with both tokens

    return access_token; // Return the new access token
  } catch (error) {
    console.error('Error refreshing token:', error);
    if (logout) logout(); // Log out user if refresh fails
    return null;
  }
};

export const refreshTokenF = async () => {
  const refresh_token = sessionStorage.getItem('refreshToken');

  if (!refresh_token) {
    console.error('No refresh token found');
    return null;
  }

  try {
    const response = await axios.post(`${CONFIG.site.serverUrl}/api/auth/refresh`, {
      refresh_token,
    });

    const { accessToken } = response.data;
    setSession(accessToken); // Update session with new access token
    return accessToken;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};
