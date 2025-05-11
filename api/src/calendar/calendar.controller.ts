import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { CalendarService } from './calendar.service';
import { CalendarEvent } from './schemas/calendar_events.schema';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly authService: AuthService,
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CalendarEvent> {
    const calendarEvent = await this.calendarService.findOne(id);
    console.log(calendarEvent);
    return this.calendarService.findOne(id);
  }

  @Post('updateEventStatus')
  async respondToInvitation(@Body() body: any, @Req() req: any) {
    if (!req.cookies) {
      throw new UnauthorizedException('Authentication required.');
    }
    if (!body.eventId) {
      throw new BadRequestException('Event ID is required');
    }

    if (!body.email) {
      throw new BadRequestException('Attendee email is required');
    }

    if (!['accepted', 'declined', 'tentative'].includes(body.response)) {
      throw new BadRequestException(
        'Invalid response status. Must be accepted, declined, tentative',
      );
    }

    try {
      const eventId = body.eventId;
      // Use the AuthService to get the userId
      const userId = await this.authService.getUserIdFromRequest(req);

      console.log('User ID from request:', userId);

      const updatedEvent = await this.calendarService.updateAttendeeStatus(
        eventId,
        body.email,
        body.response,
        req.oauth2Client,
      );

      if (!updatedEvent) {
        throw new NotFoundException(
          `Event with ID ${eventId} not found or user is not an attendee`,
        );
      }

      return {
        success: true,
        message: `Successfully updated invitation status to ${body.response}`,
        event: updatedEvent,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to update invitation status: ${error.message}`,
      );
    }
  }
}
