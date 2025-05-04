import axios from 'axios';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: [
      '*',
      'https://dev.melify.fr',
      'https://app.melify.fr',
      'http://localhost:3030',
    ],
    credentials: true,
  },
})
export class MailsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly configService: ConfigService) {}
  @WebSocketServer() server: Server;

  async handleConnection(@ConnectedSocket() clientSocket: Socket) {
    try {
      // Retrieve the token from query or cookie
      const token = clientSocket.handshake.query.token as string;
      const refreshToken = clientSocket.handshake.query.refresh_token as string;

      if (!token) {
        throw new UnauthorizedException('No token provided');
      }

      let userInfo = await this.verifyAccessToken(token);

      // If the token is expired, try to refresh it
      if (!userInfo) {
        console.log('Access token expired, attempting to refresh...');
        if (!refreshToken) {
          throw new UnauthorizedException('No refresh token provided');
        }
        const newAccessToken = await this.refreshAccessToken(refreshToken);
        if (newAccessToken) {
          userInfo = await this.verifyAccessToken(newAccessToken);
        } else {
          throw new UnauthorizedException('Failed to refresh access token');
        }
      }

      // Check if we got the user's info
      if (userInfo && userInfo.sub) {
        const userId = userInfo.sub;
        clientSocket.data.user = { id: userId, email: userInfo.email };

        // Join the user-specific room
        clientSocket.join(userId);
        console.log(`User ${userInfo.email} connected`);
      } else {
        throw new UnauthorizedException('Invalid token');
      }
    } catch (error) {
      console.error('Connection error:', error);
      clientSocket.disconnect(); // Disconnect the client if token is invalid
    }
  }

  async verifyAccessToken(token: string): Promise<any | null> {
    try {
      const { data } = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass the access token in the Authorization header
          },
        },
      );
      return data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Access token expired or invalid');
        return null; // Token is expired or invalid
      }
      throw error; // Other errors
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string | null> {
    try {
      const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
        client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'), // Replace with your client secret
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });
      return data.access_token;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      return null;
    }
  }

  handleDisconnect(clientSocket: Socket) {
    console.log(`User ${clientSocket.data.user?.email} disconnected`);
  }

  // Example function to emit updates to a specific user's room
  sendMailUpdateToUser(userId: string, fieldsToUpdate: any, mailId) {
    this.server.to(userId).emit('mail_update', {
      _id: mailId,
      ...fieldsToUpdate,
      // any other fields that changed
    });
  }

  sendThreadUpdateToUser(userId: string, fieldsToUpdate: any, mailId) {
    this.server.to(userId).emit('thread_update', {
      _id: mailId,
      ...fieldsToUpdate,
      // any other fields that changed
    });
  }

  sendMailDetailUpdateToUser(userId: string, fieldsToUpdate: any, mailId) {
    this.server.to(userId).emit('mail_detail_update', {
      _id: mailId,
      ...fieldsToUpdate,
    });
  }

  sendAddThreadToUser(userId: string, newEmail) {
    this.server.to(userId).emit('mail_add_thread', newEmail);
  }

  sendAddThreadToUserImportant(userId: string, newEmail) {
    this.server.to(userId).emit('mail_add_thread_important', newEmail);
  }

  sendDeleteThreadToUserImportant(userId: string, threadId) {
    this.server.to(userId).emit('mail_delete_thread_important', {
      _id: threadId,
    });
  }

  sendDeleteThreadToUser(userId: string, threadId) {
    this.server.to(userId).emit('mail_delete_thread', {
      _id: threadId,
    });
  }
}
