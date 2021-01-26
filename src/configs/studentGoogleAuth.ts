import passport, { Strategy} from 'passport'
import {Strategy as GoogleStrategy, GoogleCallbackParameters, Profile} from 'passport-google-oauth20'
import { sign }  from 'jsonwebtoken'
import { Types } from 'mongoose'
import  Student, {StudentModel}  from '../database/model/student.model'
require('dotenv').config()

passport.serializeUser((user: any , done: any) => {
  done(null, user.id);
});

passport.deserializeUser((id, done: any) => {
  StudentModel.findById(id)
    .then((user: Student) => {
      done(null, user);
    })
    .catch((err: Error) => {
      console.log(err);
    });
});

passport.use(
  new GoogleStrategy(
    { // @ts-ignore
      clientID: process.env.CLIENT_ID, // @ts-ignore
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "/api/auth/google/redirect",
    },
    async (accessToken: GoogleCallbackParameters, refreshToken: GoogleCallbackParameters, profile: Profile, done: any) => {
      const emailRegex = /[A-Za-z]+.[A-Za-z]*20[0-9]{2}[A-Za-z]*@vitstudent.ac.in/;
      // if (profile && !profile.emails[0].value.match(emailRegex)) {
      //   console.log("failed");
      //   done: any(new Error("Invalid host domain"));
      // }
      
      if (profile._json.hd === "vitstudent.ac.in") {
        console.log("hello");
        console.log(profile);
        console.log("recieved");
        // check if user already exists in our own db 
        // @ts-ignore
        StudentModel.findOne({ email: profile.emails[0].value })
          .then((currentUser) => {
            if (currentUser) {
              // already have this user
              const token = sign(
                {
                  userType: currentUser.userType,
                  userId: currentUser._id,
                  email: currentUser.email,
                  name: currentUser.name,
                }, // @ts-ignore
                process.env.JWT_SECRET,
                {
                  expiresIn: "1d",
                }
              );

              StudentModel.findById(currentUser._id).then((result7: Student) => {
                result7.token = token;
                result7.googleId = profile.id;
                // @ts-ignore
                result7.loginCount += 1
                result7
                  .save()
                  .then((user: Student) => {
                    done (null, user);
                  })
                  .catch((err: Error) => {
                    console.log(err);
                  });
              });
            } else {
              const emailVerificationCode = Math.floor(
                100000 + Math.random() * 900000
              );

              const emailVerificationCodeExpires =
                new Date().getTime() + 20 * 60 * 1000;
              // if not, create user in our db
              let nameArr = profile.displayName.split(" ");
              let name = nameArr[0] + " " + nameArr[1];
              let registrationNumber = nameArr[-1];
              new StudentModel({
                _id: new Types.ObjectId(),
                googleId: profile.id,
                name: name, // @ts-ignore
                email: profile.emails[0].value,
                emailVerificationCode,
                emailVerificationCodeExpires,
                registrationNumber: registrationNumber,
              })
                .save()
                .then(async (newUser) => {
                  // const emailSent = sendSesOtp(profile.emails[0].value, emailVerificationCode)
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
                  //   to: profile.emails[0].value,
                  //   from: `CodeChef-VIT <${process.env.NODEMAILER_EMAIL}>`,
                  //   html: sendVerificationOTP(emailVerificationCode),
                  // };
                  // transporter.sendMail(mailOptions, (error, response) => {
                  //   if (error) {
                  //     console.log("Email not sent: ", mailOptions.to);
                  //     console.log(error.toString());
                  //   } else {
                  //     console.log("Email sent: ", mailOptions.to);
                  //   }
                  // });
                  // console.log("email sent successfully");
                  console.log(newUser);
                  const token = sign(
                    {
                      userType: newUser.userType,
                      userId: newUser._id,
                      email: newUser.email,
                      name: newUser.name,
                    }, // @ts-ignore
                    process.env.JWT_SECRET,
                    {
                      expiresIn: "1d",
                    }
                  );
                  StudentModel.findById(newUser._id).then((result7: Student) => {
                    result7.token = token;
                    result7
                      .save()
                      .then((user: Student) => {
                        console.log(user);
                        done (null, user);
                      })
                      .catch((err: Error) => {
                        console.log(err);
                      });
                  });
                })
                .catch((err: Error) => {
                  console.log(err);
                });
            }
          })
          .catch((err: Error) => {
            console.log(err);
          });
      } else {
        // fail
        done(new Error("Invalid host domain"));
      }
    }
  )
);

// const sendSesOtp = (mailto, code) => {
  // const SES_CONFIG = {
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  //   region: 'ap-south-1',
  // };

  // const AWS_SES = new AWS.SES(SES_CONFIG);
  // let params = {
  //   Source: 'contact@codechefvit.com',
  //   Destination: {
  //     ToAddresses: [
  //       mailto
  //     ],
  //   },
  //   ReplyToAddresses: [],
  //   Message: {
  //     Body: {
  //       Html: {
  //         Charset: 'UTF-8',
  //         Data: sendVerificationOTP(code),
  //       },
  //     },
  //     Subject: {
  //       Charset: 'UTF-8',
  //       Data: `Hello,!`,
  //     }
  //   },
  // };



//   AWS_SES.sendEmail(params).promise().then(() => {
//     return true
//   }).catch(() => {
//     return false
//   })


// }
