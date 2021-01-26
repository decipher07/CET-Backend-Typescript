import { model, Schema, Document } from 'mongoose';
import { usersStartedInterface, usersFinishedInterface } from './test.model'

export const DOCUMENT_NAME = 'Domain';

export interface selectionsInDomain {
  _id: boolean,
  studentId: Schema.Types.ObjectId,
  remark: String
}

export default interface Domain extends Document {
  _id: any;
  clubId?: Schema.Types.ObjectId;
  testId?: Schema.Types.ObjectId;
  domainName?: string;
  domainDescription?: string;
  domainInstructions?: string;
  domainFinalized?: boolean;
  domainDuration?: number;
  domainMarks?: number;
  usersStarted?: Array <usersStartedInterface>;
  usersFinished?: Array <usersFinishedInterface>;
  shortlistedInDomain?: Array <selectionsInDomain>;
  selectedInDomain?: Array <selectionsInDomain>;
}

const schema = new Schema ({
  _id: Schema.Types.ObjectId,
  testId: { type: Schema.Types.ObjectId, ref: "Test" },
  clubId: { type: Schema.Types.ObjectId, ref: "Club" },

  domainName: { type: String },
  domainDescription: { type: String },
  domainInstructions: { type: String },
  domainDuration: { type: Number },
  domainMarks: { type: Number, default: 0 },
  domainFinalized: { type: Boolean, default: false },

  usersStarted: [
    {
      studentId: { type: Schema.Types.ObjectId, ref: "Student" },
      marks: { type: Number, default: 0 },
      corrected: { type: Boolean, default: false },
      responses: [],
    },
  ],
  usersFinished: [
    {
      studentId: { type: Schema.Types.ObjectId, ref: "Student" },
      responses: [
        {
          questionId: { type: Schema.Types.ObjectId, ref: "Question" },
          answers: [],
          questionType: { type: String },
          questionMarks: { type: Number },
          corrected: { type: Boolean },
          scoredQuestionMarks: { type: Number },
        },
      ],
      marks: { type: Number, default: 0 },
      timeTaken: { type: Number },
      corrected: { type: Boolean },
      submittedOn: { type: Number },
    },
  ],
  shortlistedInDomain: [
    {
      _id: false,
      studentId: { type: Schema.Types.ObjectId, ref: "Student" },
      remark: { type: String },
    },
  ],
  selectedInDomain: [
    {
      _id: false,
      studentId: { type: Schema.Types.ObjectId, ref: "Student" },
      remarks: { type: String },
    },
  ],
});

export const DomainModel = model<Domain>(DOCUMENT_NAME, schema);