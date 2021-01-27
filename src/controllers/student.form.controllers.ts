import { NextFunction, Request, Response } from 'express'
import { hash, compare } from 'bcrypt'
import { sign, verify } from 'jsonwebtoken'
import { Types } from 'mongoose'
import { SES } from 'aws-sdk'
import Club, { ClubModel } from '../database/model/club.model'
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

// @desc Add Student to the student form
// @route POST /api/studentForm/add
export const addStudent = async (req: Request, res: Response, next: NextFunction) => {
  const { name, registrationNumber, email, phoneNumber } = req.body;
  if (!name || !registrationNumber || !email || !phoneNumber) {
    return res.status(400).json({
      message: "1 or more parameter(s) missing from req.body",
    });
  }
  const existingStudent = await StudentFormModel.findOne({ email });
  if (existingStudent) {
    return res.status(409).json({
      message: "Student exists",
    });
  }
  const student = new StudentFormModel({
    _id: new Types.ObjectId(),
    email,
    registrationNumber,
    phoneNumber,
    name,
  });

  await student
    .save()
    .then((result: StudentForm) => {
      return res.status(201).json({
        message: "Student successfully created",
        result,
      });
    })
    .catch((err) => {
      return res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Get all the studetns that filled the form
// @route GET /api/studentForm/students
export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  const students : Array<StudentForm> = await StudentFormModel.find();
  if (students) {
    return res.status(200).json({
      message: "Students successfully found",
      students,
    });
  } else {
    return res.status(500).json({
      message: "Something went wrong",
      // error: err.toString(),
    });
  }
};

// @desc Edit a student form
// @route PUT /api/studentForm/edit
export const editStudent = async (req: Request, res: Response, next: NextFunction) => {
  const { studentId, student } = req.body;
  await StudentFormModel.updateOne(
    {
      _id: studentId,
    },
    {
      student,
    }
  )
    .then((result: any) => {
      return res.status(200).json({
        message: "Students successfully updated",
      });
    })
    .catch((err) => {
      return res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};

// @desc Delete a student
// @route DELETE /api/studentForm/delete
export const deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
  const { studentId } = req.body;
  await StudentFormModel.deleteOne({
    _id: studentId,
  })
    .then((result: any) => {
      return res.status(200).json({
        message: "Student successfully deleted",
      });
    })
    .catch((err) => {
      return res.status(500).json({
        message: "Something went wrong",
        error: err.toString(),
      });
    });
};