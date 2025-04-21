import { Document } from 'mongoose';

export interface Category {
  name: string;
  description: string;
  color: string;
  displayName: string;
  disable: boolean;
}

export interface ProfileType extends Document {
  jobName?: string;
  sector?: string;
  categories: Category[];
}
