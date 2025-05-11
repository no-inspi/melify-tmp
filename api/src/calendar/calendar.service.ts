import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CalendarEvent } from './schemas/calendar_events.schema';
import { Email } from '../mails/schemas/emails.schema';
import { google } from 'googleapis';

@Injectable()
export class CalendarService {
  constructor(
    @InjectModel(CalendarEvent.name)
    private calendarEventModel: Model<CalendarEvent>,
    @InjectModel(Email.name)
    private emailModel: Model<Email>,
  ) {}

  async findOne(eventId: string): Promise<CalendarEvent> {
    return this.calendarEventModel.findOne({ event_id: eventId }).exec();
  }

  /**
   * Updates an attendee's response status for a calendar event
   *
   * @param eventId The event ID
   * @param attendeeEmail The email of the attendee
   * @param responseStatus The new response status (accepted, declined, tentative, needsAction)
   * @returns The updated calendar event
   */
  async updateAttendeeStatus(
    eventId: string,
    attendeeEmail: string,
    responseStatus: 'accepted' | 'declined' | 'tentative',
    oauth2Client: any,
  ): Promise<CalendarEvent> {
    // First, find the event in our database
    const event = await this.calendarEventModel
      .findOne({ event_id: eventId })
      .exec();

    const email = await this.emailModel.findOne({ eventId: eventId }).exec();

    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found`);
    }

    // Check if the attendee is part of the event
    if (!event.attendees.includes(attendeeEmail)) {
      throw new NotFoundException(
        `Attendee ${attendeeEmail} is not part of this event`,
      );
    }

    try {
      const googleCalendarService = google.calendar({
        version: 'v3',
        auth: oauth2Client,
      });

      const calendarId = event.calendar_id;

      // First get the event to make sure we have the latest version
      const google_event = await googleCalendarService.events.get({
        calendarId,
        eventId,
      });

      // Get the current attendees list
      const attendees = google_event.data.attendees || [];

      // Find the attendee and update their response status
      let attendeeFound = false;
      for (const attendee of attendees) {
        if (attendee.email === attendeeEmail) {
          attendee.responseStatus = responseStatus;
          attendeeFound = true;
          break;
        }
      }

      if (!attendeeFound) {
        throw new Error(
          `Attendee ${attendeeEmail} not found in event attendees`,
        );
      }

      // Update the event with the new attendee status
      const updatedEvent = await googleCalendarService.events.patch({
        calendarId,
        eventId,
        requestBody: {
          attendees,
        },
      });

      // Update the email invitationStatus
      if (email) {
        email.invitationStatus = responseStatus;
        await email.save();
      }

      // IMPORTANT CHANGE: Use findOneAndUpdate with $set operator to update nested fields
      // This ensures Mongoose properly updates the nested array element
      const updatedDbEvent = await this.calendarEventModel.findOneAndUpdate(
        {
          event_id: eventId,
          'raw_event.attendees.email': attendeeEmail,
        },
        {
          $set: {
            'raw_event.attendees.$.responseStatus': responseStatus,
            updated: new Date(),
            processed_at: new Date(),
          },
        },
        { new: true }, // Return the updated document
      );

      // If the attendee wasn't found in the query, the update won't happen
      // Let's verify and log a warning if necessary
      if (!updatedDbEvent) {
        console.warn(
          `Could not update attendee status in database. Attendee might not be in raw_event.attendees array.`,
        );

        // As a fallback, update the entire raw_event field
        if (event.raw_event && event.raw_event.attendees) {
          const updatedRawEvent = { ...event.raw_event };

          // Find and update the attendee
          const attendeeIndex = updatedRawEvent.attendees.findIndex(
            (a) => a.email === attendeeEmail,
          );

          if (attendeeIndex >= 0) {
            updatedRawEvent.attendees[attendeeIndex].responseStatus =
              responseStatus;

            // Update the full raw_event field
            const fallbackUpdate =
              await this.calendarEventModel.findOneAndUpdate(
                { event_id: eventId },
                {
                  $set: {
                    raw_event: updatedRawEvent,
                    updated: new Date(),
                    processed_at: new Date(),
                  },
                },
                { new: true },
              );

            return fallbackUpdate;
          }
        }
      }

      return updatedDbEvent || event;
    } catch (error) {
      console.error('Error updating attendee status:', error);
      throw new Error(`Failed to update attendee status: ${error.message}`);
    }
  }
}
