import User from "../models/user.model.js";
import LeaveRequest from "../models/leaveRequest.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import LeaveRequestType from "../models/leaveRequestType.model.js";
import { fMsg } from "../utils/libby.js";

///this function is dedicated for the guardian to create a leave request for the student
export const createLeaveRequest = async (req, res, next) => {
  try {
    //we will take the senderId from the token
    const senderId = req.user._id;
    const user = await User.findById(senderId);
    const { studentId, classId, startDate, endDate, reason, description } =
      req.body;

    // Check if end date is earlier than start date
    if (new Date(endDate) < new Date(startDate)) {
      return next(new Error("End date cannot be earlier than start date"));
    }

    // Check if a similar leave request already exists
    const existingRequest = await LeaveRequest.findOne({
      studentId,
      classId,
      startDate,
      endDate,
      reason,
      senderId,
    });

    if (existingRequest) {
      return next(new Error("A similar leave request already exists"));
    }

    //this might not need this but just in case before frontend is ready
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new Error("Student not found"));
    }

    //this might not need this but just in case before frontend is ready
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return next(new Error("Class not found"));
    }

    //this might not need this but just in case before frontend is ready
    const reasonObj = await LeaveRequestType.findById(reason);
    if (!reasonObj) {
      return next(new Error("Reason not found"));
    }

    const tosaveRequest = {
      senderId,
      studentId,
      classId,
      startDate,
      endDate,
      reason,
      description,
    };

    const leaveRequest = new LeaveRequest(tosaveRequest);
    await leaveRequest.save();

    fMsg(res, "Leave request created successfully", leaveRequest, 200);
  } catch (error) {
    next(error);
  }
};
