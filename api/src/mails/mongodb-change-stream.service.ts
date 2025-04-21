import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { User } from '../users/schemas/users.schema';
import { Email } from './schemas/emails.schema';
import { MailsGateway } from './mails.gateway';
import { AuthService } from '../auth/auth.service';
import { Token } from 'src/auth/schemas/tokens.schema';

@Injectable()
export class MongoDbChangeStreamService {
  constructor(
    private readonly emailModel: Model<Email>,
    private readonly userModel: Model<User>,
    private readonly mailsGateway: MailsGateway,
    private readonly authService: AuthService,
    private readonly tokenModel: Model<Token>,
  ) {}

  async setupEmailChangeStream(): Promise<void> {
    const changeStream = this.emailModel.watch();

    // Listen for changes in the collection
    changeStream.on('change', async (change) => {
      console.log('Change detected in emails collection:', change);

      if (change.operationType === 'insert') {
        // Handle new email insertion
        const newEmail = change.fullDocument;
        this.mailsGateway.sendMailUpdateToUser(
          newEmail.userId, // Assuming the email document has a userId field
          newEmail,
          newEmail._id,
        );
      } else if (change.operationType === 'update') {
        console.log('Email updated:', change.documentKey._id);

        const email = await this.emailModel
          .findById(change.documentKey._id)
          .exec();

        if (!email) return;

        const user = await this.userModel
          .findOne({ email: email.deliveredTo })
          .exec();
        if (!user) return;

        const token = await this.tokenModel.findOne({ userId: user._id });
        if (!token) return;

        const userId = await this.authService.getUserIdFromRequest({
          cookies: { auth_tokens: JSON.stringify(token) },
        });

        console.log('userId: ', userId);

        // Handle email update
        const updatedThreadId = email.threadId;
        this.mailsGateway.sendMailUpdateToUser(
          userId,
          change.updateDescription.updatedFields,
          updatedThreadId,
        );
      }
    });
  }
}
