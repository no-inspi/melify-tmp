import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: false })
  name: string;

  @Prop()
  picture: string;

  @Prop({ required: false })
  from: string;

  @Prop({ type: Types.ObjectId, ref: 'ProfileType' })
  profileType: Types.ObjectId;

  @Prop({ required: false, default: true })
  isResumeBulleted: boolean;

  @Prop({ required: false })
  lastConnection: number;

  @Prop({ required: false })
  levelNumber: number;

  @Prop({ required: false })
  levelTitle: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Badge' }], required: false })
  badgesList: Types.ObjectId[]; // List of Badge references
}

export const UserSchema = SchemaFactory.createForClass(User);
