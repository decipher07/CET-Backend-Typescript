import express, { Router } from 'express'
import useragent from '../../middlewares/useragent'
import { addStudent, getStudents, editStudent, deleteStudent } from '../../controllers/student.form.controllers'

const router: Router = express.Router()

router.post("/add", useragent,  addStudent);

router.get("/students", useragent,  getStudents);

router.put("/edit", useragent,  editStudent);

router.delete("/delete", useragent,  deleteStudent);


export default router;