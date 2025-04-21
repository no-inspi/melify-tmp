import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../users/schemas/users.schema';
import { Token, TokenSchema } from './schemas/tokens.schema'; // Adjust import paths as necessary
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { Badge, BadgeSchema } from '../users/schemas/badge.schema';
import {
  ProfileType,
  ProfileTypeSchema,
} from 'src/users/schemas/profileType.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    MongooseModule.forFeature([{ name: Token.name, schema: TokenSchema }]),
    MongooseModule.forFeature([{ name: Badge.name, schema: BadgeSchema }]),
    MongooseModule.forFeature([
      { name: ProfileType.name, schema: ProfileTypeSchema },
    ]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
