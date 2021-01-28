import express, { Router } from 'express'
import {create, feature, uploadBanner, uploadProfilePicture, getClubDetailsUsername,sendWelcomeEmail, signup, verifyEmail, resendOTP, login, updateProfile, getSelfProfile, getClubDetails, getAllFeaturedClubs} from '../../controllers/club.controllers'
import checkAuthClub from '../../middlewares/checkAuthClub'
import { uploadClubAvatar, uploadClubBanner} from '../../middlewares/s3UploadClient'

const router: Router = express.Router()

//Create Club
router.post("/create", create);

//Send welcome email
router.post("/sendWelcomeEmail", sendWelcomeEmail);

//Club signup
router.post("/signup", signup);

//Club email verification
router.post("/email/verify", verifyEmail);

//Resend email verication OTP
router.post("/email/resendOTP", resendOTP);

//Club login
router.post("/login", login);

//Update club's profile
router.patch("/profile", checkAuthClub, updateProfile);

//Get club's profile -- Only for club admin
router.get("/profile", checkAuthClub, getSelfProfile);

//Get club's details
router.get("/details", getClubDetails);

//Get Club's details username
router.get("/details/username", getClubDetailsUsername);

//Feature or unfeature a club for recruitments
router.patch("/feature", checkAuthClub, feature);

//Get all featured clubs
router.get("/allFeatured", getAllFeaturedClubs);

//Upload club avatar
router.put(
  "/avatar",
  checkAuthClub,

  uploadClubAvatar.single("avatar"),
  uploadProfilePicture
);

//Upload club banner
router.put(
  "/banner",
  checkAuthClub,

  uploadClubBanner.single("banner"),
  uploadBanner
);

export default router