import { model, Schema, Document } from 'mongoose';

export const DOCUMENT_NAME = 'Student';

interface domainsInter {
  _id?: boolean,
  domainId?: Schema.Types.ObjectId,
  status?: string 
}

interface testInter {
  testId?: Schema.Types.ObjectId,
  clubId?: Schema.Types.ObjectId ,
  status?: string ,
  appliedOn?: number,
  startedOn?: number,
  submittedOn?: number ,
  timeTaken?: number,
  corrected?: boolean,
  domains?: Array<domainsInter>
}

export default interface Student extends Document {
  _id: any;
  userType?: string;
  token?: string;
  googleId?: string;
  name?: string;
  registrationNumber?: string;
  email?: string;
  password?: string;
  bio?: string;
  branch?: string;
  mobileNumber?: number;
  loginCount?: number;
  forgotPasswordCode?: number;
  forgotPasswordCodeExpires?: number;
  tests?: Array<testInter>;
}

const schema = new Schema({
  _id: Schema.Types.ObjectId,
  userType: { type: String, default: "Student" },

  token: { type: String },
  googleId: { type: String },

  name: { type: String },
  registrationNumber: { type: String },
  email: { type: String },
  mobileNumber: { type: Number },
  password: { type: String },

  bio: { type: String },
  branch: { type: String },
  loginCount: { type: Number, default: 0 },

  // emailVerificationCode: { type: Number },
  // emailVerificationCodeExpires: { type: Number },
  // isEmailVerified: { type: Boolean, default: true },

  // mobileVerificationCode: { type: Number },
  // mobileVerificationCodeExpires: { type: Number },
  // isMobileVerified: { type: Boolean, default: false },

  forgotPasswordCode: { type: Number },
  forgotPasswordCodeExpires: { type: Number },

  tests: [
    {
      testId: { type: Schema.Types.ObjectId, ref: "Test" },
      clubId: { type: Schema.Types.ObjectId, ref: "Club" },
      domains: [
        {
          _id: false,
          domainId: { type: Schema.Types.ObjectId, ref: "Domain" },
          status: { type: String },
        },
      ],
      status: { type: String },
      appliedOn: { type: Number },
      startedOn: { type: Number },
      submittedOn: { type: Number },
      timeTaken: { type: Number },
      corrected: { type: Boolean },
    },
  ],
});
