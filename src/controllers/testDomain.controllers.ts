import { NextFunction, Request, Response } from 'express'
import { hash, compare } from 'bcrypt'
import { sign, verify } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { SES } from 'aws-sdk'
import Club, { ClubModel } from '../database/model/club.model'
import Question, { QuestionModel } from '../database/model/question.model'
import Student, { StudentModel } from '../database/model/student.model'
import StudentForm ,{StudentFormModel} from '../database/model/student.form.model'
import Test, { TestModel } from '../database/model/test.model'
import Domain, { DomainModel } from '../database/model/testDomain.model'
import  {   sendVerificationOTP,sendWelcomeMail, shortlistedMgmt, shortlistedCC, shortlistedFrontend, shortlistedApp,
  shortlistedBackend, shortlistedML, shortlistedCloud, shortlistedCCD3, shortlistedEditorialD3,
  shortlistedDesignD3, shortlistedMgmtD3, // @ts-ignore
  shortlistedEasterEgg, }  from '../utils/emailTemplates'
import {errorLogger} from '../utils/logger'
require('dotenv').config()

// @desc Add a domain to a test
// @route POST /api/test/domain/add
export const addDomain = async (req: Request, res: Response, next: NextFunction) => {
  const {
    testId,
    domainName,
    domainDescription,
    domainInstructions,
    domainDuration,
  } = req.body;

  if (!testId || !domainName || !domainDuration) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  let flag = 0;

  await TestModel.findById(testId)
    .then(async (test: Test) => { // @ts-ignore
      if (test.clubId != req.user.userId) {
        flag = 1;
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

  if (flag == 1) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  }
  // @ts-ignore
  let clubId = req.user.userId;
  const domain = new DomainModel({
    _id: new Types.ObjectId(),
    testId,
    clubId,
    domainName,
    domainDescription,
    domainInstructions,
    domainDuration,
  });

  await domain
    .save()
    .then(async (result: Domain) => {
      res.status(201).json({
        message: "Domain successfully added",
        domainInfo: result,
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

// @desc Get all domains of a test
// @route GET /api/test/domain/all
export const getAllDomainsOfATest = async (req: Request, res: Response, next: NextFunction) => {
  const { testId } = req.query;

  if (!testId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }

  // @ts-ignore
  await DomainModel.find({ testId })
    .select("-__v")
    .then(async (domains: Array<Domain>) => {
      res.status(200).json({
        domains,
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

// @desc Get details of a domain
// @route GET /api/test/domain/details
export const getDetailsOfDomain = async (req: Request, res: Response, next: NextFunction) => {
  const { domainId } = req.query;

  if (!domainId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }

  await DomainModel.findById(domainId)
    .populate(
      "clubId testId",
      "-usersFinished -usersStarted -users -emailVerificationCode -emailVerificationCodeExpires -password "
    )
    .select(
      "-usersStarted -usersFinished -shortlistedInDomain -selectedInDomain"
    )
    .then(async (domain: Domain) => {
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

// @desc Finalize a domain
// @route PATCH /api/test/domain/finalize
export const finalizeDomain = async (req: Request, res: Response, next: NextFunction) => {
  const { domainId } = req.body;

  if (!domainId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }
  // @ts-ignore
  const domain: Domain = await DomainModel.findById(domainId);// @ts-ignore
  if (domain.clubId != req.user.userId) {
    return res.status(402).json({
      message: "This is not your club!",
    });
  }
  await DomainModel.updateOne({ _id: domainId }, { published: true })
    .then(async () => {
      res.status(200).json({
        message: "Domain published successfully",
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

// @desc Attempt a domain
// @route POST /api/test/domain/attempt
export const attemptDomain = async (req: Request, res: Response, next: NextFunction) => {
  const { testId, domainId } = req.body;// @ts-ignore
  const studentId = req.user.userId;
  const now = Date.now();
  let startCount = 0;
  let submitCount = 0;
  let flag = 0;
  let questionsArr : Array <Question> = [];

  if (!testId || !domainId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await TestModel.findById(testId)
    .populate("clubId", "name email type")
    .then(async (test: Test) => {
      //Check if test hasn't started
      // @ts-ignore
      if (test.scheduledForDate > now) {
        return res.status(418).json({
          message: "Test hasn't started yet",
        });
      }

      //Check if test is over
      // @ts-ignore
      if (test.scheduledEndDate <= now) {
        return res.status(420).json({
          message: "Test is over",
        });
      }

      await DomainModel.findById(domainId)
        .then(async (domain: Domain) => {
          //Check if the student has already attempted this domain
          // @ts-ignore
          for (i in domain.usersStarted) {// @ts-ignore
            if (domain.usersStarted[i].studentId == studentId) {
              startCount += 1;
            }
          }
// @ts-ignore
          for (i in domain.usersFinished) {// @ts-ignore
            if (domain.usersFinished[i].studentId == studentId) {
              submitCount += 1;
            }
          }
          if (startCount >= 1 || submitCount >= 1) {
            return res.status(409).json({
              message: "You have already attempted this domain",
            });
          }

          await DomainModel.updateOne(
            { _id: domainId },
            { $push: { usersStarted: { studentId } } }
          )
            .then(async () => {
              await StudentModel.updateOne(
                { _id: studentId, "tests.testId": testId },
                {
                  $push: { "tests.$.domains": { domainId, status: "Started" } },
                }
              )
                .then(async () => {
                  await QuestionModel.find({ testId, domainId })
                    .then(async (questions: Array <Question>) => {// @ts-ignore
                      for (let question of questions) { 
                        let obj = {};// @ts-ignore
                        obj.questionId = question._id;// @ts-ignore
                        obj.questionType = question.type;// @ts-ignore
                        obj.questionMarks = question.questionMarks;// @ts-ignore
                        obj.description = question.description;// @ts-ignore
                        if (question.media.type) {// @ts-ignore
                          obj.media = question.media;// @ts-ignore
                          obj.mediaURL = question.mediaURL;// @ts-ignore
                        }// @ts-ignore
                        if (question.options.length >= 1) {// @ts-ignore
                          obj.options = [];// @ts-ignore
// @ts-ignore
                          for (let option of question.options) {
                            let optionObj = {};// @ts-ignore
                            optionObj.optionId = option._id;// @ts-ignore
                            optionObj.text = option.option.text;// @ts-ignore
                            obj.options.push(optionObj);// @ts-ignore
                          }
                        }
                          // @ts-ignore
                        questionsArr.push(obj);
                      }
                      res.status(200).json({
                        clubDetails: test.clubId,
                        testDetails: {
                          _id: test._id,
                          roundNumber: test.roundNumber,
                          roundType: test.roundType,
                          instructions: test.instructions,
                          scheduledForDate: test.scheduledForDate,
                          scheduledEndDate: test.scheduledEndDate,
                          graded: test.graded,
                        },
                        domainDetails: {
                          _id: domain._id,
                          domainName: domain.domainName,
                          domainDescription: domain.domainDescription,
                          domainInstructions: domain.domainInstructions,
                          domainDuration: domain.domainDuration,
                          domainMarks: domain.domainMarks,
                        },
                        questions: questionsArr,
                      });
                    })
                    .catch((err) => {
                      console.log(err.toString());

                      errorLogger.info(
                        `System: ${req.ip} | ${req.method} | ${
                        req.originalUrl
                        } >> ${err.toString()}`
                      );

                      res.status(500).json({
                        message: "Something went wrong",
                        error: err.toString(),
                      });
                    });
                })
                .catch((err) => {
                  console.log(err.toString());

                  errorLogger.info(
                    `System: ${req.ip} | ${req.method} | ${
                    req.originalUrl
                    } >> ${err.toString()}`
                  );
                  res.status(500).json({
                    message: "Something went wrong",
                    error: err.toString(),
                  });
                });
            })
            .catch((err) => {
              console.log(err.toString());

              errorLogger.info(
                `System: ${req.ip} | ${req.method} | ${
                req.originalUrl
                } >> ${err.toString()}`
              );
              res.status(500).json({
                message: "Something went wrong",
                error: err.toString(),
              });
            });
        })

        .catch((err) => {
          console.log(err.toString());

          errorLogger.info(
            `System: ${req.ip} | ${req.method} | ${
            req.originalUrl
            } >> ${err.toString()}`
          );
          res.status(500).json({
            message: "Something went wrong",
            error: err.toString(),
          });
        });
    })
    .catch((err) => {
      console.log(err.toString());

      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${
        req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Submit answers for a domain
// @route POST /api/test/domain/submit
export const submitDomain = async (req: Request, res: Response, next: NextFunction) => {
  const { submissions, domainId, testId, clubId, timeTaken } = req.body;// @ts-ignore
  const studentId = req.user.userId;

  if (!submissions || !domainId || !timeTaken) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  let studentAnswers = [];
  let answerObj = {};
  var score = 0;
  var now = Date.now();
  var corrected = false;
  var autoCorrectCount = 0;
  let submitCount = 0;

  await DomainModel.findById(domainId)
    .then(async (domain: Domain) => {
      //Check if the student has already attempted this domain
      // @ts-ignore
      for (i in domain.usersFinished) {// @ts-ignore
        if (domain.usersFinished[i].studentId == studentId) {
          submitCount++;
          break;
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

  if (submitCount >= 1) {
    return res.status(409).json({
      message: "You have already attempted this domain",
    });
  }
  // @ts-ignore
  for (i = 0; i < submissions.length; i++) {
    answerObj = {};// @ts-ignore
    let response = submissions[i]; //currentQuestionDetails
    let question = await QuestionModel.findById(response.questionId);
// @ts-ignore
    if (question.type == "singleCorrect") {// @ts-ignore
      let numOptions = question.options.length;
      let correctAnswer;
      let scoredQuestionMarks = 0;

      for (let j = 0; j < numOptions; j++) {// @ts-ignore
        if (question.options[j].option.isCorrect) {// @ts-ignore
          correctAnswer = question.options[j]._id.toString();
        }
      }
// @ts-ignore
      if (response.answers[0] == correctAnswer) {// @ts-ignore
        score += question.questionMarks;// @ts-ignore
        scoredQuestionMarks = question.questionMarks;
      }
      // @ts-ignore
      answerObj.questionId = question._id;// @ts-ignore
      answerObj.questionType = question.type;// @ts-ignore
      answerObj.correctAnswer = correctAnswer;// @ts-ignore
      answerObj.questionMarks = question.questionMarks;// @ts-ignore
      answerObj.answers = response.answers;// @ts-ignore
      answerObj.scoredQuestionMarks = scoredQuestionMarks;// @ts-ignore
      answerObj.corrected = true;

      studentAnswers.push(answerObj);// @ts-ignore
    } else if (question.type == "multipleCorrect") {// @ts-ignore
      let numOptions = question.options.length;
      let correctAnswersArr = [];
      let scoredQuestionMarks = 0;

      for (let j = 0; j < numOptions; j++) {// @ts-ignore
        if (question.options[j].option.isCorrect) {// @ts-ignore
          correctAnswersArr.push(question.options[j]._id.toString());
        }
      }

      let correct = true;
      if (response.answers.length === correctAnswersArr.length) {
        for (let j = 0; j < response.answers.length; j++) {
          if (!correctAnswersArr.includes(response.answers[j])) {
            correct = false;
          }
        }
      } else {
        correct = false;
      }

      if (correct) {// @ts-ignore
        score += question.questionMarks;// @ts-ignore
        scoredQuestionMarks = question.questionMarks;
      }
      // @ts-ignore
      answerObj.questionId = question._id;// @ts-ignore
      answerObj.questionType = question.type;// @ts-ignore
      answerObj.correctAnswer = correctAnswersArr;// @ts-ignore
      answerObj.questionMarks = question.questionMarks;// @ts-ignore
      answerObj.answers = response.answers;// @ts-ignore
      answerObj.scoredQuestionMarks = scoredQuestionMarks;// @ts-ignore
      answerObj.corrected = true;// @ts-ignore

      studentAnswers.push(answerObj);
    } else {
      //now the question type is shortAnswer or longAnswer
// @ts-ignore
      answerObj.questionId = question._id;// @ts-ignore
      answerObj.questionType = question.type;// @ts-ignore
      answerObj.questionMarks = question.questionMarks;// @ts-ignore
      answerObj.answers = response.answers;// @ts-ignore
      answerObj.scoredQuestionMarks = 0;// @ts-ignore
      answerObj.corrected = false;// @ts-ignore

      studentAnswers.push(answerObj);
    }
  }
// @ts-ignore
  for (i = 0; i < submissions.length; i++) {// @ts-ignore
    let response = submissions[i]; //currentQuestionDetails
    // @ts-ignore
    let question = await QuestionModel.findById(response.questionId);

    if (// @ts-ignore
      question.type == "singleCorrect" ||// @ts-ignore
      question.type == "multipleCorrect"
    ) {
      autoCorrectCount += 1;
    }
  }

  if (autoCorrectCount == submissions.length) {
    corrected = true;
  }

  await DomainModel.updateOne(
    { _id: domainId },
    {
      $pull: { usersStarted: { studentId } },
      $push: {
        usersFinished: {
          studentId,
          responses: studentAnswers,
          marks: score,
          timeTaken,
          corrected,
          submittedOn: now,
        },
      },
    }
  )
    .then(async () => {
      await StudentModel.updateOne(
        { _id: studentId, "tests.testId": testId },
        {
          $push: { "tests.$.domains": { domainId, status: "Submitted" } },
        }
      )

        /// TODO - then catch
        .then(async () => {
          res.status(200).json({
            message: "Domain submitted",
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

// @desc Get all submissions of a domain
// @route GET /api/test/domain/allSubmissions
export const getAllSubmissionsOfADomain = async (req: Request, res: Response, next: NextFunction) => {
  const { domainId } = req.query;

  if (!domainId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }
  if (!Types.ObjectId.isValid(domainId as string)) return res.status(401);

  await DomainModel.findById(domainId)
    // .populate(
    //   "clubId testId",
    //   "name email type roundNumber roundType instructions scheduledForDate scheduledEndDate graded"
    // )
    .populate({
      path: "clubId testId usersFinished shortlistedInDomain",
      select:
        "name email type roundNumber roundType instructions scheduledForDate scheduledEndDate graded responses",
      populate: {
        path: "studentId responses",
        select:
          "name email mobileNumber timeTaken submittedOn answers questionType questionMarks corrected scoredQuestionMarks",
        populate: { path: "questionId", select: "description options" },
      },
    })
    .then(async (domain: Domain) => {// @ts-ignore
      if (domain.clubId._id != req.user.userId) {
        return res.status(403).json({
          message: "This is not your club!",
        });
      }
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
        usersFinished: domain.usersFinished,
        shortlistedInDomain: domain.shortlistedInDomain,
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
        error: err.toString(),
      });
    });
};

// @desc Get a student's submission of a domain
// @route GET /api/test/domain/studentSubmission
export const getStudentDomainSubmission = async (req: Request, res: Response, next: NextFunction) => {
  const { domainId, studentId } = req.query;

  if (!domainId || !studentId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  let submission: Array <any> = [];
  await DomainModel.findOne({ _id: domainId })
    .populate({
      path: "clubId testId usersFinished",
      select:
        "name email type roundNumber roundType instructions scheduledForDate scheduledEndDate graded responses",
      populate: {
        path: "studentId responses",
        select: "name email mobileNumber timeTaken submittedOn",
        populate: { path: "questionId", select: "description options" },
      },
    })
    .then(async (domain: Domain) => {// @ts-ignore
      if (domain.clubId._id != req.user.userId) {
        return res.status(403).json({
          message: "This is not your club!",
        });
      }// @ts-ignore
      for (i in domain.usersFinished) {// @ts-ignore
        if (domain.usersFinished[i].studentId._id.equals(studentId)) {// @ts-ignore
          submission = domain.usersFinished[i].responses;
        }
      }
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
        submission,
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

// @desc Shortlist students in a domain
// @route PATCH /api/test/domain/shortlist
export const shortlistStudent = async (req: Request, res: Response, next: NextFunction) => {
  const { domainId, studentId, remark } = req.body;
  let flag = 0;
  let clubFlag = 0;

  await DomainModel.findById(domainId)
    .then(async (domain: Domain) => {// @ts-ignore
      if (domain.clubId != req.user.userId) {
        clubFlag = 1;
      }// @ts-ignore
      for (student of domain.shortlistedInDomain) {// @ts-ignore
        if (student.studentId.equals(studentId)) {// @ts-ignore
          student.remark = remark;
          await domain.save();
          flag = 1;
          break;
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

  if (clubFlag == 0) {
    if (flag == 0) {
      console.log("f");
      await DomainModel.updateOne(
        { _id: domainId },// @ts-ignore
        { $push: { shortlistedInDomain: { studentId, remark } } }
      )
        .then(async () => {
          res.status(200).json({
            message: "Shortlisted",
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
    } else {
      res.status(200).json({
        message: "Shortlisted",
      });
    }
  } else {
    return res.status(403).json({
      message: "This is not your club!",
    });
  }
};

// @desc Delete a shortlisted student
// @route PATCH /api/test/domain/shortlist/removeStudent
export const removeShortlistedStudent = async (req: Request, res: Response, next: NextFunction) => {
  const { domainId, studentId } = req.body;
  const domain = await DomainModel.findById(domainId);// @ts-ignore
  if (domain.clubId != req.user.userId) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  }
  await DomainModel.updateOne(
    { _id: domainId },
    { $pull: { shortlistedInDomain: { studentId } } }
  )
    .then(async () => {
      res.status(200).json({
        message: "Removed",
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
// @desc Publish shortlisted results
// @route GET /api/test/domain/shortlist/publish
export const publishShortlisted = async (req: Request, res: Response, next: NextFunction) => {
  const { domainId, testId } = req.body;
  const domain  = await DomainModel.findById(domainId);// @ts-ignore
  if (domain.clubId != req.user.userId) {
    return res.status(402).json({
      message: "This is not your club!",
    });
  }
  if (!domain) {
    res.status(500).json({
      message: "Something went wrong",
      error: Error.toString(),
    });
  }// @ts-ignore
  const totalStudents = domain.usersFinished;// @ts-ignore
  const shortlistStudents = domain.shortlistedInDomain;// @ts-ignore
  const totalStudentsId : Array <any> = [];
  const shortlistedStudentId : Array <any> = []; // @ts-ignore
  for (let student of totalStudents) {// @ts-ignore
    totalStudentsId = [...totalStudentsId, student.studentId];
  }// @ts-ignore
  for (let student of shortlistStudents) {// @ts-ignore
    shortlistedStudentId = [...shortlistedStudentId, student.studentId];
  }
  const notShortlistedStudentsId = totalStudentsId.filter(
    (n) => !shortlistedStudentId.includes(n)
  );
  ///////////////////////////////////////////////////////SEND EMAILS///////////////////////////////////////
  // @ts-ignore
  for (let studentId of shortlistedStudentId) {
    await StudentModel.updateOne(
      { _id: studentId, "tests.testId": testId },
      {
        $push: { "tests.$.domains": { domainId, status: "Shortlisted" } },
      }
    );
  }// @ts-ignore
  for (let studentId of notShortlistedStudentsId) {
    await StudentModel.updateOne(
      { _id: studentId, "tests.testId": testId },
      {
        $push: { "tests.$.domains": { domainId, status: "Not Shortlisted" } },
      }
    );
  }

  res.status(200).json({
    message: "Done",
  });
};

// @desc Update domain details
// @route PATCH /api/test/domain/details
export const updateDomainDetails = async (req: Request, res: Response, next: NextFunction) => {
  const {
    testId,
    domainId,
    domainName,
    domainDescription,
    domainInstructions,
    domainDuration,
  } = req.body;
  const domain  = await DomainModel.findById(domainId);
// @ts-ignore
  if (domain.clubId != req.user.userId) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  }
  await TestModel.findById(testId)
    .then(async (test: Test) => {
      // if (test.scheduledForDate <= Date.now()) {
      //   return res.status(409).json({
      //     message: "You can't update the domain since it has already started",
      //   });
      // } else {
      await DomainModel.updateOne(
        { _id: domainId },
        {
          $set: {
            domainName,
            domainDescription,
            domainInstructions,
            domainDuration,
          },
        }
      )
        .then(async () => {
          res.status(200).json({
            message: "Domain details updated",
          });
        })
        .catch((err) => {
          errorLogger.info(
            `System: ${req.ip} | ${req.method} | ${
            req.originalUrl
            } >> ${err.toString()}`
          );

          return res.status(500).json({
            message: "Something went wrong",
            // error: err.toString(),
          });
        });
      // }
    })
    .catch((err) => {
      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${
        req.originalUrl
        } >> ${err.toString()}`
      );

      return res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Delete a domain
// @route DELETE /api/test/domain/delete
export const deleteDomain = async (req: Request, res: Response, next: NextFunction) => {
  const { testId, domainId } = req.body;
  const domain = await DomainModel.findById(domainId);
// @ts-ignore
  if (domain.clubId != req.user.userId) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  } else {
    await QuestionModel.deleteMany({ domainId })
      .then(async () => {
        await StudentModel.updateOne(
          // {},
          // {
          //   $pull: { "tests.$[].domains": { domainId } },
          // },
          {},
          { $pull: { "tests.$[].domains": { domainId } } },
          { multi: true }
        )
          .then(async () => {
            await DomainModel.deleteOne({ _id: domainId })
              .then(async () => {
                res.status(200).json({
                  message: "Domain deleted successfully",
                });
              })
              .catch((err) => {
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
          })
          .catch((err) => {
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
      })
      .catch((err) => {
        errorLogger.info(
          `System: ${req.ip} | ${req.method} | ${
          req.originalUrl
          } >> ${err.toString()}`
        );

        return res.status(500).json({
          message: "Something went wrong",
          // error: err.toString(),
        });
      });
  }
};