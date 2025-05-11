import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Email extends Document {
  @Prop()
  date: string;

  @Prop()
  messageId: string;

  @Prop()
  threadId: string;

  @Prop()
  snippet: string;

  @Prop()
  to: string;

  @Prop()
  cc: string;

  @Prop()
  bcc: string;

  @Prop()
  deliveredTo: string;

  @Prop()
  from: string;

  @Prop([String])
  labelIds: string[];

  @Prop([String])
  categories: string[];

  @Prop()
  text: string;

  @Prop()
  html: string;

  @Prop()
  subject: string;

  @Prop()
  resume: string;

  @Prop()
  chatgptprop: string;

  @Prop()
  priority: number;

  @Prop()
  headers: string;

  @Prop()
  category: string;

  @Prop()
  generatedCategory: string;

  @Prop()
  userCategory: string;

  @Prop()
  summary: string;

  @Prop({ type: Array })
  attachments: any[];

  @Prop({ type: Array })
  payload: any[];

  @Prop()
  initialCategory: string;

  @Prop()
  isGoogleInvitation: boolean;

  @Prop()
  invitationStatus: string;
}

export const EmailSchema = SchemaFactory.createForClass(Email);
