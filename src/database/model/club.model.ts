import { model, Schema, Document } from 'mongoose';

export const DOCUMENT_NAME = 'Club';

export default interface Club extends Document {
  _id: any;
  userType?: string;
  inviteCode?: number;
  featured?: boolean;
  name: string;
  email: string;
  username?: string;
  type?: string;
  mobileNumber?: number;
  password?: string;
  typeOfPartner?: string,
  redirectURL?: string, 
  bio?: string,
  website?: string,
  clubAvatar?: string,
  clubBanner?: string,
  clubImages?: any,
  socialMediaLinks?: any,
  numOfTestsPublished?: number,
  emailVerificationCode?: number,
  emailVerificationCodeExpires?: number,
  isMobileVerified?: boolean,
  isEmailVerified?: boolean
}

const schema = new Schema({
  _id: Schema.Types.ObjectId,
  userType: { type: String, default: "Club" },
  inviteCode: { type: Number },
  featured: { type: Boolean, default: false },

  name: { type: String },
  username: { type: String },
  type: { type: String },
  email: { type: String },
  mobileNumber: { type: Number },
  password: { type: String },
  typeOfPartner: { type: String },
  redirectURL: { type: String },

  bio: { type: String, default: "Enter your bio" },
  website: { type: String },
  clubAvatar: {
    type: String,
    default:
      "https://drive.google.com/file/d/1oYcNwJC0bPRyFE72Z-1CFu3S30EbPWNg/view?usp=sharing",
  },
  clubBanner: {
    type: String,
    default:
      "https://drive.google.com/file/d/1mj7b1-CgB4VuFAVVd_NIP-pJxDvkUpRs/view?usp=sharing",
  },
  clubImages: [{ imageURL: { type: String } }],
  socialMediaLinks: [
    {
      socialMediaName: { type: String },
      socialMediaURL: { type: String },
    },
  ],

  numOfTestsPublished: { type: Number, default: 0 },

  emailVerificationCode: { type: Number },
  emailVerificationCodeExpires: { type: Number },
  isEmailVerified: { type: Boolean, default: false },

  mobileVerificationCode: { type: Number },
  mobileVerificationCodeExpires: { type: Number },
  isMobileVerified: { type: Boolean, default: false },
});

export const ClubModel = model<Club>(DOCUMENT_NAME, schema);
