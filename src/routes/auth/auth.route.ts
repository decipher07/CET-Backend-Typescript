import express, { Router } from 'express'
import { authenticate } from 'passport'
const cookieParser = require("cookie-parser");

const router: Router = express.Router()

// @ts-ignore
router.use(cookieParser());

router.get(
  "/google",
  authenticate("google", {
    hd: "vitstudent.ac.in",
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

///Callback route for google to redirect
router.get(
  "/google/redirect",
  authenticate("google"),
  (req, res, next) => {
    const x = req.user;
    console.log(req.user)// @ts-ignore
    var token = encodeURIComponent(req.user.token);// @ts-ignore
    var name = encodeURIComponent(req.user.name);
    res.redirect(
      303,
      // "https://cet-dev.netlify.app/student/oauth/" + token + "/" + req.user.loginCount + '/'
      // @ts-ignore
      "http://cet-portal.codechefvit.com/student/oauth/" + token + "/" + req.user.loginCount + '/'
      // "http://localhost:3000/student/oauth/" + token + "/"
    );
  }
);

export default router