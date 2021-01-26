import {S3} from 'aws-sdk'
import multerS3 from 'multer-s3'
import multer, { Multer }  from 'multer'

const s3 = new S3 ({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_DEFAULT_REGION,
});

export const upload : Multer = multer ({
  limits: {
    fileSize: 1024 * 1024 * 100,
  },
  storage: multerS3({
    s3: s3,
    // @ts-ignore
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(
        null,
        "files_from_node/" + Date.now().toString() + "_" + file.originalname
      );
    },
  }),
});

export const uploadClubAvatar : Multer = multer({
  limits: {
    fileSize: 1024 * 1024 * 100,
  },
  storage: multerS3({
    s3: s3,    // @ts-ignore
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(
        null,
        "clubs/avatars/" + Date.now().toString() + "_" + file.originalname
      );
    },
  }),
});

export const uploadClubBanner : Multer = multer({
  limits: {
    fileSize: 1024 * 1024 * 100,
  },
  storage: multerS3({
    s3: s3, // @ts-ignore
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(
        null,
        "clubs/banners/" + Date.now().toString() + "_" + file.originalname
      );
    },
  }),
});


export const uploadClubImages = multer({
  limits: {
    fileSize: 1024 * 1024 * 100,
  },
  storage: multerS3({
    s3: s3, // @ts-ignore
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(
        null,
        "clubs/images/" + Date.now().toString() + "_" + file.originalname
      );
    },
  }),
});

export const uploadQuestionMedia = multer({
  limits: {
    fileSize: 1024 * 1024 * 100,
  },
  storage: multerS3({
    s3: s3, // @ts-ignore
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(
        null,
        "media/question/" + Date.now().toString() + "_" + file.originalname
      );
    },
  }),
});

export const uploadAnswerMedia = multer({
  limits: {
    fileSize: 1024 * 1024 * 100,
  },
  storage: multerS3({
    s3: s3, // @ts-ignore
    bucket: process.env.AWS_S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(
        null,
        "media/answer/" + Date.now().toString() + "_" + file.originalname
      );
    },
  }),
});
