import express, { Request, Response, NextFunction } from 'express';
import Logger from './core/Logger';
import bodyParser from 'body-parser';
import cors from 'cors';
import { environment } from './config';
import './database'; // initialize database
import { NotFoundError, ApiError, InternalError } from './core/ApiError';

import helmet from 'helmet'
import passport from 'passport'


const rateLimit = require("express-rate-limit");
const useragent = require("express-useragent");
require("dotenv").config();


process.on('uncaughtException', (e) => {
  Logger.error(e);
});

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true, parameterLimit: 50000 }));
app.use(cors({ origin: '*', optionsSuccessStatus: 200 }));

// Routes




// catch 404 and forward to error handler
app.use((req, res, next) => next(new NotFoundError()));

app.set('trust proxy', 1);
var limiter = new rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message:
    "Too many requests created from this IP, please try again after an hour",
});
app.use(limiter)

//Use helmet to prevent common security vulnerabilities
app.use(helmet());

//Set static folder
app.use("/uploads", express.static("./public"));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Allow CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, auth-token"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

app.use(cors());

app.use(useragent.express());


if (process.env.NODE_ENV == "production") {
  app.use((req, res, next) => { // @ts-ignore
    if (req.useragent["isBot"] == false) {
      next();
    } else {
      res.status(401).json({
        message:
          "Please try using a different browser: Interception is blocked",
      });
    }
  });
}

if (process.env.NODE_ENV == "development") {
  app.use("/dev", require("./api/routes/dev.routes"));
}


// Middleware Error Handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    ApiError.handle(err, res);
  } else {
    if (environment === 'development') {
      Logger.error(err);
      return res.status(500).send(err.message);
    }
    ApiError.handle(new InternalError(), res);
  }
});


//This function will give a 404 response if an undefined API endpoint is fired
app.use((req, res, next) => {
  const error = new Error("Route not found"); // @ts-ignore
  error.status = 404;
  next(error);
});


export default app;
