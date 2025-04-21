import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Category } from '../interface/user.interface'; // Adjust the import path as necessary

@Schema({ timestamps: true })
export class ProfileType extends Document {
  @Prop({ required: false })
  jobName?: string;

  @Prop({ required: false })
  sector?: string;

  @Prop({ required: false })
  description?: string;

  @Prop({
    type: [
      {
        name: String,
        description: String,
        color: String,
        displayName: String,
        disable: Boolean,
      },
    ],
  })
  categories: Category[];
}

export const ProfileTypeSchema = SchemaFactory.createForClass(ProfileType);
