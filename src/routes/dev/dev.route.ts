import express, { Router } from 'express'
import  {getAllClubs, getAllFeaturedClubs, getAllTestsOfAClub, getAllPublishedTestsOfAClub, getAllDomainsOfATest, getDomainByID, clearEntriesFromDomainByStudentID, studentTestDashboard, getDetailsOfMultipleStudents, whitelistEmails, getAllSubmissionsOfDomain, getNumSubmissionOfAllDomains, getNumSubmissionOfAllDomainsofMultipleTests, removeUsersFinished, findUserByEmail, getTotalUsersStarted, getAllShortlistedStudentsOfClub, sendShortlistEmail, getShortlistedStudentsOfADomain, getShortlistedStudentsMultipleDomains}  from '../../controllers/dev.controllers'

const router: Router = express.Router()

router.get("/allClubs", getAllClubs);

router.get("/allFeaturedClubs", getAllFeaturedClubs);

router.get("/allTestsOfAClub", getAllTestsOfAClub);

router.get(
  "/allPublishedTestsOfAClub",
  getAllPublishedTestsOfAClub
);

router.get("/allDomainsOfATest", getAllDomainsOfATest);

router.get("/domainByID", getDomainByID);

router.patch(
  "/clearEntriesFromDomainByStudentID",
  clearEntriesFromDomainByStudentID
);

router.get("/studentTestDashboard", studentTestDashboard);

router.get(
  "/multipleStudentDetails",
  getDetailsOfMultipleStudents
);

// router.post("/sendWelcomeEmail", sendWelcomeEmail);

router.post("/whitelistEmails", whitelistEmails);

router.get(
  "/allSubmissionsOfADomain",
  getAllSubmissionsOfDomain
);

router.get(
  "/getNumSubmissionOfAllDomains",
  getNumSubmissionOfAllDomains
);

router.get(
  "/getNumSubmissionOfAllDomainsofMultipleTests",
  getNumSubmissionOfAllDomainsofMultipleTests
);

router.patch("/removeFinished", removeUsersFinished);

router.get("/findByEmail", findUserByEmail);

router.get("/getTotalUsersStarted", getTotalUsersStarted);

router.get(
  "/getAllShortlistedStudentsOfClub",
  getAllShortlistedStudentsOfClub
);

router.post("/sendShortlistEmail", sendShortlistEmail);

// router.patch("/changepass", async (req, res) => {
//   await bcrypt.hash(password, 10).then(async (hash) => {
//     await Club.findOneAndUpdate(
//       { _id: clubId },
//       {
//         $set: { password: hash },
//       }
//     )
//       .then(() => {
//         res.status(200).json({ message: "Done" });
//         console.log("done");
//       })
//       .catch((err) => {
//         res.status(500).json({ message: err.toString() });
//         console.log(err.toString());
//       });
//   });
// });

router.get(
  "/getShortlistedStudentsOfADomain",
  getShortlistedStudentsOfADomain
);

router.get(
  "/getShortlistedStudentsMultipleDomains",
  getShortlistedStudentsMultipleDomains
);


export default router