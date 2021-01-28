import express, { Router } from 'express'

import { addDomain, getAllDomainsOfATest, getDetailsOfDomain, attemptDomain, submitDomain, getAllSubmissionsOfADomain, getStudentDomainSubmission, shortlistStudent, removeShortlistedStudent, publishShortlisted, updateDomainDetails, deleteDomain} from '../../controllers/testDomain.controllers'

import checkAuth from '../../middlewares/checkAuth'
import checkAuthStudent from '../../middlewares/checkAuthStudent'
import checkAuthClub from '../../middlewares/checkAuthClub'

const router: Router = express.Router()


//Add a test domain
router.post("/add", checkAuthClub, addDomain);

//Get all domains of a test
router.get("/all", checkAuth, getAllDomainsOfATest);

//Get details of a domain
router.get("/details", getDetailsOfDomain);

//Attempt a domain
router.post("/attempt", checkAuthStudent, attemptDomain);

//Submit a domain
router.post("/submit", checkAuthStudent, submitDomain);

//Get all submissions of a domain
router.get(
  "/allSubmissions",
  checkAuthClub,
  getAllSubmissionsOfADomain
);

//Get a student's submission of a domain
router.get(
  "/studentSubmission",
  checkAuthClub,
  getStudentDomainSubmission
);

//Shortlist a student
router.patch(
  "/shortlist",
  checkAuthClub,
  shortlistStudent
);

//Remove a shortlisted student
router.patch(
  "/removeShortlistedStudent",
  checkAuthClub,
  removeShortlistedStudent
);

//Publish Shortlisted result
router.patch(
  "/publishShortlist",
  checkAuthClub,
  publishShortlisted
);

//Update domain details
router.patch(
  "/details",
  checkAuthClub,
  updateDomainDetails
);

//Delete a domain
router.delete("/delete", checkAuthClub, deleteDomain);

import questions from '../questions/questions.route'
router.use("/question", questions);


export default router