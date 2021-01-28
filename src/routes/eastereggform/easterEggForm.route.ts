import { ImportExport } from 'aws-sdk'
import express, { Router } from 'express'
import { generateOTP, form } from '../../controllers/easterEggForm.controllers'

const router: Router = express.Router()


//Generate an OTP and save in database
router.get("/generateOTP", generateOTP);

//Submit easter egg form
router.post("/form", form);

export default router