import { createRequest, readTeacherReq, readGuardianReq, respondTeacherReq, respondGuardianReq} from "../controllers/request.controller.js";
import { validateToken,  isAdmin, isTeacher } from "../utils/validator.js";
import express from "express";
const router = express.Router();

router.post("/create", validateToken(), createRequest)

//There can be problems here in the future, if there is a user with both roles of teacher and parent
router.get("/readTeacherRequests", validateToken(), isAdmin(), readTeacherReq)
router.get("/readGuardianRequests", validateToken(), isTeacher(), readGuardianReq)
// router.post("/respond", validateToken(), isNotParents(), respondRequest)
router.post("/respondTeacherReq", validateToken(), isAdmin(), respondTeacherReq)
router.post("/respondGuardianReq", validateToken(), isTeacher(), respondGuardianReq)

export default router;