import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../users/schemas/users.schema';
import { Email, EmailSchema } from '../mails/schemas/emails.schema';
import { Accounts, AccountsSchema } from '../users/schemas/accounts.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Email.name, schema: EmailSchema }]),
    MongooseModule.forFeature([
      { name: Accounts.name, schema: AccountsSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
