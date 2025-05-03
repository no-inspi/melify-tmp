// accounts.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Accounts extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Token', required: true })
  tokenId: Types.ObjectId;

  @Prop({ required: true, unique: true }) // Make email unique
  email: string;

  @Prop({ required: false })
  lastConnection: number;

  @Prop({ default: false }) // Add this to track primary account
  isPrimary: boolean;
}

export const AccountsSchema = SchemaFactory.createForClass(Accounts);

// Add compound index to ensure one account per email per user
AccountsSchema.index({ userId: 1, email: 1 }, { unique: true });
