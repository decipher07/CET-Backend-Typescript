import { Request } from 'express';
import Student from '../database/model/student.model'

declare interface PublicRequest extends Request {
  userType: string;
}