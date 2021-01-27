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

