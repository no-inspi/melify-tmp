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
import { Accounts } from '../users/schemas/accounts.schema';
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
    @InjectModel(Accounts.name) private accountsModel: Model<Accounts>,
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
    state: string,
  ): Promise<{ returnUrl: string; tokens: any; userId?: string }> {
    let isAddingAccount = false;
    let existingUserId = null;

    // Parse state parameter if it exists
    if (state) {
      try {
        const stateObj = JSON.parse(decodeURIComponent(state));
        isAddingAccount = stateObj.isAddingAccount || false;
        existingUserId = stateObj.userId || null;
      } catch (e) {
        console.error('Error parsing state:', e);
      }
    }

    const defaultReturnUrl = `${this.configService.get<string>('FRONT_URL')}/dashboard/mail`;
    const accountsReturnUrl = `${this.configService.get<string>('FRONT_URL')}/dashboard/mail/accounts`;

    try {
      // Get tokens from Google
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      // Get user info from Google
      const people = google.people({ version: 'v1', auth: this.oauth2Client });
      const me = await people.people.get({
        resourceName: 'people/me',
        personFields: 'emailAddresses,names,photos',
      });

      const firstName = me.data.names?.[0]?.givenName;
      const email = me.data.emailAddresses?.[0]?.value;
      const photo = me.data.photos?.[0]?.url;

      if (!email) {
        throw new Error('No email found in Google response');
      }

      console.log(
        `User info: Name - ${firstName}, Email - ${email}, Photo - ${photo}`,
      );

      let user;
      let account;
      let isNewAccount = false;

      // Check if account already exists with this email
      account = await this.accountsModel.findOne({ email }).exec();

      if (isAddingAccount && existingUserId) {
        // Case 1: Adding a new account to existing user
        user = await this.userModel.findById(existingUserId).exec();
        if (!user) {
          throw new Error('User not found for adding account');
        }

        // Check if this email is already connected to this user
        if (account && account.userId.toString() === user._id.toString()) {
          // Account already exists for this user, just update tokens
          const existingToken = await this.tokenModel
            .findById(account.tokenId)
            .exec();

          if (existingToken) {
            Object.assign(existingToken, {
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              scope: tokens.scope,
              token_type: tokens.token_type,
              id_token: tokens.id_token,
              expiry_date: tokens.expiry_date,
              updatedAt: new Date(),
            });
            await existingToken.save();
          }

          return {
            returnUrl: accountsReturnUrl,
            tokens,
            userId: user._id.toString(),
          };
        } else if (account) {
          // This email is already connected to a different user
          throw new Error('This email is already associated with another user');
        }
        // If account doesn't exist, we'll create it below
      } else {
        // Case 2: Normal sign-in flow
        if (account) {
          // Account exists, get the associated user
          user = await this.userModel.findById(account.userId).exec();
          if (!user) {
            throw new Error('User not found for existing account');
          }
        } else {
          // New user and new account
          const profileType = new this.profileTypeModel({
            description: 'description',
            categories: [],
          });
          await profileType.save();

          user = await this.userHelpers.createUser({
            firstName,
            email,
            photo,
            profileType: profileType._id,
          });
          isNewAccount = true;
        }
      }

      // Handle account creation or update
      if (!account) {
        // Create new token
        const newToken = new this.tokenModel({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          scope: tokens.scope,
          token_type: tokens.token_type,
          id_token: tokens.id_token,
          expiry_date: tokens.expiry_date,
        });
        await newToken.save();

        // Create new account
        const userAccounts = await this.accountsModel.countDocuments({
          userId: user._id,
        });
        account = new this.accountsModel({
          userId: user._id,
          tokenId: newToken._id,
          email: email,
          lastConnection: Date.now(),
          isPrimary: userAccounts === 0, // First account is primary
        });
        await account.save();

        // Update token with accountId
        newToken.accountId = account._id;
        await newToken.save();

        isNewAccount = true;
      } else {
        // Update existing token
        const existingToken = await this.tokenModel
          .findById(account.tokenId)
          .exec();

        if (existingToken) {
          Object.assign(existingToken, {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            scope: tokens.scope,
            token_type: tokens.token_type,
            id_token: tokens.id_token,
            expiry_date: tokens.expiry_date,
            updatedAt: new Date(),
          });
          await existingToken.save();
        }
      }

      // Update user's last connection
      user.lastConnection = Date.now();
      await user.save();

      // Update account's last connection
      account.lastConnection = Date.now();
      await account.save();

      // Retrieve emails for new accounts
      if (isNewAccount) {
        // For new accounts, wait for email retrieval
        try {
          await this.userHelpers.retrieveEmailByLabels(email);
          await this.userHelpers.retrieve30daysEmail(email);
          await this.sleep(5000);
        } catch (error) {
          console.error('Error executing email retrieval functions:', error);
        }
      } else {
        // For existing accounts, run in background
        this.userHelpers.retrieveEmailByLabels(email).catch((error) => {
          console.error('Error retrieving emails by labels:', error);
        });
        this.userHelpers.retrieve30daysEmail(email).catch((error) => {
          console.error('Error retrieving 30 days emails:', error);
        });
      }

      // Return appropriate URL based on the action
      const returnUrl = isAddingAccount ? accountsReturnUrl : defaultReturnUrl;

      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        id_token: tokens.id_token,
        expiry_date: tokens.expiry_date,
        accountId: account._id,
        email: account.email,
      };

      return {
        returnUrl,
        tokens: tokenData,
        userId: user._id.toString(),
      };
    } catch (error) {
      console.error('Error exchanging code for tokens', error);
      throw new InternalServerErrorException(
        'Error exchanging code for tokens',
      );
    }
  }

  async refreshAccessToken(accountId: string): Promise<any> {
    try {
      // Find the account
      const account = await this.accountsModel.findById(accountId).exec();
      if (!account) {
        throw new UnauthorizedException('Account not found');
      }

      // Find the token for this account
      const tokenRecord = await this.tokenModel
        .findById(account.tokenId)
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
      tokenRecord.id_token = credentials.id_token;
      await tokenRecord.save();

      // Return the new access token and refresh token
      return {
        access_token: credentials.access_token,
        refresh_token: tokenRecord.refreshToken, // We keep the same refresh token
        id_token: credentials.id_token, // if ID token is provided
        expiry_date: credentials.expiry_date,
        accountId: account._id,
        email: account.email,
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
