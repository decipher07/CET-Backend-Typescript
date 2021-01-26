import {Request, Response, NextFunction} from 'express'
import asyncHandler from '../helpers/asyncHandler'
require('dotenv').config()

const useragent = asyncHandler( async (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV == "production") { // @ts-ignore
    if (req.useragent["isBot"] == false) {
      next();
    } else {
      res.status(401).json({
        message: "Please try using a different browser: Interception is blocked",
      });
    }
  } else {
    next()
  }
})

export default useragent 