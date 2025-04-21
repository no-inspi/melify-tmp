import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Thread extends Document {
  @Prop()
  threadId: string;

  @Prop()
  summary: string;

  @Prop()
  category: string;

  @Prop()
  generatedCategory: string;

  @Prop()
  userCategory: string;

  @Prop()
  initialCategory: string;

  @Prop()
  statusInput: string;
}

export const ThreadSchema = SchemaFactory.createForClass(Thread);
