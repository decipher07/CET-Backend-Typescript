import { Request } from 'express';
import Student from '../database/model/student.model'

declare interface userType {
  userType : string, 
  userId : string,
  email : string,
  name : string
}

declare interface UserRequest extends Request {
  user: userType;
}
