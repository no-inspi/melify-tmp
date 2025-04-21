import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TiptapService {
  private readonly TIPTAP_SECRET =
    'AL7eds5mUqCAm9C2WfZXuX75rRD7ypuKrlrxAhXcfoca4DJL69wNarZ6nyYToG3p'; // Replace with your actual Tiptap secret
  private readonly TIPTAP_APP_ID = '7meg5rgk'; // Replace with your actual appId

  generateToken(): string {
    const payload = {
      iat: Math.floor(Date.now() / 1000), // Issued at (current time)
      exp: Math.floor(Date.now() / 1000) + 3600, // Expiration time (1 hour later)
      iss: 'https://cloud.tiptap.dev', // Issuer URL
      aud: this.TIPTAP_APP_ID, // Audience (your appId)
    };

    // Generate a signed JWT using the HS256 algorithm
    return jwt.sign(payload, this.TIPTAP_SECRET, { algorithm: 'HS256' });
  }
}
