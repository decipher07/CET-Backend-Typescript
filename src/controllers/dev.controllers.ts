import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import { SES } from 'aws-sdk'
import Club, { ClubModel } from '../database/model/club.model'
import Student, { StudentModel } from '../database/model/student.model'
import Test, { TestModel } from '../database/model/test.model'
import Domain, { DomainModel } from '../database/model/testDomain.model'
import  {   sendVerificationOTP,sendWelcomeMail, shortlistedMgmt, shortlistedCC, shortlistedFrontend, shortlistedApp,
  shortlistedBackend, shortlistedML, shortlistedCloud, shortlistedCCD3, shortlistedEditorialD3,
  shortlistedDesignD3, shortlistedMgmtD3, // @ts-ignore
  shortlistedEasterEgg, }  from '../utils/emailTemplates'
import {errorLogger} from '../utils/logger'
require('dotenv').config()

export const getAllClubs = async (req: Request, res: Response, next: NextFunction) => {
  await ClubModel.find()
    .select("-password")
    .then(async (clubs) => {
      res.status(200).json({
        clubs,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err.toString,
      });
    });
};

export const getAllFeaturedClubs = async (req: Request, res: Response) => {
  await ClubModel.find({
    featured: true,
  })
    .select(
      "name email type bio featured website username clubAvatar clubBanner clubImages socialMediaLinks mobileNumber typeOfPartner redirectURL numOfTestsPublished"
    )
    .then(async (clubs: Array<Club>) => {
      let megaResult = clubs.filter((club) => club.typeOfPartner == "Mega");
      let nanoResult = clubs.filter((club) => club.typeOfPartner == "Nano");
      let microResult = clubs.filter((club) => club.typeOfPartner == "Micro");
      let gigaResult = clubs.filter((club) => club.typeOfPartner == "Giga");
      let typeSortedClubs = gigaResult.concat(
        megaResult,
        microResult,
        nanoResult
      );

      res.status(200).json({
        clubs: typeSortedClubs,
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

export const getAllTestsOfAClub = async (req: Request, res: Response) => {
  const { clubId } = req.query;
  // @ts-ignore
  await TestModel.find({ clubId })
    .populate("clubId", "name email")
    .then(async (tests) => {
      res.status(200).json({
        tests,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err.toString,
      });
    });
};

export const getAllPublishedTestsOfAClub = async (req: Request, res: Response, next: NextFunction) => {
  const { clubId } = req.query;

  if (!clubId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }
  // @ts-ignore
  await TestModel.find({ clubId, published: true })
    .then(async (tests) => {
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

export const getAllDomainsOfATest = async (req: Request, res: Response, next: NextFunction) => {
  const { testId } = req.query;
  // @ts-ignore
  await DomainModel.find({ testId })
    .then(async (domains) => {
      res.status(200).json({
        domains,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err.toString,
      });
    });
};

export const getDomainByID = async (req: Request, res: Response) => {
  const { domainId } = req.query;

  await DomainModel.findById(domainId)
    .then(async (domain: Domain) => {
      res.status(200).json(domain);
    })
    .catch((err) => {
      res.status(500).json({
        error: err.toString,
      });
    });
};

export const clearEntriesFromDomainByStudentID = async (req: Request, res: Response) => {
  const { domainId, studentsArr, testId } = req.body;

  // @ts-ignore
  for (studentId of studentsArr) {
    // console.log(studentId);
    await TestModel.updateOne(
      { _id: testId },
      { // @ts-ignore
        $pull: { usersFinished: { studentId } },// @ts-ignore
        $pull: { usersStarted: { studentId } },
      }
    )
      .then(async () => {
        await DomainModel.updateOne(
          { testId },
          {
            // $pull: { usersFinished: { studentId } },
            // @ts-ignore
            $pull: { usersStarted: { studentId } },
          }
        )
          .then(async (sdasd) => {
            // console.log(sdasd);
            await StudentModel.updateOne(// @ts-ignore
              { _id: studentId },
              {
                $pull: { tests: { testId } },
              }
            )
              .then((msg) => {
                // console.log(msg);
              })
              .catch((err) => {
                res.status(500).json({
                  error: err.toString(),
                });
              });
          })
          .catch((err) => {
            res.status(500).json({
              error: err.toString,
            });
          });
      })
      .catch((err) => {
        res.status(500).json({
          error: err.toString,
        });
      });
  }
  res.status(200).json({ message: "Done" });
};

export const studentTestDashboard = async (req: Request, res: Response, next: NextFunction) => {
  const { studentId } = req.body;

  await StudentModel.findById(studentId)
    .select(
      "-password -isEmailVerified -isMobileVerified -emailVerificationCode -emailVerificationCodeExpires -__v"
    )
    .populate({
      path: "tests",
      populate: {
        path: "testId clubId domains",
        select:
          "roundNumber roundType instructions scheduledForDate scheduledEndDate graded bio email name type clubAvatar clubBanner clubImages socialMediaLinks redirectURL",
        populate: {
          path: "domainId",
          select:
            "domainName domainDescription domainInstructions domainDuration status",
        },
      },
    })
    .then(async (student: Student) => {
      res.status(200).json({
        studentDetails: {
          _id: student._id,
          name: student.name,
          email: student.email,
          mobileNumber: student.mobileNumber,
          bio: student.bio,
          branch: student.branch,
          registrationNumber: student.registrationNumber,
        },
        tests: student.tests,
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

export const getDetailsOfMultipleStudents = async (req: Request, res: Response) => {
  const { studentsArr } = req.body;
  let studentsFinalArray: Array<Student> = []; // @ts-ignore
  for (studentId of studentsArr) {// @ts-ignore
    await StudentModel.findById(studentId)
      .select("name email mobileNumber")
      .then(async (student: Student) => {
        studentsFinalArray.push(student);
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
  console.log(studentsFinalArray.length);
  res.status(200).json({
    studentsFinalArray,
  });
};

export const sendShortlistEmail = async (req: Request, res: Response) => {
  const { emails } = req.body;

  const SES_CONFIG = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "ap-south-1",
  };

  const AWS_SES = new SES(SES_CONFIG);
  // @ts-ignore
  for (email of emails) {
    // console.log(student.studentId.email);
    let params = {
      Source: "contact@codechefvit.com",
      Destination: {// @ts-ignore
        ToAddresses: [email],
      },
      ReplyToAddresses: [],
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: shortlistedEasterEgg(),
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `Shortlisted for Round 2 - CodeChef-VIT Recruitments`,
        },
      },
    };

    // AWS_SES.sendEmail(params)
    //   .promise()
    //   .then(() => {
    //     console.log(`Mail sent:  ${params.Destination.ToAddresses}`);
    //     // return true;
    //   })
    //   .catch(() => {
    //     console.log(`Mail not sent:  ${params.Destination.ToAddresses}`);
    //     // return false;: Test 
    //   });
  }
  res.status(200).json({ message: "Done" });
};

export const sendWelcomeEmail = async (req: Request, res: Response) => {
  const { emailArray } = req.body;

  const SES_CONFIG = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "ap-south-1",
  };

  const AWS_SES = new SES(SES_CONFIG);

  let params = {
    Source: "contact@codechefvit.com",
    Destination: {
      ToAddresses: emailArray,
    },
    ReplyToAddresses: [],
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: sendWelcomeMail(),
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: `Common Entry Test - Email Whitelisted`,
      },
    },
  };

  AWS_SES.sendEmail(params)
    .promise()
    .then(() => {
      res.status(200).json({ message: "Emails Sent" });
    })
    .catch(() => {
      res.status(500).json({ message: "Something went wrong" });
    });
};

export const whitelistEmails = async (req: Request, res: Response) => {
  const { clubsArray } = req.body;
  // @ts-ignore
  for (club of clubsArray) {// @ts-ignore
    await ClubModel.find({ email: club.email })
      .then(async (clubs: Array<Club>) => {
        if (clubs.length >= 1) {
          console.log("Club already exists: ", clubs[0].email);
        } else {
          let newClub = new ClubModel({
            _id: new Types.ObjectId(),// @ts-ignore
            email: club.email,// @ts-ignore
            typeOfPartner: club.typeOfPartner,
          });
          await newClub
            .save()
            .then((result) => {
              console.log("Club created successfully: ", result.email);

              let params = {
                Source: "contact@codechefvit.com",
                Destination: {// @ts-ignore
                  ToAddresses: [club.email],
                },
                ReplyToAddresses: [],
                Message: {
                  Body: {
                    Html: {
                      Charset: "UTF-8",
                      Data: sendWelcomeMail(),
                    },
                  },
                  Subject: {
                    Charset: "UTF-8",
                    Data: `Common Entry Test - Email Whitelisted`,
                  },
                },
              };
              
              const SES_CONFIG = {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: "ap-south-1",
              };
            
              const AWS_SES = new SES(SES_CONFIG);
              
              AWS_SES.sendEmail(params)
                .promise()
                .then(() => {
                  console.log(
                    "Email sent to: ",
                    params.Destination.ToAddresses[0]
                  );
                })
                .catch((err) => {
                  console.log(err.toString());
                });
            })
            .catch((err) => {
              console.log(err.toString());
            });
        }
      })
      .catch((err) => {
        console.log(err.toString());
      });
  }
  res.status(200).json({
    message: "Done",
  });
};

export const getAllSubmissionsOfDomain = async (req: Request, res: Response) => {
  const { domainId } = req.query;

  await DomainModel.findById(domainId)
    .populate({
      path: "clubId testId usersFinished shortlisedInDomain",
      select:
        "name email type roundNumber roundType instructions scheduledForDate scheduledEndDate graded responses",
      populate: {
        path: "studentId responses",
        select:
          "name email mobileNumber timeTaken submittedOn answers questionType questionMarks corrected scoredQuestionMarks",
        populate: { path: "questionId", select: "description options" },
      },
    })
    .then(async (domain: Domain) => {
      res.status(200).json(domain);
    })
    .catch((err) => {
      res.status(500).json({
        error: err.toString,
      });
    });
};

export const getNumSubmissionOfAllDomains = async (req: Request, res: Response) => {
  const { testId } = req.query;
  // @ts-ignore
  await DomainModel.find({ testId })
    // .populate({
    //   path: "usersFinished testId",
    //   select: "responses",
    //   populate: {
    //     path: "studentId responses",
    //     select:
    //       "name email mobileNumber timeTaken submittedOn answers questionType questionMarks corrected scoredQuestionMarks",
    //     populate: { path: "questionId", select: "description options" },
    //   },
    // })
    .populate("testId", "roundType")
    .then(async (domains: Array <Domain>) => {
      // console.log(domains);
      // console.log(domains);
      // @ts-ignore
      console.log(domains[0].testId.roundType);// @ts-ignore
      for (i in domains) {// @ts-ignore
        console.log(domains[i].domainName, domains[i].usersFinished.length);
      }

      // for (domain of domains) {
      //   jsonexport(domain.usersFinished, async function (err, csv) {
      //     if (err) return console.error(err);
      //     // console.log(csv);
      //     await fs.writeFileSync(`${domain.domainName}.csv`, csv);
      //   });
      // }
      // for (i in domains) {
      //   if (i == 0) {
      //     console.log("domains[0].usersFinished");
      //     jsonexport(domains[0].usersFinished, function (err, csv) {
      //       if (err) return console.error(err);
      //       // console.log(csv);
      //       fs.writeFileSync(`${domains[0].name}.csv`, csv);
      //     });
      //   }
      // }
      res.status(200).json({
        message: "Done",
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err.toString(),
      });
    });
};

export const getNumSubmissionOfAllDomainsofMultipleTests = async (req: Request, res: Response) => {
  const { testIdArr } = req.body;
  let studentIdsArr: Array <any> = [];
  let uniqueArr: Array<any> = [];
  console.log("-----------------------------");// @ts-ignore
  for (testId of testIdArr) {// @ts-ignore
    await DomainModel.find({ testId })
      .populate("testId", "roundType")
      .then(async (domains: Array<Domain>) => {// @ts-ignore
        console.log(domains[0].testId.roundType);// @ts-ignore
        for (i in domains) {// @ts-ignore
          console.log(domains[i].domainName, domains[i].usersFinished.length);// @ts-ignore
          for (j in domains[i].usersFinished) {// @ts-ignore
            studentIdsArr.push(domains[i].usersFinished[j].studentId);
          }
        }
        console.log("-----------------------------");
        uniqueArr = [...new Set(studentIdsArr)];
      })
      .catch((err) => {
        res.status(500).json({
          error: err.toString(),
        });
      });
  }
  res.status(200).json({
    message: "Done",
    studentIdsArr,
    uniqueArr,
  });
};

export const removeUsersFinished = async (req: Request, res: Response, next: NextFunction) => {
  const { domainId, studentId } = req.body;
  await DomainModel.updateOne(
    { _id: domainId },
    {
      $pull: { usersFinished: { studentId } },// @ts-ignore
      $pull: { usersStarted: { studentId } },
    }
  )
    .then((result) => {
      console.log(result);
      return res.status(200).json({ message: "done" });
    })
    .catch((err) => {
      return res.status(500).json({
        err: err.toString(),
      });
    });
};

export const findUserByEmail = async (req: Request, res: Response, next: NextFunction) => {
  const student = await StudentModel.findOne({ email: req.body.email });
  if (!student) {
    return res.status(404).json({
      message: "Student not found",
    });
  } else {
    return res.status(200).json({ student });
  }
};

export const getTotalUsersStarted = async (req: Request, res: Response) => {
  const { testIdArr } = req.body;
  let studentIdsArr : Array <any> = [];
  let uniqueArr: Array<any> = [];
  
  console.log("-----------------------------");// @ts-ignore
  for (testId of testIdArr) {// @ts-ignore
    await DomainModel.find({ testId })
      .populate("testId", "roundType")
      .then(async (domains: Array <Domain>) => {// @ts-ignore
        console.log(domains[0].testId.roundType);// @ts-ignore
        for (i in domains) {// @ts-ignore
          console.log(domains[i].domainName, domains[i].usersStarted.length);// @ts-ignore
          for (j in domains[i].usersStarted) {// @ts-ignore
            studentIdsArr.push(domains[i].usersStarted[j].studentId);// @ts-ignore
          }
        }
        console.log("-----------------------------");
        uniqueArr = [...new Set(studentIdsArr)];
      })
      .catch((err) => {
        // res.status(500).json({
        //   error: err.toString(),
        // });
        console.log(err.toString);
      });
  }
  res.status(200).json({
    message: "Done",
    studentIdsArr,
    uniqueArr,
  });
};

export const getShortlistedStudentsOfADomain = async (req: Request, res: Response) => {
  const { domainId } = req.query;

  await DomainModel.findById(domainId)
    .populate(
      "shortlisedInDomain.studentId testId",
      "name registrationNumber email mobileNumber roundType"
    )
    // .populate({
    //   path: ""
    // })
    .then(async (domain: Domain) => {
      // console.log(domain.testId);
      res.status(200).json({// @ts-ignore
        testName: domain.testId.roundType,
        domainName: domain.domainName,// @ts-ignore
        shortlistedInDomain: domain.shortlisedInDomain,
      });
    })
    .catch((err) => {
      res.status(500).json({
        error: err.toString(),
      });
    });
};

export const getAllShortlistedStudentsOfClub = async (req: Request, res: Response) => {
  const { clubId } = req.query;

  let studentArr : Array <Student>= [];
  // @ts-ignore
  await TestModel.find({ clubId })
    .then(async (tests: Array <Test>) => {// @ts-ignore
      for (test of tests) {// @ts-ignore
        await DomainModel.find({ testId: test._id })
          .populate(
            "shortlisedInDomain.studentId testId",
            "name registrationNumber email mobileNumber roundType"
          )
          .then(async (domains: Array <Domain> ) => {
            for (let domain of domains) {
              // if (domain.shortlisedInDomain) {
              // console.log("adasd");
              // @ts-ignore
              for (let student of domain.shortlisedInDomain) {
                // console.log(student);
                // console.log(domain.shortlisedInDomain);
                let studentObj = {};// @ts-ignore
                studentObj.studentId = student.studentId._id;// @ts-ignore
                studentObj.name = student.studentId.name;// @ts-ignore
                studentObj.email = student.studentId.email;// @ts-ignore
                studentObj.registrationNumber =// @ts-ignore
                student.studentId.registrationNumber;// @ts-ignore
                studentObj.mobileNumber = student.studentId.mobileNumber;// @ts-ignore
                studentObj.domainName = domain.domainName;// @ts-ignore
                studentObj.testName = domain.testId.roundType;// @ts-ignore
                studentObj.testRemark = student.remark;// @ts-ignore

                // console.log(studentObj);
                studentArr.push(studentObj);
              }
              // }
            }
            // console.log(domain);
          })
          .catch((err) => {
            console.log(err.toString());
            // res.status(500).json({
            //   error: err.toString(),
            // });
          });
      }
      res.status(200).json(studentArr);
    })
    .catch((err) => {
      res.status(500).json({
        error: err.toString(),
      });
    });
};

export const getShortlistedStudentsMultipleDomains = async (req: Request, res: Response) => {
  const { domainIdsArr } = req.body;
  let studentArr: Array <Student> = [];
  for (let domain of domainIdsArr) {
    // console.log(domain);

    await DomainModel.findById(domain)
      .populate(
        "shortlisedInDomain.studentId testId",
        "name registrationNumber email mobileNumber roundType"
      )
      .then(async (domain: Domain) => {
        // console.log(domain);
        // for (let domain of domains) {
        // @ts-ignore
        for (let student of domain?.shortlisedInDomain) {
          let studentObj = {};// @ts-ignore
          studentObj.studentId = student?.studentId?._id;// @ts-ignore
          studentObj.name = student?.studentId?.name;// @ts-ignore
          studentObj.email = student?.studentId?.email;// @ts-ignore
          studentObj.registrationNumber = student?.studentId?.registrationNumber;// @ts-ignore
          studentObj.mobileNumber = student.studentId?.mobileNumber;// @ts-ignore
          studentObj.domainName = domain?.domainName;// @ts-ignore
          studentObj.testName = domain.testId?.roundType;// @ts-ignore
          studentObj.testRemark = student?.remark;// @ts-ignore

          studentArr.push(studentObj);
        }
        // }
      })
      .catch((err) => {
        console.log(err.toString());
        // res.status(500).json({
        //   error: err.toString(),
        // });
      });
  }
  res.status(200).json(studentArr);
};