import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { ProfileType } from '../interface/user.interface';
import { Badge } from './badge.schema';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: false })
  password: string;

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

  async isValidPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook to hash passwords
UserSchema.pre<User>('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});
