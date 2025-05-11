// calendar-event.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Nested schema for creator/organizer
class Person {
  @Prop({ required: true })
  email: string;
}

// Nested schema for start/end time
class EventTime {
  @Prop({ required: true })
  dateTime: string;

  @Prop()
  timeZone: string;
}

// Nested schema for attendee
class Attendee {
  @Prop({ required: true })
  email: string;

  @Prop()
  self?: boolean;

  @Prop()
  organizer?: boolean;

  @Prop()
  responseStatus: string;
}

// Nested schema for conference entry point
class EntryPoint {
  @Prop()
  entryPointType: string;

  @Prop()
  uri: string;

  @Prop()
  label: string;
}

// Nested schema for conference solution key
class ConferenceSolutionKey {
  @Prop()
  type: string;
}

// Nested schema for conference solution
class ConferenceSolution {
  @Prop({ type: ConferenceSolutionKey })
  key: ConferenceSolutionKey;

  @Prop()
  name: string;

  @Prop()
  iconUri: string;
}

// Nested schema for conference data
class ConferenceData {
  @Prop({ type: [EntryPoint] })
  entryPoints: EntryPoint[];

  @Prop({ type: ConferenceSolution })
  conferenceSolution: ConferenceSolution;

  @Prop()
  conferenceId: string;
}

// Nested schema for reminders
class Reminders {
  @Prop()
  useDefault: boolean;
}

// Raw event schema to store complete Google Calendar event data
class RawEvent {
  @Prop()
  kind: string;

  @Prop()
  etag: string;

  @Prop({ required: true })
  id: string;

  @Prop()
  status: string;

  @Prop()
  htmlLink: string;

  @Prop()
  created: Date;

  @Prop()
  updated: Date;

  @Prop()
  summary: string;

  @Prop({ type: Person })
  creator: Person;

  @Prop({ type: Person })
  organizer: Person;

  @Prop({ type: EventTime })
  start: EventTime;

  @Prop({ type: EventTime })
  end: EventTime;

  @Prop()
  iCalUID: string;

  @Prop()
  sequence: number;

  @Prop({ type: [Attendee] })
  attendees: Attendee[];

  @Prop()
  hangoutLink: string;

  @Prop({ type: ConferenceData })
  conferenceData: ConferenceData;

  @Prop({ type: Reminders })
  reminders: Reminders;

  @Prop()
  eventType: string;

  @Prop()
  calendarId: string;

  @Prop()
  calendarTitle: string;
}

@Schema({
  collection: 'calendar_events',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret) => {
      delete ret.__v;
      return ret;
    },
  },
})
export class CalendarEvent extends Document {
  @Prop({ required: true })
  event_id: string;

  @Prop({ required: true })
  calendar_id: string;

  @Prop()
  calendar_title: string;

  @Prop({ required: true })
  user_email: string;

  @Prop()
  summary: string;

  @Prop()
  description: string;

  @Prop()
  location: string;

  @Prop({ required: true })
  start_time: string;

  @Prop({ required: true })
  end_time: string;

  @Prop({ type: [String] })
  attendees: string[];

  @Prop()
  created: Date;

  @Prop()
  updated: Date;

  @Prop()
  status: string;

  @Prop()
  htmlLink: string;

  @Prop()
  processed_at: Date;

  @Prop({ type: Object })
  raw_event: RawEvent;
}

export const CalendarEventSchema = SchemaFactory.createForClass(CalendarEvent);

// Add indexes for common queries
CalendarEventSchema.index({ user_email: 1 });
CalendarEventSchema.index({ event_id: 1 });
CalendarEventSchema.index({ start_time: 1 });
