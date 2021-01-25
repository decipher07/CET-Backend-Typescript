import { model, Schema, Document } from 'mongoose';

export const DOCUMENT_NAME = 'Question';

interface typeinter {
  type ?: string, 
  enum ?: ["image", "video", "audio"]
}

interface optionalAddeds {
    option: {
      text?: string ,
      isCorrect?: boolean
    }
}

export default interface Question extends Document {
  _id: any;
  testId: any;
  clubId: any;
  domainId: any;
  type?: string;
  questionMarks?: number;
  description?: string;
  media?: {mimetype?: string, url?: string, ext?: string, type?: typeinter};
  mediaURL?: string;
  options?: Array<optionalAddeds>;
}

const schema = new Schema ({
  _id: Schema.Types.ObjectId,
  testId: { type: Schema.Types.ObjectId, ref: "Test" },
  clubId: { type: Schema.Types.ObjectId, ref: "Club" },
  domainId: { type: Schema.Types.ObjectId, ref: "Domain" },

  type: { type: String },
  questionMarks: { type: Number },

  description: { type: String },
  media: {
    mimetype: { type: String },
    type: { type: String, enum: ["image", "video", "audio"] },
    url: { type: String },
    ext: { type: String },
  },
  mediaURL: { type: String },
  options: [
    {
      option: {
        text: { type: String },
        isCorrect: { type: Boolean, default: false },
      },
    },
  ],
});

export const QuestionModel = model<Question>(DOCUMENT_NAME, schema);