import { model, Schema, Document } from 'mongoose';

export const DOCUMENT_NAME = 'StudentForm';

export default interface StudentForm extends Document {
  _id: any;
  name?: string,
  email?: string,
  registrationNumber?: string,
  phoneNumber?: number,
}

const schema = new Schema({
  _id: Schema.Types.ObjectId,
  name: { type: String },
  email: { type: String },
  registrationNumber: { type: String },
  phoneNumber: { type: Number }, 
  // @ts-ignore
  __v: false,
});

export const StudentFormModel = model<StudentForm>(DOCUMENT_NAME, schema);