import { createLeaveRequestType, getLeaveRequestTypes, updateLeaveRequestType, deleteLeaveRequestType } from "../controllers/leaveRequestType.controller.js";
import express from "express";
const router = express.Router();

router.post("/create", createLeaveRequestType)
router.get("/get", getLeaveRequestTypes)
router.put("/update/:requestTypeId", updateLeaveRequestType)
router.delete("/delete/:requestTypeId", deleteLeaveRequestType)

export default router;