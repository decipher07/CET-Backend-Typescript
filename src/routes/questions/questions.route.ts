import express, { Router } from 'express'
import {addQuestion, addMultipleQuestions, getAllQuestions, updateMarks, deleteQuestion} from '../../controllers/question.controllers'
import checkAuthClub from '../../middlewares/checkAuthClub'
import { uploadQuestionMedia } from '../../middlewares/s3UploadClient'

const router: Router = express.Router()

//Add a question to a test
router.post(
  "/add",
  checkAuthClub,
  uploadQuestionMedia.single("media"),
  addQuestion
);

//Add multiple questions to a test
router.post(
  "/addMultiple",
  checkAuthClub,

  addMultipleQuestions
);

//Get all questions of a test -- to be viewed only by club
router.get("/all", checkAuthClub, getAllQuestions);

//Add marks
router.post("/marks", checkAuthClub, updateMarks);

//Delete a question
router.delete("/delete", checkAuthClub, deleteQuestion);


export default router;