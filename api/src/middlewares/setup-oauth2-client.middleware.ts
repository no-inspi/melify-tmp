import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SetupOAuth2ClientMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!req.cookies || !req.cookies['auth_tokens']) {
      throw new UnauthorizedException('Authorization required');
    }

    const tokens = JSON.parse(req.cookies['auth_tokens']);
    const oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      `${this.configService.get<string>('ENVIRONMENT_URL')}/api/auth/googleredirect`,
    );

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
    });

    req['oauth2Client'] = oauth2Client; // Attach OAuth2 client to request object
    next();
  }
}
