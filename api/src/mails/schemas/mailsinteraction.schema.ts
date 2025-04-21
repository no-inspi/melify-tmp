import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MailsInteraction extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop()
  threadId: string;

  // Add the timestamps explicitly
  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}

export const MailsInteractionSchema =
  SchemaFactory.createForClass(MailsInteraction);
