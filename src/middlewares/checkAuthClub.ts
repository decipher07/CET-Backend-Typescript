import {
  Response,
  NextFunction
} from 'express'
import asyncHandler from '../helpers/asyncHandler'

import {verify} from 'jsonwebtoken'
import { UserRequest } from '../types/app-request'
require('dotenv').config()

declare var process : {
  env: {
    JWT_SECRET: string
  }
}

declare interface userType {
  userType : string, 
  userId : string,
  email : string,
  name : string
}


const checkAuthClub = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
  if (!req.headers.authorization)
    return res.status(401).json({
      message: "Access Denied! No token entered.",
    });

  const token = req.headers.authorization.split(" ")[1];

  try {
    let verified : userType = <userType> verify(token, process.env.JWT_SECRET);
    req.user = verified;
    
    if (req.user.userType === "Club") {
      next();
    } else {
      return res.status(403).json({
        message: "Not a Club",
      });
    }
  } catch (err) {
    res.status(400).json({
      message: "Auth failed!",
    });
  }
})

export default checkAuthClub;