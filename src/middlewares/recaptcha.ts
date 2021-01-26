import { Request, Response, NextFunction } from 'express'
import asyncHandler from '../helpers/asyncHandler'
require('dotenv').config()

const request = require('request')
import {RequestAsJSON} from 'request'

const recaptcha = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.body.captcha) {
    return res.status(400).json({
      message: "No recaptcha token",
    });
  }
  request ({
    url: 'https://www.google.com/recaptcha/api/siteverify',
    method: 'POST',
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${req.body.captcha}`
  },
    (err: Error, response: any, body: any) => {
      body = JSON.parse(body);
      console.log(err)
      console.log(body)
      try {
        let flag : number 
        if (!body.success || body.score < 0.4) {
          flag = 1;

          console.log(err)
          return res.status(500).json({
            message: "Something went wrong",
            error: err.toString(),
          });
        }
        if (err) {
          console.log(err)
          return res.status(500).json({
            message: "Something went wrong",
            error: err.toString(),
          });
        }
        next();
      } catch (err) {

        console.log(err)
        return res.status(500).json({
          message: "Something went wrong",
          error: err.toString(),
        });
      }
    }
  );
});

export default recaptcha