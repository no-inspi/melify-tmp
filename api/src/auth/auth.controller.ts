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
import { Accounts } from '../users/schemas/accounts.schema';
import { Token } from './schemas/tokens.schema';
import { Badge } from '../users/schemas/badge.schema';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

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
    @InjectModel(Accounts.name) private accountsModel: Model<Accounts>,
    @InjectModel(Token.name) private tokenModel: Model<Token>,
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
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const { returnUrl, tokens } = await this.authService.handleGoogleRedirect(
        code,
        state,
      );

      console.log('Tokens received:', tokens);

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

  @Get('session')
  async getSession(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const authTokens = req.cookies['auth_tokens'];
      if (!authTokens) {
        res.json({ isAuthenticated: false });
        return;
      }

      const parsedTokens = JSON.parse(authTokens);
      const { accountId, id_token } = parsedTokens;

      if (!accountId) {
        throw new UnauthorizedException('No account ID in tokens');
      }

      const decodedToken = jwt.decode(id_token) as { [key: string]: any };
      if (!decodedToken || !decodedToken.email) {
        throw new UnauthorizedException('Invalid ID token');
      }

      // Check token expiration
      const currentTime = Math.floor(Date.now() / 1000);
      if (decodedToken.exp < currentTime) {
        // If token expired, attempt to refresh it
        console.log('Token expired, attempting to refresh');
        const newTokens = await this.authService.refreshAccessToken(accountId);

        // Update cookies with refreshed tokens
        res.cookie('auth_tokens', JSON.stringify(newTokens), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        });

        // Update parsedTokens with the new tokens
        parsedTokens.access_token = newTokens.access_token;
        parsedTokens.id_token = newTokens.id_token;
      }

      // Fetch account from database
      const account = await this.accountsModel.findById(accountId).exec();
      if (!account) {
        throw new UnauthorizedException('Account not found');
      }

      // Fetch user from database
      const user = await this.userModel.findById(account.userId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Get all user accounts
      const allAccounts = await this.accountsModel
        .find({ userId: user._id })
        .exec();

      // Build session info
      const sessionInfo = {
        isAuthenticated: true,
        accessToken: parsedTokens.access_token,
        refresh_token: parsedTokens.refresh_token,
        email: account.email,
        accountId: account._id,
        userId: user._id,
        accounts: allAccounts.map((acc) => ({
          accountId: acc._id,
          email: acc.email,
          isPrimary: acc.isPrimary,
          lastConnection: acc.lastConnection,
        })),
      };

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
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.send({ message: 'Logged out successfully' });
  }

  @Get('me')
  async getMe(
    @Req() req: RequestWithCookies,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const tokens = req.cookies['auth_tokens'];
      if (!tokens) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const parsedTokens = JSON.parse(tokens);
      const { accountId } = parsedTokens;

      if (!accountId) {
        res.status(401).json({ message: 'No account ID found' });
        return;
      }

      // Find the account
      const account = await this.accountsModel.findById(accountId).exec();
      if (!account) {
        res.status(401).json({ message: 'Account not found' });
        return;
      }

      // Find the user
      const user = await this.userModel.findById(account.userId).exec();
      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }

      // Set credentials for Google API
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
      // const email = me.data.emailAddresses?.[0]?.value;
      const photo = me.data.photos?.[0]?.url;

      // Get all user accounts
      const allAccounts = await this.accountsModel
        .find({ userId: user._id })
        .exec();

      // Manually populate badgesList
      const badges = await this.badgeModel.find({
        _id: { $in: user.badgesList },
      });

      // Convert Mongoose document to a plain JavaScript object
      const userWithBadges = {
        ...user.toObject(),
        badgesList: badges,
      };

      res.json({
        user: {
          id: userWithBadges._id,
          displayName: firstName || user.name,
          email: account.email,
          photoURL: photo || user.picture,
          isResumeBulleted: userWithBadges.isResumeBulleted,
          badgesList: userWithBadges.badgesList,
          levelNumber: userWithBadges.levelNumber,
          levelTitle: userWithBadges.levelTitle,
          currentAccount: {
            accountId: account._id,
            email: account.email,
            isPrimary: account.isPrimary,
          },
          accounts: allAccounts.map((acc) => ({
            accountId: acc._id,
            email: acc.email,
            isPrimary: acc.isPrimary,
            lastConnection: acc.lastConnection,
          })),
        },
      });
    } catch (error) {
      console.error('Error in getMe:', error);
      res.status(400).send(error);
    }
  }

  @Post('refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      const { accountId } = req.body; // Now expecting accountId instead of email

      if (!accountId) {
        return res.status(400).json({ message: 'Account ID is required' });
      }

      const newTokens = await this.authService.refreshAccessToken(accountId);

      // Update the cookies with new tokens
      res.cookie('auth_tokens', JSON.stringify(newTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      return res.json(newTokens);
    } catch (error) {
      console.error('Error refreshing token:', error);
      return res.status(401).json({ message: 'Unable to refresh token' });
    }
  }

  // New endpoint to switch between accounts
  @Post('switch-account')
  async switchAccount(@Req() req: Request, @Res() res: Response): Promise<any> {
    try {
      const { accountId } = req.body;

      if (!accountId) {
        return res.status(400).json({ message: 'Account ID is required' });
      }

      // Find the account
      const account = await this.accountsModel.findById(accountId).exec();
      if (!account) {
        return res.status(404).json({ message: 'Account not found' });
      }

      // Find the token
      const token = await this.tokenModel.findById(account.tokenId).exec();
      if (!token) {
        return res.status(404).json({ message: 'Token not found' });
      }

      // Prepare token data
      const tokenData = {
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
        id_token: token.id_token,
        expiry_date: token.expiry_date,
        accountId: account._id,
        email: account.email,
      };

      // Update the cookies with the selected account tokens
      res.cookie('auth_tokens', JSON.stringify(tokenData), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      // Update last connection for the account
      account.lastConnection = Date.now();
      await account.save();

      return res.json({
        message: 'Account switched successfully',
        account: {
          accountId: account._id,
          email: account.email,
          isPrimary: account.isPrimary,
        },
      });
    } catch (error) {
      console.error('Error switching account:', error);
      return res.status(500).json({ message: 'Unable to switch account' });
    }
  }

  // New endpoint to get all accounts for a user
  @Get('accounts')
  async getAccounts(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const tokens = req.cookies['auth_tokens'];
      if (!tokens) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const parsedTokens = JSON.parse(tokens);
      const { accountId } = parsedTokens;

      if (!accountId) {
        res.status(401).json({ message: 'No account ID found' });
        return;
      }

      // Find the current account to get the user ID
      const currentAccount = await this.accountsModel
        .findById(accountId)
        .exec();
      if (!currentAccount) {
        res.status(401).json({ message: 'Account not found' });
        return;
      }

      // Get all accounts for this user
      const allAccounts = await this.accountsModel
        .find({ userId: currentAccount.userId })
        .exec();

      res.json({
        accounts: allAccounts.map((acc) => ({
          accountId: acc._id,
          email: acc.email,
          isPrimary: acc.isPrimary,
          lastConnection: acc.lastConnection,
          isCurrent: acc._id.toString() === accountId,
        })),
      });
    } catch (error) {
      console.error('Error fetching accounts:', error);
      res.status(500).json({ message: 'Failed to fetch accounts' });
    }
  }
}
