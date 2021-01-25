import {
  Request,
  Response,
  NextFunction
} from 'express'
import asyncHandler from '../helpers/asyncHandler'

import {verify} from 'jsonwebtoken'
require('dotenv').config()

const checkAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization)
    return res.status(401).json({
      message: "Access Denied! No token entered.",
    });

  const token = req.headers.authorization.split(" ")[1];

  try {
    const verified = verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({
      message: "Auth failed!",
    });
  }
})