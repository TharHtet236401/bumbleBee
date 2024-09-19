import express from "express";
import { createLeaveRequest } from "../controllers/leaveRequest.controller.js";
import { isGuardian ,validateToken} from "../utils/validator.js";

const router = express.Router();

router.post("/create", validateToken(), isGuardian(), createLeaveRequest);

export default router;