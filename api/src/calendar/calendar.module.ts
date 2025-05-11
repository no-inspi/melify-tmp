import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CalendarEvent,
  CalendarEventSchema,
} from './schemas/calendar_events.schema';
import { Email, EmailSchema } from '../mails/schemas/emails.schema';
import { SetupOAuth2ClientMiddleware } from '../middlewares/setup-oauth2-client.middleware'; // Adjust the import path as necessary

import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { AuthModule } from '../auth/auth.module'; // Import AuthModule

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarEvent.name, schema: CalendarEventSchema },
    ]),
    MongooseModule.forFeature([{ name: Email.name, schema: EmailSchema }]),
    AuthModule,
  ],
  providers: [CalendarService],
  controllers: [CalendarController],
})
export class CalendarModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SetupOAuth2ClientMiddleware).forRoutes({
      path: 'calendar/updateEventStatus',
      method: RequestMethod.POST,
    });
  }
}
