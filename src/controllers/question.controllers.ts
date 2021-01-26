import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import { sign } from 'jsonwebtoken'
import { hash, compare } from 'bcrypt'
import * as sgMail from '@sendgrid/mail'
import { createTransport } from 'nodemailer'
import { SES } from 'aws-sdk'
import Club, { ClubModel } from '../database/model/club.model'
import Student, { StudentModel } from '../database/model/student.model'
import Test, { TestModel } from '../database/model/test.model'
import Question, { QuestionModel } from '../database/model/question.model'
import Domain, {DomainModel} from '../database/model/testDomain.model'
// @ts-ignore
import  { sendVerificationOTP, sendWelcomeMail }  from '../utils/emailTemplates'
import {errorLogger} from '../utils/logger'
import { UserRequest } from '../types/app-request'

// @desc Add a question to a test
// @route GET /api/question/add
export const addQuestion = async (req: Request, res: Response, next: NextFunction) => {
  let {
    testId,
    domainId,
    type,
    questionMarks,
    description,
    options,
  } = req.body;

  let domain : Domain ; // @ts-ignore
  domain = await DomainModel.findById(domainId);// @ts-ignore
  if (domain.clubId != req.user.userId) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  }
  if (options) {
    options = JSON.parse(options);
  }
  if (!questionMarks) {
    questionMarks = 0;
  }// @ts-ignore
  const clubId = req.user.userId;

  console.log(req.body, req.file);

  if (!req.file) {
    const question = new QuestionModel({
      _id: new Types.ObjectId(),
      testId,
      clubId,
      domainId,
      type,
      questionMarks,
      description,
      options,
    });

    await question
      .save()
      .then(async () => {
        res.status(201).json({
          message: "Question added",
        });
      })
      .catch((err) => {
        errorLogger.info(
          `System: ${req.ip} | ${req.method} | ${
            req.originalUrl
          } >> ${err.toString()}`
        );
        res.status(500).json({
          message: "Something went wrong",
          // error: err.toString(),
        });
      });
  } else {// @ts-ignore
    const url = req.file.location;
    const mimetype = req.file.mimetype;
    const mediaType = mimetype.split("/")[0];
    const ext = mimetype.split("/")[1];

    const question = new QuestionModel({
      _id: new Types.ObjectId(),
      testId,
      clubId,
      domainId,
      type,
      questionMarks,
      description,
      options,
      media: {
        url,
        mimetype,
        type: mediaType,
        ext,
      },
      mediaURL: url,
    });

    await question
      .save()
      .then(async () => {
        res.status(201).json({
          message: "Question added",
          file: req.file,
        });
      })
      .catch((err) => {
        errorLogger.info(
          `System: ${req.ip} | ${req.method} | ${
            req.originalUrl
          } >> ${err.toString()}`
        );

        res.status(400).json({
          message: "Invalid media type",
          // error: err.toString(),
        });
      });
  }
};

// @desc Add multiple questions to a test
// @route GET /api/question/addMultiple
export const addMultipleQuestions = async (req: Request, res: Response, next: NextFunction) => {
  const { testId, domainId, questions } = req.body;

  if (!testId || !domainId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }
  // @ts-ignore
  const domain : Domain = await DomainModel.findById(domainId);
  // @ts-ignore
  if (domain.clubId != req.user.userId) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  }
  //find domain => make domainMarks+=marks

  await QuestionModel.insertMany(questions)
    .then(async (result: Question) => {
      await QuestionModel.find({ testId, domainId })
        .then(async (ques: Array<Question> ) => {
          let marks = 0;// @ts-ignore
          for (question of ques) {// @ts-ignore
            marks += question.questionMarks;
          }
          await DomainModel.updateOne({ _id: domainId }, { domainMarks: marks })
            .then(async () => {
              res.status(200).json({
                message: "Questions added",
                result,
              });
            })
            .catch((err) => {
              errorLogger.info(
                `System: ${req.ip} | ${req.method} | ${
                  req.originalUrl
                } >> ${err.toString()}`
              );
              res.status(500).json({
                message: "Something went wrong",
                // error: err.toString(),
              });
            });
        })
        .catch((err) => {
          errorLogger.info(
            `System: ${req.ip} | ${req.method} | ${
              req.originalUrl
            } >> ${err.toString()}`
          );
          res.status(500).json({
            message: "Something went wrong",
            // error: err.toString(),
          });
        });
    })
    .catch((err) => {
      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${
          req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Get all questions of a domain of a test -- accessible only to club
// @route GET /api/question/all
export const getAllQuestions = async (req: Request, res: Response, next: NextFunction) => {
  const { testId, domainId } = req.query;

  if (!testId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }
  await DomainModel.findById(domainId)
    .populate(
      "clubId testId",
      "name email type roundNumber roundType instructions scheduledForDate scheduledEndDate graded"
    )
    .then(async (domain: Domain) => {// @ts-ignore
      if (domain.clubId._id != req.user.userId) {
        return res.status(403).json({
          message: "This is not your club!",
        });
      }
      await QuestionModel.find({ testId, domainId })
        .then(async (questions: Array <Question> ) => {
          res.status(200).json({
            clubDetails: domain.clubId,
            testDetails: domain.testId,
            domainDetails: {
              _id: domain._id,
              domainName: domain.domainName,
              domainDescription: domain.domainDescription,
              domainInstructions: domain.domainInstructions,
              domainDuration: domain.domainDuration,
              domainMarks: domain.domainMarks,
            },
            questions,
          });
        })
        .catch((err) => {
          errorLogger.info(
            `System: ${req.ip} | ${req.method} | ${
              req.originalUrl
            } >> ${err.toString()}`
          );
          res.status(500).json({
            message: "Something went wrong",
            // error: err.toString(),
          });
        });
    })
    .catch((err) => {
      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${
          req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Add marks for a question for a student
// @route POST /api/test/domain/question/marks
export const updateMarks = async (req: Request, res: Response, next: NextFunction) => {
  const { studentId, questionId, marks, domainId } = req.body;

  let domain = await DomainModel.findOne({ _id: domainId });

  if (!domain) {
    return res.status(418).json({
      message: "Invalid parameters",
    });
  }
// @ts-ignore
  if (domain.clubId != req.user.userId) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  }

  await DomainModel.updateOne(
    { _id: domainId },
    {
      $set: { "usersFinished.$[i].responses.$[j].scoredQuestionMarks": marks },
    },
    {
      arrayFilters: [
        { "i.studentId": studentId },
        { "j.questionId": questionId },
      ],
    }
  )
    .then(() => {
      return res.status(200).json({
        message: "Updated",
      });
    })
    .catch((err) => {
      console.log(err);
      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${
          req.originalUrl
        } >> ${err.toString()}`
      );
      return res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Delete a question
// @route DELETE /api/test/domain/question/delete
export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  const { questionId, testId } = req.body;

  await TestModel.findById(testId)
    .then(async (test: Test) => {// @ts-ignore
      if (test.clubId != req.user.userId) {
        return res.status(403).json({
          message: "This is not your club!",
        });
      } else {// @ts-ignore
        if (test.scheduledForDate <= Date.now()) {
          return res.status(409).json({
            message:
              "You can't delete the question since the test has already started",
          });
        } else {
          await QuestionModel.deleteOne({ _id: questionId })
            .then(async () => {
              res.status(200).json({
                message: "Question successfully deleted",
              });
            })
            .catch((err) => {
              errorLogger.info(
                `System: ${req.ip} | ${req.method} | ${
                  req.originalUrl
                } >> ${err.toString()}`
              );
              res.status(500).json({
                message: "Something went wrong",
                // error: err.toString(),
              });
            });
        }
      }
    })
    .catch((err) => {
      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${
          req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

