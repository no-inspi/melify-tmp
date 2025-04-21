import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/users.schema';
import { ProfileType, ProfileTypeSchema } from './schemas/profileType.schema';
import { Email, EmailSchema } from '../mails/schemas/emails.schema';

import { UserHelpers } from './helpers/user.helpers';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import {
  MailsInteraction,
  MailsInteractionSchema,
} from 'src/mails/schemas/mailsinteraction.schema';
import { Contact, ContactSchema } from './schemas/contact.schema';
import { Search, SearchSchema } from './schemas/search.schema';
import { Token, TokenSchema } from 'src/auth/schemas/tokens.schema';
import { Thread, ThreadSchema } from 'src/mails/schemas/thread.schema';
import { Badge, BadgeSchema } from './schemas/badge.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Email.name, schema: EmailSchema }]),
    MongooseModule.forFeature([
      { name: ProfileType.name, schema: ProfileTypeSchema },
    ]),
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
    ]),

    MongooseModule.forFeature([
      { name: MailsInteraction.name, schema: MailsInteractionSchema },
    ]),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    MongooseModule.forFeature([{ name: Contact.name, schema: ContactSchema }]),
    MongooseModule.forFeature([{ name: Search.name, schema: SearchSchema }]),
    MongooseModule.forFeature([{ name: Thread.name, schema: ThreadSchema }]),
    MongooseModule.forFeature([{ name: Badge.name, schema: BadgeSchema }]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserHelpers],
  exports: [UserHelpers], // Export the helper
})
export class UsersModule {}
