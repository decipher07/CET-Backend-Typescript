import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import EasterEggForm, { EasterEggFormModel } from '../database/model/easterEggForm.model'// @ts-ignore

require('dotenv').config()


// @desc Generate an OTP and save in database
// @route GET /api/easterEgg/gererateOTP
export const generateOTP = async (req: Request, res: Response, next: NextFunction) => {
  let digits = "0123456789";
  let OTP = "";
  for (let i = 0; i < 6; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }

  const student : EasterEggForm = new EasterEggFormModel({
    _id: new Types.ObjectId(),
    otp: OTP,
  });

  await student
    .save()
    .then(async () => {
      res.status(200).json({
        otp: OTP,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Submit easter egg form
// @route POST /api/easterEgg/form
export const form = async (req: Request, res: Response, next: NextFunction) => {
  const { name, registrationNumber, email, phoneNumber, otp } = req.body;

  if (!name || !registrationNumber || !email || !phoneNumber || !otp) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }

  const existingStudent = await EasterEggFormModel.findOne({ email });

  if (existingStudent) {
    return res.status(409).json({
      message: "Student exists",
    });
  }

  await EasterEggFormModel.updateOne(
    { otp, email: { $exists: false } },
    { $set: { email, registrationNumber, phoneNumber, name } }
  )
    .then(async (result) => {
      if (result.n === 0) {
        return res.status(401).json({
          message: "Invalid or already used OTP!",
        });
      }
      return res.status(201).json({
        message: "Easter egg form successfully submitted",
      });
    })
    .catch((err) => {
      return res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// const form = async (req, res, next) => {
//   const { name, registrationNumber, email, phoneNumber, otp } = req.body;

//   if (!name || !registrationNumber || !email || !phoneNumber || !otp) {
//     return res.status(400).json({
//       message: "1 or more parameter(s) missing from req.body",
//     });
//   }

//   const existingStudent = await EasterEggForm.findOne({ email });

//   if (existingStudent) {
//     return res.status(409).json({
//       message: "Student exists",
//     });
//   }
//   const student = new EasterEggForm({
//     _id: new mongoose.Types.ObjectId(),
// email,
// registrationNumber,
// phoneNumber,
// name,
// otp,
//   });

//   await student
//     .save()
//     .then((result) => {
//       return res.status(201).json({
//         message: "Easter egg form successfully submitted",
//       });
//     })
//     .catch((err) => {
//       return res.status(500).json({
//         message: "Something went wrong",
//         error: err.toString(),
//       });
//     });
// };