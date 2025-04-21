'use client';

import PropTypes from 'prop-types'; // Import prop-types
import Cookies from 'js-cookie';
import io from 'socket.io-client';
import React, { useState, useEffect, useContext, createContext } from 'react';

import { isValidToken, refreshTokenF } from 'src/auth/context/gmail/utils';

// Create a Context
const SocketContext = createContext(null);

// Socket Provider Component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Ensure client-side execution

    const authTokens = Cookies.get('cookie'); // Retrieve token from cookies
    if (authTokens) {
      const { access_token: accessToken, refresh_token: refreshToken } = JSON.parse(authTokens);

      const connectSocket = async () => {
        let validAccessToken = accessToken;

        if (!isValidToken(accessToken)) {
          console.log('Access token expired, attempting to refresh...');
          validAccessToken = await refreshTokenF();
        }

        if (validAccessToken) {
          // Connect to the Socket.IO server with the valid access token
          const socketIoInstance = io(process.env.NEXT_PUBLIC_SERVER_URL, {
            query: { token: validAccessToken, refresh_token: refreshToken },
          });

          socketIoInstance.on('connect', () => {
            console.log('Connected to Socket.IO server:', socketIoInstance.id);
          });

          socketIoInstance.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
          });

          setSocket(socketIoInstance);

          return () => {
            socketIoInstance.disconnect();
          };
        }
        return undefined;
      };

      connectSocket();
    }
    // eslint-disable-next-line
    return undefined;
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

// PropTypes validation for children prop
SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useSocket = () => useContext(SocketContext);
