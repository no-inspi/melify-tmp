'use client';

import { useMemo, useEffect, useCallback } from 'react';

import { useRouter } from 'src/routes/hooks';

import { useSetState } from 'src/hooks/use-set-state';

import axios, { endpoints } from 'src/utils/axios';

import { CONFIG } from 'src/config-global';

import { STORAGE_KEY } from './constant';
import { AuthContext } from '../auth-context';
import { setSession, isValidToken, refreshToken } from './utils';

// ----------------------------------------------------------------------

export function AuthProvider({ children }) {
  const { state, setState } = useSetState({
    user: null,
    from: null,
    loading: true,
  });

  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      const response = await fetch(`${CONFIG.site.serverUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (response.ok) {
        setSession(null); // Clear session on logout
        setState({ user: null });
        router.replace('/login'); // Redirect to login
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const checkUserSession = useCallback(async () => {
    try {
      let accessToken = sessionStorage.getItem(STORAGE_KEY);
      let refresh_token = sessionStorage.getItem('refreshToken');
      let returnUrl = null;
      let email = null;

      await fetch(`${CONFIG.site.serverUrl}/api/auth/session`, {
        credentials: 'include',
      })
        .then((response) => {
          if (response.ok) {
            // Check if the status code is 200-299
            return response.json(); // Parses the body of the response as JSON
          }
          throw new Error('Network response was not ok.');
        })
        .then((data) => {
          if (data.returnUrl) {
            returnUrl = data.returnUrl;
          }
          accessToken = data.accessToken;
          refresh_token = data.refresh_token;
          email = data.email;
        })
        .catch((error) => {
          console.error('There has been a problem with your fetch operation:', error);
        });
      if (accessToken) {
        const isExpired = !isValidToken(accessToken);

        if (isExpired) {
          accessToken = await refreshToken(email, logout); // Refresh token if expired
          if (!accessToken) return; // Exit if refresh failed
        }

        setSession(accessToken, refresh_token);

        const response = await axios.get(endpoints.auth.me, {
          withCredentials: true, // Include cookies with the request
        });

        const { user } = response.data;

        setState({ user: { ...user, accessToken }, loading: false });

        if (returnUrl !== null) {
          router.replace(returnUrl);
        }
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user
        ? {
            ...state.user,
            role: state.user?.role ?? 'admin',
          }
        : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
      logout,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checkUserSession, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
