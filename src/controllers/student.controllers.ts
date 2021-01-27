import { NextFunction, Request, Response } from 'express'
import { hash, compare } from 'bcrypt'
import { sign, verify } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { SES } from 'aws-sdk'
import Student, { StudentModel } from '../database/model/student.model' // @ts-ignore
import  { sendVerificationOTP,sendWelcomeMail, shortlistedMgmt, shortlistedCC, shortlistedFrontend, shortlistedApp }  from '../utils/emailTemplates'
import {errorLogger} from '../utils/logger'
require('dotenv').config()

// @desc Student signup
// @route POST /api/student/signup
export const signup = async (req: Request, res: Response) => {
  const { name, email, password, mobileNumber } = req.body;

  if (!name || !email || !password || !mobileNumber) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await StudentModel.find({ email })
    .then(async (students: Array<Student>) => {
      if (students.length >= 1) {
        return res.status(409).json({
          message: "Email already registered",
        });
      }

      await hash(password, 10)
            .then(async (hash) => {
              const emailVerificationCode = Math.floor(
            100000 + Math.random() * 900000
          );

          const emailVerificationCodeExpires =
            new Date().getTime() + 20 * 60 * 1000;

          const student = new StudentModel({
            _id: new Types.ObjectId(),
            name,
            email,
            password: hash,
            mobileNumber,
            emailVerificationCode,
            emailVerificationCodeExpires,
          });

          await student
            .save()
            .then(async (result) => {
              const emailSent = sendSesOtp(email, emailVerificationCode);
              // let transporter = nodemailer.createTransport({
              //   service: "gmail",
              //   port: 465,

              //   auth: {
              //     user: process.env.NODEMAILER_EMAIL,
              //     pass: process.env.NODEMAILER_PASSWORD,
              //   },
              // });

              // let mailOptions = {
              //   subject: `Common Entry Test - Email Verification`,
              //   to: email,
              //   from: `CodeChef-VIT <${process.env.NODEMAILER_EMAIL}>`,
              //   html: sendVerificationOTP(emailVerificationCode),
              // };

              // transporter.sendMail(mailOptions, (error, response) => {
              //   if (error) {
              //     errorLogger.info(
              //       `System: ${req.ip} | ${req.method} | ${req.originalUrl
              //       } >> ${error.toString()} >> "Email not sent: ${mailOptions.to
              //       }`
              //     );
              //     return res.status(500).json({
              //       message: "Something went wrong",
              //       error: error.toString(),
              //     });
              //   } else {
              //     console.log("Email sent: ", mailOptions.to);
              //     res.status(201).json({
              //       message: "Signup successful",
              //     });
              //   }
              // });

              // const msg = {
              //   to: email,
              //   from: {
              //     email: process.env.SENDGRID_EMAIL,
              //     name: "CodeChef-VIT",
              //   },
              //   subject: `Common Entry Test - Email Verification`,
              //   text: `Use the following code to verify your email: ${emailVerificationCode}`,
              //   // html: EmailTemplates.tracker(
              //   //   users[i].name,
              //   //   companyArr[k].companyName,
              //   //   status
              //   // ),
              // };

              // await sgMail
              //   .send(msg)
              //   .then(async () => {
              res.status(201).json({
                message: "Signup successful",
              });
              //   })
              //   .catch((err) => {
              //     res.status(500).json({
              //       message: "Something went wrong",
              //       error: err.toString(),
              //     });
              //   });
            })
            .catch((err) => {
              errorLogger.info(
                `System: ${req.ip} | ${req.method} | ${req.originalUrl
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
            `System: ${req.ip} | ${req.method} | ${req.originalUrl
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
        `System: ${req.ip} | ${req.method} | ${req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Resend email verification OTP for students
// @route POST /api/student/email/resendOTP
export const resendOTP = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await StudentModel.findOne({ email })
    .then(async (student: Student) => {
      if (!student) {
        return res.status(404).json({
          message: "Invalid Email",
        });
      }

      student.emailVerificationCode = Math.floor(
        100000 + Math.random() * 900000
      );
      student.emailVerificationCodeExpires =
        new Date().getTime() + 20 * 60 * 1000;

      await student
        .save()
        .then(async () => {// @ts-ignore
          const emailSent = sendSesOtp(email, student.emailVerificationCode);
          // let transporter = nodemailer.createTransport({
          //   service: "gmail",
          //   port: 465,

          //   auth: {
          //     user: process.env.NODEMAILER_EMAIL,
          //     pass: process.env.NODEMAILER_PASSWORD,
          //   },
          // });

          // let mailOptions = {
          //   subject: `Common Entry Test - Email Verification`,
          //   to: email,
          //   from: `CodeChef-VIT <${process.env.NODEMAILER_EMAIL}>`,
          //   html: sendVerificationOTP(student.emailVerificationCode),
          // };

          // transporter.sendMail(mailOptions, (error, response) => {
          //   if (error) {
          //     errorLogger.info(
          //       `System: ${req.ip} | ${req.method} | ${req.originalUrl
          //       } >> ${error.toString()} >> "Email not sent: ${mailOptions.to}`
          //     );

          //     return res.status(500).json({
          //       message: "Something went wrong",
          //       error: error.toString(),
          //     });
          //   } else {
          //     console.log("Email sent: ", mailOptions.to);
          //     res.status(201).json({
          //       message: "Signup successful",
          //     });
          //   }
          // });
          // const msg = {
          //   to: email,
          //   from: {
          //     email: process.env.SENDGRID_EMAIL,
          //     name: "CodeChef-VIT",
          //   },
          //   subject: `Common Entry Test - Email Verification`,
          //   text: `Use the following code to verify your email: ${student.emailVerificationCode}`,
          //   // html: EmailTemplates.tracker(
          //   //   users[i].name,
          //   //   companyArr[k].companyName,
          //   //   status
          //   // ),
          // };
          // await sgMail
          //   .send(msg)
          //   .then(async () => {
          //     res.status(200).json({
          //       message: "Email verification OTP Sent",
          //     });
          //   })
          //   .catch((err) => {
          //     res.status(500).json({
          //       message: "Something went wrong",
          //       error: err.toString(),
          //     });
          //   });

          res.status(200).json({
            message: "Email verification OTP Sent",
          });
        })
        .catch((err) => {
          errorLogger.info(
            `System: ${req.ip} | ${req.method} | ${req.originalUrl
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
        `System: ${req.ip} | ${req.method} | ${req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Email verfication for students
// @route POST /api/student/email/verify
export const verifyEmail = async (req: Request, res: Response) => {
  const { email, emailVerificationCode } = req.body;
  const now = Date.now();

  if (!email || !emailVerificationCode) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await StudentModel.findOne({ email })
    .then(async (student: Student) => {
      if (student) {
        if (student.emailVerificationCode == emailVerificationCode) { // @ts-ignore
          if (student.emailVerificationCodeExpires > now) {
            await StudentModel.updateOne(
              { _id: student._id },
              { isEmailVerified: true }
            )
              .then(async () => {
                res.status(200).json({
                  message: "Email successfully verified",
                });
              })
              .catch((err) => {
                errorLogger.info(
                  `System: ${req.ip} | ${req.method} | ${req.originalUrl
                  } >> ${err.toString()}`
                );
                res.status(500).json({
                  message: "Something went wrong",
                  // error: err.toString(),
                });
              });
          } else {
            return res.status(401).json({
              message: "Verification code expired",
            });
          }
        } else {
          return res.status(403).json({
            message: "Invalid verification code",
          });
        }
      } else {
        return res.status(404).json({
          message: "Invalid email",
        });
      }
    })
    .catch((err) => {
      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Student login
// @route POST /api/student/login
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await StudentModel.find({ email })
    .then(async (student: Array <Student>) => {
      if (student.length < 1) {
        return res.status(401).json({
          message: "Auth failed: Email not found",
        });
      }

      // if (!student[0].isEmailVerified) {
      //   return res.status(403).json({
      //     message: "Email not verified",
      //   });
      // }
      await compare(password, student[0].password as string )
        .then((result) => {
          if (result) {
            const token = sign(
              {
                userId: student[0]._id,
                userType: student[0].userType,
                email: student[0].email,
                name: student[0].name,
              },// @ts-ignore
              process.env.JWT_SECRET,
              {
                expiresIn: "30d",
              }
            );
            return res.status(200).json({
              studentDetails: {
                _id: student[0]._id,
                name: student[0].name,
                email: student[0].email,
              },
              token,
            });
          }
          return res.status(401).json({
            message: "Auth failed: Invalid password",
          });
        })
        .catch((err) => {
          errorLogger.info(
            `System: ${req.ip} | ${req.method} | ${req.originalUrl
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
        `System: ${req.ip} | ${req.method} | ${req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Forgot password - Send OTP
// @route POST /api/student/forgotPassword/sendEmail
export const sendForgotPasswordEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  await StudentModel.findOne({ email })
    .then(async (student: Student) => {
      if (!student) {
        return res.status(404).json({
          message: "Invalid Email",
        });
      }

      student.forgotPasswordCode = Math.floor(100000 + Math.random() * 900000);
      student.forgotPasswordCodeExpires = new Date().getTime() + 20 * 60 * 1000;

      await student
        .save()
        .then(async () => {
          const emailSent = sendSesForgotPassword(
            email,// @ts-ignore
            student.forgotPasswordCode
          );
          // let transporter = nodemailer.createTransport({
          //   service: "gmail",
          //   port: 465,

          //   auth: {
          //     user: process.env.NODEMAILER_EMAIL,
          //     pass: process.env.NODEMAILER_PASSWORD,
          //   },
          // });

          // let mailOptions = {
          //   subject: `Common Entry Test - Forgot Password`,
          //   to: email,
          //   from: `CodeChef-VIT <${process.env.NODEMAILER_EMAIL}>`,
          //   html: sendForgotPasswordMail(student.forgotPasswordCode),
          // };

          // transporter.sendMail(mailOptions, (error, response) => {
          //   if (error) {
          //     errorLogger.info(
          //       `System: ${req.ip} | ${req.method} | ${req.originalUrl
          //       } >> ${error.toString()} >> "Email not sent: ${mailOptions.to}`
          //     );
          //     return res.status(500).json({
          //       message: "Something went wrong",
          //       // error: error.toString(),
          //     });
          //   } else {
          //     res.status(200).json({
          //       message: "Forgot password email sent",
          //     });
          //   }
          // });
          // const msg = {
          //   to: email,
          //   from: {
          //     email: process.env.SENDGRID_EMAIL,
          //     name: "CodeChef-VIT",
          //   },
          //   subject: `Common Entry Test - Forgot Password`,
          //   text: `Use the following code to reset your password: ${student.forgotPasswordCode}`,
          //   // html: EmailTemplates.tracker(
          //   //   users[i].name,
          //   //   companyArr[k].companyName,
          //   //   status
          //   // ),
          // };
          // await sgMail
          //   .send(msg)
          //   .then(async () => {
          res.status(200).json({
            message: "Forgot password code sent",
          });
          //   })
          //   .catch((err) => {
          //     res.status(500).json({
          //       message: "Something went wrong",
          //       error: err.toString(),
          //     });
          //   });
        })
        .catch((err) => {
          errorLogger.info(
            `System: ${req.ip} | ${req.method} | ${req.originalUrl
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
        `System: ${req.ip} | ${req.method} | ${req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Forgot password - Verify OTP
// @route POST /api/student/forgotPassword/verifyOTP
export const resetPassword = async (req: Request, res: Response) => {
  const { email, forgotPasswordCode, newPassword } = req.body;

  if (!email || !forgotPasswordCode || !newPassword) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  const now = Date.now();

  await StudentModel.findOne({ email })
    .then(async (student: Student) => {
      if (student) {
        if (student.forgotPasswordCode == forgotPasswordCode) {// @ts-ignore
          if (student.forgotPasswordCodeExpires > now) {
            await hash(newPassword, 10)
              .then(async (hash) => {
                await StudentModel.updateOne(
                  { _id: student._id },
                  { password: hash }
                )
                  .then(async () => {
                    res.status(200).json({
                      message: "Password reset successfully",
                    });
                  })
                  .catch((err) => {
                    errorLogger.info(
                      `System: ${req.ip} | ${req.method} | ${req.originalUrl
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
                  `System: ${req.ip} | ${req.method} | ${req.originalUrl
                  } >> ${err.toString()}`
                );
                res.status(500).json({
                  message: "Something went wrong",
                  // error: err.toString(),
                });
              });
          } else {
            return res.status(401).json({
              message: "Verification code expired",
            });
          }
        } else {
          return res.status(403).json({
            message: "Invalid verification code",
          });
        }
      } else {
        return res.status(404).json({
          message: "Invalid email",
        });
      }
    })
    .catch((err) => {
      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Update student's profile
// @route PATCH /api/student/profile
export const updateProfile = async (req: Request, res: Response , next: NextFunction ) => {
  const { name, registrationNumber, bio, branch, mobileNumber } = req.body;// @ts-ignore
  const studentId = req.user.userId;

  await StudentModel.updateOne(
    { _id: studentId },
    { $set: { name, registrationNumber, bio, branch, mobileNumber } }
  )
    .then(async () => {
      res.status(200).json({
        message: "Updated",
      });
    })
    .catch((err) => {
      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Get student's profile
// @route GET /api/student/profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {// @ts-ignore
  const studentId = req.user.userId;

  await StudentModel.findById(studentId)
    .select("name email mobileNumber registrationNumber bio branch")
    .then(async (student: Student) => {
      res.status(200).json({
        student,
      });
    })
    .catch((err) => {
      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Get student's profile details --for everyone
// @route GET /api/student/details
export const getStudentDetails = async (req: Request, res: Response, next: NextFunction ) => {
  const { studentId } = req.query;

  if (!studentId) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.query",
    });
  }

  await StudentModel.findById(studentId)
    .select("name email mobileNumber registrationNumber bio branch")
    .then(async (student: Student) => {
      res.status(200).json({
        student,
      });
    })
    .catch((err) => {
      errorLogger.info(
        `System: ${req.ip} | ${req.method} | ${req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

// @desc Get student's dashboard
// @route GET /api/student/dashboard
export const dashboard = async (req: Request, res: Response, next: NextFunction) => {// @ts-ignore
  const studentId = req.user.userId;

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
        `System: ${req.ip} | ${req.method} | ${req.originalUrl
        } >> ${err.toString()}`
      );
      res.status(500).json({
        message: "Something went wrong",
        // error: err.toString(),
      });
    });
};

export const sendSesOtp = (mailto: string, code: number) => {
  const SES_CONFIG = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "ap-south-1",
  };

  const AWS_SES = new SES(SES_CONFIG);
  let params = {
    Source: "contact@codechefvit.com",
    Destination: {
      ToAddresses: [mailto],
    },
    ReplyToAddresses: [],
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",// @ts-ignore
          Data: sendVerificationOTP(code),
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: `Hello,!`,
      },
    },
  };

  AWS_SES.sendEmail(params)
    .promise()
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
};

const sendSesForgotPassword = (mailto: string, code: number) => {
  const SES_CONFIG = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "ap-south-1",
  };

  const AWS_SES = new SES(SES_CONFIG);
  let params = {
    Source: "contact@codechefvit.com",
    Destination: {
      ToAddresses: [mailto],
    },
    ReplyToAddresses: [],
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",// @ts-ignore
          Data: sendForgotPasswordMail(code),
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: `C`,
      },
    },
  };

  AWS_SES.sendEmail(params)
    .promise()
    .then(() => {
      return true;
    })
    .catch(() => {
      return false;
    });
};