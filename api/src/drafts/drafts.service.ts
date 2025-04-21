import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { google } from 'googleapis';

import { Email } from '../mails/schemas/emails.schema';

import { createMessage } from '../mails/helpers/email.helpers';
import { MailsGateway } from '../mails/mails.gateway';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class DraftsService {
  constructor(
    @InjectModel(Email.name) private emailModel: Model<Email>,
    private readonly mailsGateway: MailsGateway,
    private readonly authService: AuthService,
  ) {}

  async createDraft(oauth2Client: any, draftData: any): Promise<any> {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const draftDataClean = draftData.draftData;
    let attachments = draftDataClean.attachments;

    attachments = attachments.map((attachment) => {
      const { data, content, ...rest } = attachment;
      const base64data = data
        ? data.replace(/-/g, '+').replace(/_/g, '/') // Transform `data` if it exists
        : content; // Use `content` if `data` is not available

      return { ...rest, content: base64data }; // Always return as `content`
    });

    // Use your existing createMessage function to build the message
    const { raw } = await createMessage(
      draftDataClean.from,
      draftDataClean.to,
      draftDataClean.subject,
      draftDataClean.messageText,
      null, // threadId (null for a new draft)
      null, // email object
      draftDataClean.cc || [],
      draftDataClean.bcc || [],
      attachments || [],
      draftDataClean.sentfrommelify || true,
      draftDataClean.additionnalContent || '',
    );

    const response = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: {
          raw: raw,
        },
      },
    });

    console.log('response', response);

    // return response.data;
    return response.data;
  }

  async updateDraft(
    oauth2Client: any,
    draftId: string,
    draftData: any,
  ): Promise<any> {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    let attachments = draftData.attachments;

    attachments = attachments.map((attachment) => {
      const { data, content, ...rest } = attachment;
      const base64data = data
        ? data.replace(/-/g, '+').replace(/_/g, '/') // Transform `data` if it exists
        : content; // Use `content` if `data` is not available

      return { ...rest, content: base64data }; // Always return as `content`
    });

    // Use your existing createMessage function to build the message
    const { raw } = await createMessage(
      draftData.from,
      draftData.to,
      draftData.subject,
      draftData.message,
      draftData.threadId || null,
      null, // email object (for replies, if needed)
      draftData.cc || [],
      draftData.bcc || [],
      attachments || [],
      false,
      draftData.additionnalContent || '',
    );

    const response = await gmail.users.drafts.update({
      userId: 'me',
      id: draftId,
      requestBody: {
        message: {
          raw: raw,
        },
      },
    });

    return response.data;
  }

  async deleteDraft(req: any, draftId: string): Promise<any> {
    try {
      // Use the AuthService to get the userId
      const userId = await this.authService.getUserIdFromRequest(req);
      console.log(userId);
      const gmail = google.gmail({ version: 'v1', auth: req.oauth2Client });

      const response = await gmail.users.drafts.delete({
        userId: 'me',
        id: draftId,
      });

      const draftEmail = await this.emailModel.findOne({ draftId: draftId });

      console.log('draftEmail: ', draftEmail);

      if (response.status === 200 || response.status === 204) {
        // Emit mail update event to the user
        this.mailsGateway.sendDeleteThreadToUser(userId, draftEmail.threadId);
      }

      return response.data;
    } catch (error) {
      console.error('Error in deleteDraft:', error);
      throw new UnauthorizedException('Authentication required.');
    }
  }
}
