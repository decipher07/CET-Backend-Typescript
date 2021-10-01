import { model, Schema, Document, Types } from 'mongoose';

export const DOCUMENT_NAME = 'Test';

export interface responsesInGeneral {
  questionId?: Schema.Types.ObjectId,
  answers?: Array<any>,
  questionType?:  String ,
  questionMarks?: Number ,
  corrected?: boolean ,
  scoredQuestionMarks?: Number ,
}


export interface usersInterface {
  _id?: Boolean,
  studentId?: Schema.Types.ObjectId,
  marks?: Number,
  corrected?: Boolean,
  responses?: Array<string>,
}

export interface usersStartedInterface {
  studentId?: Schema.Types.ObjectId,
  marks?: Number,
  corrected?: Boolean,
  responses?: Array<any>,
}

export interface usersFinishedInterface {
  studentId: Schema.Types.ObjectId,
  responses: Array<responsesInGeneral>,
  marks?: Number,
  timeTaken?: Number ,
  corrected?:  Boolean ,
  submittedOn?: Number,
}

export default interface Test extends Document {
  _id: any;
  clubId: Types.ObjectId;
  roundType?: string;
  instructions?: string;
  graded?: boolean;
  finalized?: boolean;
  published?: boolean;
  roundNumber?: number;
  duration?: number;
  scheduledForDate: number;
  scheduledEndDate?: number;
  users?: Array<usersInterface>;
  usersStarted?: Array<usersStartedInterface>;
  usersFinished?: Array<usersFinishedInterface>;
}

const schema = new Schema({
  _id: Schema.Types.ObjectId,
  clubId: { type: Schema.Types.ObjectId, ref: "Club" },

  roundNumber: { type: Number },
  roundType: { type: String },
  instructions: { type: String },
  duration: { type: Number },
  scheduledForDate: { type: Number },
  scheduledEndDate: { type: Number },
  graded: { type: Boolean },

  finalized: { type: Boolean, default: false },
  published: { type: Boolean, default: false },

  users: [
    {
      _id: false,
      studentId: { type: Schema.Types.ObjectId, ref: "Student" },
      marks: { type: Number, default: 0 },
      corrected: { type: Boolean, default: false },
      responses: [],
    },
  ],
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
      responses: [],
      marks: { type: Number, default: 0 },
      timeTaken: { type: Number },
      corrected: { type: Boolean },
      submittedOn: { type: Number },
    },
  ],
});

export const TestModel = model<Test>(DOCUMENT_NAME, schema);