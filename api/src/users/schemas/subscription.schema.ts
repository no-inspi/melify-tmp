import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: false })
  historyId: string;

  @Prop({ required: false })
  expiration: number;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
