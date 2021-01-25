import { model, Schema, Document } from 'mongoose';

export const DOCUMENT_NAME = 'EasterEggForm';

export default interface EasterEgg extends Document {
  _id: any;
  email?: string;
  name?: string;
  registrationNumber?: string;
  phoneNumber?: number;
  otp?: number;
  _v?: boolean;
}

const schema = new Schema ({
  _id: Schema.Types.ObjectId,
  name: { type: String },
  email: { type: String },
  registrationNumber: { type: String },
  phoneNumber: { type: Number },
  otp: { type: Number },
   // @ts-ignore
  __v: false,
});

export const EasterEggFormModel = model<EasterEgg>(DOCUMENT_NAME, schema);