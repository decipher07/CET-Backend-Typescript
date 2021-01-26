import { Request } from 'express';
import Student from '../database/model/student.model'

declare interface UserRequest extends Request {
  user: Student;
}
