import express from "express";
import { createLeaveRequest, readLeaveRequest, editLeaveRequest, deleteLeaveRequest, respondLeaveRequest} from "../controllers/leaveRequest.controller.js";
import { isGuardian ,validateToken, isTeacher} from "../utils/validator.js";

const router = express.Router();

router.post("/create", validateToken(), isGuardian(), createLeaveRequest);

router.get("/read", validateToken(), isTeacher(), readLeaveRequest);

router.put("/edit", validateToken(), isGuardian(), editLeaveRequest);

router.delete("/delete", validateToken(), isGuardian(), deleteLeaveRequest);

router.post("/respond", validateToken(), isTeacher(), respondLeaveRequest);

export default router;