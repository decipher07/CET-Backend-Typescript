import express, { Router } from 'express'
import { signup, resendOTP, verifyEmail, login, sendForgotPasswordEmail, resetPassword, updateProfile, getProfile, getStudentDetails, dashboard } from '../../controllers/student.controllers'
import checkAuthStudent from '../../middlewares/checkAuthStudent'

const router: Router = express.Router()

//Student signup
router.post("/signup", signup);

//Resend email verication OTP
router.post("/email/resendOTP", resendOTP);

//Student email verification
router.post("/email/verify", verifyEmail);

//Student login
router.post("/login", login);

//Forgot password - Send OTP
router.post(
  "/forgotPassword/sendEmail",

  sendForgotPasswordEmail
);

//Forgot password - Verify OTP
router.post("/forgotPassword/verifyOTP", resetPassword);

//Update student's profile
router.patch("/profile", checkAuthStudent, updateProfile);

//Get a student's profile
router.get("/profile", checkAuthStudent, getProfile);

//Get a student's details
router.get("/details", getStudentDetails);

//Get student's dashboard
router.get("/dashboard", checkAuthStudent, dashboard);

export default router;