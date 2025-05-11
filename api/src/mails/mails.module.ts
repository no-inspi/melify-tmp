import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MailsController } from './mails.controller';
import { MailsService } from './mails.service';
import { TemplateService } from 'src/templates/templates.service';
import { Email, EmailSchema } from './schemas/emails.schema';
import { User, UserSchema } from '../users/schemas/users.schema';
import { Accounts, AccountsSchema } from '../users/schemas/accounts.schema';
import {
  ProfileType,
  ProfileTypeSchema,
} from '../users/schemas/profileType.schema';
import { SetupOAuth2ClientMiddleware } from '../middlewares/setup-oauth2-client.middleware'; // Adjust the import path as necessary
import { Thread, ThreadSchema } from './schemas/thread.schema';
import {
  MailsInteraction,
  MailsInteractionSchema,
} from './schemas/mailsinteraction.schema';
import { MailsGateway } from './mails.gateway';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule
import { Token, TokenSchema } from 'src/auth/schemas/tokens.schema';
import { UsersModule } from '../users/users.module'; // Import UsersModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Email.name, schema: EmailSchema }]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([
      { name: Accounts.name, schema: AccountsSchema },
    ]),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    MongooseModule.forFeature([
      { name: ProfileType.name, schema: ProfileTypeSchema },
    ]),
    MongooseModule.forFeature([{ name: Thread.name, schema: ThreadSchema }]),
    MongooseModule.forFeature([
      { name: MailsInteraction.name, schema: MailsInteractionSchema },
    ]),
    AuthModule,
    UsersModule,
  ],
  controllers: [MailsController],
  providers: [MailsService, TemplateService, MailsGateway],
  exports: [MailsGateway],
})
export class MailsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SetupOAuth2ClientMiddleware)
      .forRoutes(
        { path: 'mails/setAsRead', method: RequestMethod.PUT },
        { path: 'mails/updateLabel', method: RequestMethod.PUT },
        { path: 'mails/addMail', method: RequestMethod.POST },
        { path: 'mails/addAnswer', method: RequestMethod.POST },
        { path: 'mails/forward', method: RequestMethod.POST },
        { path: 'mails/thread/:id', method: RequestMethod.DELETE },
      );
  }
}
