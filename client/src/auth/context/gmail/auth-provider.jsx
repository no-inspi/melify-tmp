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
      let accountId = sessionStorage.getItem('accountId');
      let returnUrl = null;
      let email = null;

      const sessionResponse = await fetch(`${CONFIG.site.serverUrl}/api/auth/session`, {
        credentials: 'include',
      });

      if (sessionResponse.ok) {
        const data = await sessionResponse.json();

        if (data.returnUrl) {
          returnUrl = data.returnUrl;
        }

        accessToken = data.accessToken;
        refresh_token = data.refresh_token;
        email = data.email;
        accountId = data.accountId;

        // Store the account information
        if (accountId) {
          sessionStorage.setItem('accountId', accountId);
        }
        if (email) {
          sessionStorage.setItem('email', email);
        }
      } else {
        console.error('Session fetch failed');
      }

      if (accessToken && accountId) {
        const isExpired = !isValidToken(accessToken);

        if (isExpired) {
          accessToken = await refreshToken(accountId, logout); // Use accountId instead of email
          if (!accessToken) return; // Exit if refresh failed
        }

        setSession(accessToken, refresh_token, accountId, email);

        const response = await axios.get(endpoints.auth.me, {
          withCredentials: true, // Include cookies with the request
        });

        const { user } = response.data;

        setState({
          user: {
            ...user,
            accessToken,
            accountId,
            currentAccount: user.currentAccount,
          },
          loading: false,
        });

        if (returnUrl !== null) {
          router.replace(returnUrl);
        }
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error('Error checking user session:', error);
      setState({ user: null, loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add function to switch accounts
  const switchAccount = useCallback(
    async (newAccountId) => {
      try {
        const response = await fetch(`${CONFIG.site.serverUrl}/api/auth/switch-account`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ accountId: newAccountId }),
        });

        if (response.ok) {
          // Re-check user session to update with new account
          await checkUserSession();
        } else {
          console.error('Failed to switch account');
        }
      } catch (error) {
        console.error('Error switching account:', error);
      }
    },
    [checkUserSession]
  );

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
      switchAccount,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checkUserSession, state.user, status, switchAccount]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
