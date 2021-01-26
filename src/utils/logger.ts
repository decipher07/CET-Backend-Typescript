const { createLogger, transports, format } = require("winston");
const { combine, timestamp, label, printf } = format;

require("dotenv").config();
require("winston-mongodb");

// @ts-ignore
const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export const errorLogger = createLogger({
  transports: [
    new transports.File({
      filename: "error.log",
      level: "error",
      format: combine(label({ label: "ERROR" }), timestamp(), myFormat),
    }),
    new transports.MongoDB({
      level: "error",
      db: process.env.DBURI,
      options: {
        useUnifiedTopology: true,
      },
      collection: "error_logs",
      format: format.combine(format.timestamp(), format.json()),
    }),
  ],
});
