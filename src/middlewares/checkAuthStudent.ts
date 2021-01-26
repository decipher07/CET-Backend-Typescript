import {
  Request,
  Response,
  NextFunction
} from 'express'
import asyncHandler from '../helpers/asyncHandler'

import {verify} from 'jsonwebtoken'
import { UserRequest } from '../types/app-request';
require('dotenv').config()

const checkAuthStudent = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.headers.authorization)
    return res.status(401).json({
      message: "Access Denied! No token entered.",
    });

  const token = req.headers.authorization.split(" ")[1];

  try {
    // @ts-ignore
    const verified = verify(token, process.env.JWT_SECRET);
    req.user = verified;
    if (req.user.userType === "Student") {
      next();
    } else {
      return res.status(403).json({
        message: "Not a student",
      });
    }
  } catch (err) {
    res.status(400).json({
      message: "Auth failed!",
    });
  }
});

export default checkAuthStudent