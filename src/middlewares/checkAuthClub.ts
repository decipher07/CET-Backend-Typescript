import {
  Request,
  Response,
  NextFunction
} from 'express'
import asyncHandler from '../helpers/asyncHandler'

import {verify} from 'jsonwebtoken'
require('dotenv').config()

const checkAuthClub = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization)
    return res.status(401).json({
      message: "Access Denied! No token entered.",
    });

  const token = req.headers.authorization.split(" ")[1];

  try {
    //@ts-ignore
    const verified = verify(token, process.env.JWT_SECRET);
    req.user = verified;
    /*
      Add Extensions to Requests Based on User Model of Request Received.
    */
    
    // @ts-ignore
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