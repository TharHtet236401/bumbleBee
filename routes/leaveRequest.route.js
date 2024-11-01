import express from "express";
import { createLeaveRequest, readLeaveRequestByClass, readAllLeaveRequests, editLeaveRequest, deleteLeaveRequest, respondLeaveRequest, getLeaveReasons, readAllClassLeaveRequests} from "../controllers/leaveRequest.controller.js";
import { isGuardian ,validateToken, isTeacher} from "../utils/validator.js";

const router = express.Router();

router.post("/create", validateToken(), isGuardian(), createLeaveRequest);

router.get("/readByClass/:classId", validateToken(), isTeacher(), readLeaveRequestByClass);
router.get("/readAllReq", validateToken(), isGuardian(), readAllLeaveRequests);
router.get("/readAllClassLeaveReq", validateToken(), isTeacher(), readAllClassLeaveRequests)

router.put("/edit", validateToken(), isGuardian(), editLeaveRequest);

router.delete("/delete", validateToken(), isGuardian(), deleteLeaveRequest);

router.put("/respond", validateToken(), isTeacher(), respondLeaveRequest);
router.get("/reasons", getLeaveReasons);

export default router;