import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MailsModule } from './mails/mails.module';
import { UsersModule } from './users/users.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { DraftsModule } from './drafts/drafts.module';
import { ChatModule } from './chat/chat.module';
import { TiptapModule } from './tiptap/tiptap.module';
import { CalendarModule } from './calendar/calendar.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes the ConfigModule global
    }),
    // Configure MongoDB connection based on environment
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Check if we're in development mode
        const isDevelopment =
          configService.get<string>('NODE_ENV') !== 'production';

        // Set the MongoDB URL based on the environment
        const mongodbUrl = isDevelopment
          ? 'mongodb://localhost:27017/melifydevelopment'
          : configService.get<string>('MONGODB_URI'); // Get from environment variable in production

        console.log(`MongoDB connecting to: ${mongodbUrl}`);

        return {
          uri: configService.get<string>('MONGODB_URI'),
          // Add any additional Mongoose connection options here
          useNewUrlParser: true,
          useUnifiedTopology: true,
        };
      },
      inject: [ConfigService],
    }),
    MailsModule,
    UsersModule,
    AiModule,
    AuthModule,
    AdminModule,
    DraftsModule,
    ChatModule,
    TiptapModule,
    CalendarModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
