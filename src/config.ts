require('dotenv').config()

// Mapper for environment variables
export const environment = process.env.NODE_ENV;
export const port = process.env.PORT || 3000 ;

// export const corsUrl = process.env.CORS_URL;

export const logDirectory = '/home/nopc/Desktop/Github-Clones/nodejs-backend-architecture-typescript/logs';
