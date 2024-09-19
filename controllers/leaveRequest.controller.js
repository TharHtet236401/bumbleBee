import User from "../models/user.model.js";
import LeaveRequest from "../models/leaveRequest.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import LeaveRequestType from "../models/leaveRequestType.model.js";
import { fMsg } from "../utils/libby.js";

export const createLeaveRequest = async (req, res) => {
 try {
    fMsg(res, "Leave request created successfully", {blh: "blh"}, 200)
 }
 catch (error) {
    next(error)
 }
}