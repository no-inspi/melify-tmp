import {
  Controller,
  Get,
  Query,
  Res,
  Req,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { google } from 'googleapis';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/users.schema';
import { Badge } from '../users/schemas/badge.schema';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';

// Extend the Request type to include cookies
interface RequestWithCookies extends Request {
  cookies: { [key: string]: string };
}

@Controller('auth')
export class AuthController {
  private oauth2Client: any;

  constructor(
    private readonly authService: AuthService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Badge.name) private badgeModel: Model<Badge>,
    private configService: ConfigService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      `${this.configService.get<string>('ENVIRONMENT_URL')}/api/auth/googleredirect`,
    );
  }

  @Get('googleredirect')
  async googleRedirect(
    @Query('code') code: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { returnUrl, tokens } =
        await this.authService.handleGoogleRedirect(code);

      res.cookie('auth_tokens', JSON.stringify(tokens), {
        httpOnly: true,
        secure: true,
        sameSite: 'strict', // Changed to lowercase 'strict'
      });

      res.redirect(returnUrl);
    } catch (error) {
      console.error('Error during Google redirect:', error);
      res.redirect(`${process.env.FRONT_URL}/dashboard/mail`);
    }
  }

  @Get('microsoftredirect')
  async microsoftRedirect(
    @Query('code') query: any,
    @Res() res: Response,
  ): Promise<void> {
    console.log('microsoft query: ', query);
    try {
      const code = query.code;

      if (code) {
        const tokenResponse = await axios.post(
          'https://login.microsoftonline.com/<TENANT_ID>/oauth2/v2.0/token',
          null,
          {
            params: {
              client_id: '<CLIENT_ID>',
              scope: 'User.Read Mail.Read',
              code: code,
              redirect_uri:
                'https://your-backend-url.com/auth/microsoft/callback',
              grant_type: 'authorization_code',
              client_secret: '<CLIENT_SECRET>',
            },
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        );

        const accessToken = tokenResponse.data.access_token;

        // Option 1: Return token to frontend
        res.redirect(`https://your-frontend-url.com?token=${accessToken}`);

        // Option 2: Use token in backend and send data to frontend
        // const userProfile = await axios.get('https://graph.microsoft.com/v1.0/me', {
        //   headers: { Authorization: `Bearer ${accessToken}` }
        // });
        // res.json({ profile: userProfile.data });
      }
    } catch (error) {
      console.error('Error during Google redirect:', error);
      res.redirect(`${process.env.FRONT_URL}/dashboard/mail`);
    }
  }

  @Get('session')
  async getSession(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const tokens = req.cookies['auth_tokens'];
      if (!tokens) {
        res.json({ isAuthenticated: false });
        return; // Explicit return for void method
      }

      const parsedTokens = JSON.parse(tokens);
      const idToken = parsedTokens['id_token'];
      const decodedToken = jwt.decode(idToken) as { [key: string]: any };

      if (!decodedToken || !decodedToken.email) {
        throw new UnauthorizedException('Invalid ID token');
      }

      const email = decodedToken.email;

      // Check token expiration
      const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
      if (decodedToken.exp < currentTime) {
        // If token expired, attempt to refresh it
        console.log(
          'Token expired, attempting to refresh',
          decodedToken.exp,
          decodedToken,
        );
        const newTokens = await this.authService.refreshAccessToken(email); // Use email as the identifier

        // Update cookies with refreshed tokens
        res.cookie('auth_tokens', JSON.stringify(newTokens), {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        });

        // Update parsedTokens with the new tokens
        parsedTokens.access_token = newTokens.access_token;
      }

      // Fetch user from database
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      console.log(parsedTokens);

      // Build session info
      const sessionInfo = {
        isAuthenticated: true,
        accessToken: parsedTokens['access_token'],
        refresh_token: parsedTokens['refresh_token'],
        email: user.email,
      };

      // Send the session info
      res.json(sessionInfo);
    } catch (error) {
      console.error('Error retrieving session:', error);
      res.status(500).send('Failed to retrieve session data');
    }
  }

  @Post('logout')
  logout(@Res() res: Response): void {
    res.clearCookie('auth_tokens', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict', // Changed to lowercase 'strict'
    });
    res.send({ message: 'Logged out successfully' });
  }

  @Get('me')
  async getMe(
    @Req() req: RequestWithCookies,
    @Res() res: Response,
  ): Promise<void> {
    if (req.cookies) {
      const tokens = req.cookies['auth_tokens'];
      if (tokens) {
        try {
          const parsedTokens = JSON.parse(tokens);
          this.oauth2Client.setCredentials(parsedTokens);
          const people = google.people({
            version: 'v1',
            auth: this.oauth2Client,
          });

          const me = await people.people.get({
            resourceName: 'people/me',
            personFields:
              'emailAddresses,names,photos,nicknames,occupations,photos,userDefined',
          });

          const firstName = me.data.names?.[0]?.displayName;
          const email = me.data.emailAddresses?.[0]?.value;
          const photo = me.data.photos?.[0]?.url;

          const existingUser = await this.userModel.findOne({ email });

          if (existingUser) {
            // Manually populate badgesList
            const badges = await this.badgeModel.find({
              _id: { $in: existingUser.badgesList }, // Query all badges with IDs in badgesList
            });

            // Convert Mongoose document to a plain JavaScript object
            const userWithBadges = {
              ...existingUser.toObject(), // Convert Mongoose document to plain object
              badgesList: badges, // Replace ObjectId array with badge details
            };

            res.json({
              user: {
                id: userWithBadges._id,
                displayName: firstName,
                email: email,
                photoURL: photo,
                isResumeBulleted: userWithBadges.isResumeBulleted,
                badgesList: userWithBadges.badgesList,
                levelNumber: userWithBadges.levelNumber,
                levelTitle: userWithBadges.levelTitle,
              },
            });
          } else {
            res.json({
              user: {
                displayName: firstName,
                email: email,
                photoURL: photo,
                role: 'admin',
              },
            });
          }
        } catch (error) {
          res.status(400).send(error);
        }
      } else {
        res.status(401).json({ message: 'Unauthorized' });
      }
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      const { email } = req.body; // assuming the user's email is passed in the request body
      const newTokens = await this.authService.refreshAccessToken(email);

      // Update the cookies with new tokens
      res.cookie('auth_tokens', JSON.stringify(newTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      return res.json(newTokens); // Return new tokens
    } catch (error) {
      console.error('Error refreshing token:', error);
      return res.status(401).json({ message: 'Unable to refresh token' });
    }
  }
}
