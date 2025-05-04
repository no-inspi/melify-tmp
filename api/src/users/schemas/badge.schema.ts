import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Badge extends Document {
  @Prop({ required: true })
  metric: string;

  @Prop({ required: true })
  metricStep: number;

  @Prop({ required: true })
  toastMessage: string;

  @Prop({ required: true })
  badgeName: string;

  @Prop({ required: true })
  badgeDetails: string;

  @Prop({ required: true })
  icon: string;
}

export const BadgeSchema = SchemaFactory.createForClass(Badge);
