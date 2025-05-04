import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Token extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Account' })
  accountId: Types.ObjectId;

  @Prop({ required: false })
  accessToken: string;

  @Prop({ required: false })
  refreshToken: string;

  @Prop({ required: false })
  historyId: string;

  @Prop({ required: false })
  scope: string;

  @Prop({ required: false })
  token_type: string;

  @Prop({ required: false })
  id_token: string;

  @Prop({ required: false })
  expiry_date: string;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
