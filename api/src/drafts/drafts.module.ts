import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';
import { SetupOAuth2ClientMiddleware } from '../middlewares/setup-oauth2-client.middleware'; // Adjust path as necessary
import { Email, EmailSchema } from '../mails/schemas/emails.schema'; // Import Email schema if needed
import { User, UserSchema } from '../users/schemas/users.schema'; // Import User schema
import { Token, TokenSchema } from '../auth/schemas/tokens.schema'; // Import Token schema
import { AuthModule } from '../auth/auth.module'; // Import AuthModule
import { MailsModule } from '../mails/mails.module'; // Import MailsModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Email.name, schema: EmailSchema }]), // Include the Email schema if needed
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), // Include the User schema
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]), // Include the Token schema
    AuthModule, // Import AuthModule to use AuthService
    MailsModule,
  ],
  controllers: [DraftsController],
  providers: [DraftsService],
})
export class DraftsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SetupOAuth2ClientMiddleware).forRoutes(
      { path: 'drafts', method: RequestMethod.POST }, // Route for creating drafts
      { path: 'drafts/:id', method: RequestMethod.PUT }, // Route for updating drafts
      { path: 'drafts/:id', method: RequestMethod.DELETE }, // Route for deleting drafts
    );
  }
}
