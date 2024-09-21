import express from "express";
import { createLeaveRequest, readLeaveRequest, editLeaveRequest, deleteLeaveRequest, respondLeaveRequest, getLeaveReasons} from "../controllers/leaveRequest.controller.js";
import { isGuardian ,validateToken, isTeacher} from "../utils/validator.js";

const router = express.Router();

router.post("/create", validateToken(), isGuardian(), createLeaveRequest);

router.get("/read", validateToken(), isTeacher(), readLeaveRequest);

router.put("/edit", validateToken(), isGuardian(), editLeaveRequest);

router.delete("/delete", validateToken(), isGuardian(), deleteLeaveRequest);

router.post("/respond", validateToken(), isTeacher(), respondLeaveRequest);
router.get("/reasons", getLeaveReasons);

export default router;