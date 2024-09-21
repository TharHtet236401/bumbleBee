import express from "express";
import { createLeaveRequest ,getLeaveReasons} from "../controllers/leaveRequest.controller.js";
import { isGuardian ,validateToken} from "../utils/validator.js";

const router = express.Router();

router.post("/create", validateToken(), isGuardian(), createLeaveRequest);
router.get("/reasons", getLeaveReasons);

export default router;