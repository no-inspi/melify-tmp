import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/users.schema'; // Adjust import path as necessary
import { Token } from './schemas/tokens.schema'; // Adjust import path as necessary
import { ProfileType } from 'src/users/schemas/profileType.schema';
import { google } from 'googleapis';
import { UserHelpers } from '../users/helpers/user.helpers';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private oauth2Client: any;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
    @InjectModel(ProfileType.name) private profileTypeModel: Model<ProfileType>,
    private readonly userHelpers: UserHelpers, // Inject the helper
    private configService: ConfigService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      `${this.configService.get<string>('ENVIRONMENT_URL')}/api/auth/googleredirect`,
    );
  }

  // Reusable method to get the user ID from the request
  async getUserIdFromRequest(req: any): Promise<string> {
    if (!req.cookies) {
      throw new UnauthorizedException('Authentication required.');
    }
    console.log(req.cookies);
    const authTokens = JSON.parse(req.cookies['auth_tokens'] || '{}');
    if (!authTokens.id_token) {
      throw new UnauthorizedException('No ID token found.');
    }

    try {
      // Verify the ID token and extract the payload
      const ticket = await this.oauth2Client.verifyIdToken({
        idToken: authTokens.id_token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'), // Specify your client_id
      });

      const payload = ticket.getPayload();
      console.log('payload', payload);
      const userId = payload?.sub;

      if (!userId) {
        throw new UnauthorizedException('User ID not found.');
      }

      return userId;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      if (error.message.includes('Token used too late')) {
        // Refresh the token and try again
        const email = JSON.parse(atob(authTokens.id_token.split('.')[1])).email;
        const newTokens = await this.refreshAccessToken(email);
        req.cookies['auth_tokens'] = JSON.stringify(newTokens);
        return this.getUserIdFromRequest(req); // Retry with refreshed token
      }
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }

  // Existing method for handling Google redirect
  async handleGoogleRedirect(
    code: string,
  ): Promise<{ returnUrl: string; tokens: any }> {
    const returnUrl = `${this.configService.get<string>('FRONT_URL')}/dashboard/mail`;

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      const people = google.people({ version: 'v1', auth: this.oauth2Client });

      const me = await people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses,names,photos',
      });

      const firstName = me.data.names?.[0]?.givenName;
      const email = me.data.emailAddresses?.[0]?.value;
      const photo = me.data.photos?.[0]?.url;

      console.log(
        `User info: Name - ${firstName}, Email - ${email}, Photo - ${photo}`,
      );

      const exists = await this.userHelpers.checkUserExists(email);
      let newUser: User;
      if (!exists) {
        const profileType = new this.profileTypeModel({
          description: 'description',
          categories: [],
        });

        await profileType.save();

        newUser = await this.userHelpers.createUser({
          firstName,
          email,
          photo,
          profileType,
        });

        // returnUrl = `${process.env.FRONT_URL}/profile/register`;
      }

      const user = await this.userModel.findOne({ email }).exec();
      if (!user) throw new InternalServerErrorException('User not found');

      user.lastConnection = Date.now(); // Update the lastConnection field

      await user.save(); // Save the user back to the database

      const existingToken = await this.tokenModel
        .findOne({ userId: user._id })
        .exec();

      if (existingToken) {
        Object.assign(existingToken, {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          id_token: tokens.id_token,
          expiry_date: tokens.expiry_date,
        });

        await existingToken.save();
      } else {
        const newToken = new this.tokenModel({
          userId: user._id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          id_token: tokens.id_token,
          expiry_date: tokens.expiry_date,
        });

        await newToken.save();
      }

      if (!exists) {
        (async () => {
          try {
            // Execute retrieveEmailByLabels and then retrieve30daysEmail
            await this.userHelpers.retrieveEmailByLabels(email);
            await this.userHelpers.retrieve30daysEmail(email);
          } catch (error) {
            console.error('Error executing email retrieval functions:', error);
          }
        })();

        // Add a 5-second delay
        await this.sleep(10000);
      } else {
        try {
          this.userHelpers.retrieveEmailByLabels(email);
          this.userHelpers.retrieve30daysEmail(email);
        } catch (error) {
          console.error('Error executing email retrieval functions 2:', error);
        }
      }

      return { returnUrl, tokens };
    } catch (error) {
      console.error('Error exchanging code for tokens', error);
      throw new InternalServerErrorException(
        'Error exchanging code for tokens',
      );
    }
  }

  async refreshAccessToken(email: string): Promise<any> {
    try {
      const user = await this.userModel.findOne({ email }).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokenRecord = await this.tokenModel
        .findOne({ userId: user._id })
        .exec();
      if (!tokenRecord || !tokenRecord.refreshToken) {
        throw new UnauthorizedException('Refresh token not found');
      }

      // Set the refresh token to oauth2Client
      this.oauth2Client.setCredentials({
        refresh_token: tokenRecord.refreshToken,
      });

      // Get a new access token using the refresh token
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      // Update the access token in the database
      tokenRecord.accessToken = credentials.access_token;
      tokenRecord.expiry_date = credentials.expiry_date;
      await tokenRecord.save();

      // Return the new access token and refresh token
      return {
        access_token: credentials.access_token,
        refresh_token: tokenRecord.refreshToken, // We keep the same refresh token
        id_token: credentials.id_token, // if ID token is provided
        expiry_date: credentials.expiry_date,
      };
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
