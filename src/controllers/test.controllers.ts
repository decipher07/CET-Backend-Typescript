import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import Club, { ClubModel } from '../database/model/club.model'
import Question, { QuestionModel } from '../database/model/question.model'
import Student, { StudentModel } from '../database/model/student.model'
import Test, { TestModel } from '../database/model/test.model'
import Domain, { DomainModel } from '../database/model/testDomain.model'
import {errorLogger} from '../utils/logger'
require('dotenv').config()

// @desc Create a test
// @route POST /api/test/create
export const create = async (req: Request, res: Response, next: NextFunction) => {
  const {
    roundNumber,
    roundType,
    instructions,
    scheduledForDate,
    scheduledEndDate,
    clubId,
  } = req.body;

  if (
    !roundNumber ||
    !roundType ||
    !instructions ||
    !scheduledForDate ||
    !scheduledEndDate
  ) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  } // @ts-ignore
  if (clubId != req.user.userId) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  }
  // const clubId = req.user.userId;

  const test = new TestModel({
    _id: new Types.ObjectId(),
    clubId,
    roundNumber,
    roundType,
    instructions,
    scheduledForDate,
    scheduledEndDate,
  });

  await test
    .save()
    .then(async (result) => {
      res.status(201).json({
        message: "Test created",
        testDetails: result,
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

// @desc Get a test by ID
// @route GET /api/test/details?testId=
export const getTestDetails = async (req: Request, res: Response, next: NextFunction) => {
  const { testId } = req.query;

  if (!testId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }

  await TestModel.findById(testId)
    .then(async (test: Test) => {
      res.status(200).json({
        test,
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

// @desc Apply for a test
// @route GET /api/test/apply
export const apply = async (req: Request, res: Response, next: NextFunction) => {
  const { testId, clubId } = req.body;// @ts-ignore
  const studentId = req.user.userId;
  const appliedOn = Date.now();
  let flag = 0;

  if (!testId || !clubId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await TestModel.findById(testId)
    .then(async (test: Test) => {
      //Check if a user has already applied for the test
      // @ts-ignore
      for (i in test.users) {// @ts-ignore
        if (test.users[i].studentId == studentId) {
          flag = 1;
        }
      }

      if (flag === 1) {
        return res.status(420).json({
          message: "You have already applied for the test",
        });
      }

      //Check if a user has already given a test
      // @ts-ignore
      for (i in test.usersStarted) {// @ts-ignore
        if (test.usersStarted[i].studentId == studentId) {
          flag = 2;
        }
      }// @ts-ignore
      for (i in test.usersFinished) {// @ts-ignore
        if (test.usersFinished[i].studentId == studentId) {
          flag = 2;
        }
      }
      if (flag === 2) {
        return res.status(409).json({
          message: "You have already given the test",
        });
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

  await TestModel.updateOne(
    {
      _id: testId,
    },
    {
      $push: {// @ts-ignore
        users: {
          studentId,
        },
      },
    }
  )
    .then(async () => {
      await StudentModel.updateOne(
        {
          _id: studentId,
        },
        {
          $push: {
            tests: {
              testId,
              clubId,
              appliedOn,
              status: "Applied",
            },
          },
        }
      )
        .then(async () => {
          res.status(200).json({
            message: "Applied successfully",
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

// @desc Attempt a test
// @route GET /api/test/attempt
export const attempt = async (req: Request, res: Response, next: NextFunction) => {
  const { testId } = req.body;// @ts-ignore
  const studentId = req.user.userId;
  const now = Date.now();
  let flag = 0;
  let appliedFlag = 0;

  if (!testId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await TestModel.findById(testId)
    .populate("clubId", "name email type")
    .then(async (test: Test) => {
      //Check if user has already given the test
      // for (i in test.usersStarted) {
      //   if (test.usersStarted[i].studentId == studentId) {
      //     flag = 1;
      //   }
      // }
      // @ts-ignore
      for (i in test.usersFinished) {// @ts-ignore
        if (test.usersFinished[i].studentId == studentId) {
          flag = 1;
        }
      }
      if (flag === 1) {
        return res.status(409).json({
          message: "You have already given the test",
        });
      }

      //Check if a user didn't apply for a test
      // @ts-ignore
      for (i in test.users) {// @ts-ignore
        if (test.users[i].studentId == studentId) {
          appliedFlag = 1;
          break;
        }
      }

      if (appliedFlag === 0) {
        // return res.status(430).json({
        //   message: "You have not applied for the test",
        // });

        await TestModel.updateOne(
          {
            _id: testId,
          },
          {
            $push: {// @ts-ignore
              users: {
                studentId,
              },
            },
          }
        )
          .then(async () => {
            await StudentModel.updateOne(
              {
                _id: studentId,
              },
              {
                $push: {
                  tests: {
                    testId,
                    clubId: test.clubId,
                    appliedOn: now,
                    status: "Applied",
                  },
                },
              }
            )
              .then(async () => {
                // res.status(200).json({
                //   message: "Applied successfully",
                // });
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
      }

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

      await TestModel.updateOne(
        {
          _id: testId,
        },
        {
          $pull: {
            users: {
              studentId,
            },
          },
          $push: {
            usersStarted: {
              studentId,
            },
          },
        }
      )
        .then(async () => {
          await StudentModel.updateOne(
            {
              _id: studentId,
              "tests.testId": testId,
            },
            // { $set: { startedOn: now, status: "Started" } }
            {
              $set: {
                "tests.$.status": "Started",
                "tests.$.startedOn": now,
              },
              // $set: { startedOn: now },
            }
          )
            .then(async () => {
              await DomainModel.find({
                testId,
              })
                .select(
                  "-__v -usersStarted -usersFinished -shortlistedInDomain -selectedInDomain"
                )
                .then(async (domains) => {
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
                    domains,
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

// @desc Submit a test
// @route POST /api/test/submit
export const submit = async (req: Request, res: Response, next: NextFunction) => {
  const { testId } = req.body;// @ts-ignore
  const studentId = req.user.userId;
  const now = Date.now();

  if (!testId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await TestModel.updateOne(
    {
      _id: testId,
    },
    {
      $pull: {
        usersStarted: {
          studentId,
        },
      },
      $push: {// @ts-ignore
        usersFinished: {
          studentId,
          submittedOn: now,
        },
      },
    }
  )
    .then(async () => {
      await StudentModel.updateOne(
        {
          _id: studentId,
          "tests.testId": testId,
        },
        {
          $set: {
            "tests.$.status": "Submitted",
            "tests.$.submittedOn": now,
          },
        }
      )
        .then(async () => {
          res.status(200).json({
            message: "Submitted test successfully",
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

// @desc Get all applied tests
// @route GET /api/test/allApplied
// Not tested
export const allApplied = async (req: Request, res: Response , next: NextFunction) => {// @ts-ignore
  const studentId = req.user.userId;

  await StudentModel.findById(studentId)
    .then(async (student: Student) => {// @ts-ignore
      for (i in student.tests) { // @ts-ignore
        if (!student.tests[i].startedOn) { // @ts-ignore
          testsArr.push(student.tests[i]);
        }
      }

      res.status(200).json({ // @ts-ignore
        tests: testsArr,
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

// @desc Get all submitted tests
// @route GET /api/test/allSubmitted
// Not tested
export const allSubmitted = async (req: Request, res: Response, next: NextFunction) => {
  // @ts-ignore
  const studentId = req.user.userId;

  await StudentModel.findById(studentId)
    .then(async (student: Student) => { // @ts-ignore
      for (i in student.tests) {// @ts-ignore
        if (student.tests[i].startedOn && !student.tests[i].submittedOn) {// @ts-ignore
          testsArr.push(student.tests[i]);
        }
      }

      res.status(200).json({// @ts-ignore
        tests: testsArr,
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

// @desc Add students to a test and its subsequent domains
// @route POST /api/test/addStudents
export const addStudents = async (req: Request, res: Response, next: NextFunction) => {
  const { studentsArray, testId, clubId } = req.body;

  if (!studentsArray || !testId || !clubId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }
  const test = await TestModel.findById(testId);
  // @ts-ignore
  if (test.clubId != req.user.userId) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  } else {
    let studentsIdArray: Array <Student> = [];
    const appliedOn = Date.now();

    for (let studentEmail of studentsArray) {
      let student = await StudentModel.findOneAndUpdate(
        {
          email: studentEmail,
        },
        {
          $push: {
            tests: {
              testId,
              clubId,
              appliedOn,
              status: "Added/Promoted",
            },
          },
        }
      );
      if (student) {
        let object = {
          studentId: student.id,
          marks: 0,
          corrected: false, // @ts-ignore
          responses: [],
        };// @ts-ignore
        studentsIdArray = [...studentsIdArray, object];
      }
    }
    await TestModel.findOneAndUpdate(
      { _id: testId },// @ts-ignore
      { $addToSet: { users: studentsIdArray } }
    )
      .then((result) => {
        return res.status(200).json({
          message: "Student array added",
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

// Laptop
// Sleeping
// Summers

// @desc Publish a test
// @route PATCH /api/test/publish
export const publish = async (req: Request, res: Response, next: NextFunction) => {
  const { testId } = req.body;

  if (!testId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }
  const test = await TestModel.findById(testId);
  // @ts-ignore
  if (test.clubId != req.user.userId) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  }
  await TestModel.findOneAndUpdate({ _id: testId }, { published: true })
    .then(async (test: Test) => {
      await ClubModel.updateOne(
        { _id: test.clubId },
        { $inc: { numOfTestsPublished: 1 } }
      )
        .then(async () => {
          res.status(200).json({
            message: "Published succesfully",
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

// @desc Get all tests of a club -- admin only
// @route GET /api/test/allTestsOfAClub
export const getAllTestOfAClub = async (req: Request, res: Response, next: NextFunction) => {
  // const { clubId } = req.query;
  // @ts-ignore
  const clubId = req.user.userId;

  await TestModel.find({ clubId })
    .select("-usersFinished -usersStarted -users")
    .then(async (tests: Array<Test>) => {
      // if (tests[0].clubId != req.user.userId) {
      //   return res.status(403).json({
      //     message: "This is not your club!",
      //   });
      // }
      res.status(200).json({
        tests,
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
};

// @desc Get all published tests of a club
// @route PATCH /api/test/allPublishedTestsOfAClub
export const getAllPublishedTestsOfAClub = async (req: Request, res: Response, next: NextFunction) => {
  const { clubId } = req.query;

  if (!clubId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }
// @ts-ignore
  await TestModel.find({ clubId, published: true })// @ts-ignore
    .then(async (tests: Test) => {// @ts-ignore
      for (let i = 0; i < tests.length; i++) {// @ts-ignore
        if (Date.now() >= tests[i].scheduledEndDate) {// @ts-ignore
          tests.splice(i, 1);
        }
      }
      res.status(200).json({
        tests,
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
};

// @desc Update test details
// @route PATCH /api/test/details
export const updateTest = async (req: Request, res: Response, next: NextFunction) => {
  const {
    testId,
    roundNumber,
    roundType,
    instructions,
    scheduledForDate,
    scheduledEndDate,
    graded,
  } = req.body;

  await TestModel.findById(testId)
    .then(async (test: Test) => {// @ts-ignore
      if (test.clubId != req.user.userId) {
        return res.status(403).json({
          message: "This is not your club!",
        });
      }// @ts-ignore
      if (test.scheduledForDate <= Date.now()) {
        return res.status(409).json({
          message: "You can't update the test since it has already started",
        });
      } else {
        await TestModel.updateOne(
          { _id: testId },
          {
            $set: {
              roundNumber,
              roundType,
              instructions,
              scheduledForDate,
              scheduledEndDate,
              graded,
            },
          }
        )
          .then(async () => {
            res.status(200).json({
              message: "Test details updated",
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

// @desc Delete a test
// @route DELETE /api/test/delete
export const deleteTest = async (req: Request, res: Response, next: NextFunction) => {
  const { testId } = req.body;
  const test = await TestModel.findById(testId);
// @ts-ignore
  if (test.clubId != req.user.userId) {
    return res.status(403).json({
      message: "This is not your club!",
    });
  }
  await QuestionModel.deleteMany({ testId })
    .then(async () => {
      await DomainModel.deleteMany({ testId })
        .then(async () => {
          await StudentModel.updateMany(
            {},
            { $pull: { tests: { testId } } },
            { multi: true }
          )
            .then(async () => {
              await TestModel.deleteOne({ _id: testId })
                .then(async () => {
                  res.status(200).json({
                    message: "Test deleted successfully",
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
