import express, { Router } from 'express'

import {create, getTestDetails, apply, attempt, submit, allApplied, allSubmitted, addStudents, publish, getAllTestOfAClub, getAllPublishedTestsOfAClub, updateTest, deleteTest } from '../../controllers/test.controllers'

import checkAuth from '../../middlewares/checkAuth'
import checkAuthStudent from '../../middlewares/checkAuthStudent'
import checkAuthClub from '../../middlewares/checkAuthClub'


const router: Router = express.Router()

//Create a test
router.post("/create", checkAuthClub, create);

//Get details of a test by testId
router.get("/details", checkAuth, getTestDetails);

//Apply for a test
router.post("/apply", checkAuthStudent, apply);

//Attemt a test
router.post("/attempt", checkAuthStudent, attempt);

//Submit test
router.post("/submit", checkAuthStudent, submit);

//Get all applied tests
router.get("/allApplied", checkAuthStudent, allApplied);

//Get all submitted tests
router.get("/allSubmitted", checkAuthStudent, allSubmitted);

//Add users to a test
router.post("/addStudents", checkAuthClub, addStudents);

//Publish a test
router.patch("/publish", checkAuthClub, publish);

//Get all tests of a club -- admin only
router.get(
  "/allTestsOfAClub",
  checkAuthClub,
  getAllTestOfAClub
);

//Get all published tests of a club
router.get(
  "/allPublishedTestsOfAClub",
  getAllPublishedTestsOfAClub
);

//Update test details
router.patch("/details", checkAuthClub, updateTest);

//Delete a test
router.delete("/delete", checkAuthClub, deleteTest);

import testdoman from '../testdomain/testdomain.route'
router.use("/domain", testdoman);


export default router;