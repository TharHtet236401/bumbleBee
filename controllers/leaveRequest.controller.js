import User from "../models/user.model.js";
import LeaveRequest from "../models/leaveRequest.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import {  checkArray } from "../utils/libby.js";
import { fMsg, fError} from "../utils/libby.js";

///this function is dedicated for the guardian to create a leave request for the student
export const createLeaveRequest = async (req, res, next) => {
  try {
    //we will take the senderId from the token
    
    const senderId = req.user._id;
    const user = await User.findById(senderId);
    const { studentId, classId, startDate, endDate, reason, description } =
      req.body;

    if(!studentId || !classId || !startDate || !endDate || !reason){
      return fError(res, "Please enter all the field")
    }

    // Check if end date is earlier than start date
    if (new Date(endDate) < new Date(startDate)) {
      return fError(res, "End date cannot be earlier than start date")
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
      description,
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

    const reasons = ["Health", "Personal", "Others"];
    if (!reasons.includes(reason)) {
      return next(new Error("Invalid reason"));
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

export const readLeaveRequestByClass = async(req, res, next) => {
  try{
    const readerId = req.user._id;
    const reader = await User.findById(readerId);

    const classId = req.params.classId;

    //ensures that only teachers who are assigned to the class can view the requests 
    let classPermission = checkArray(reader.classes, classId);
    if(!classPermission){
      return next(new Error("You don't have permission to view the leave requests from other class"))
    }

    const classObj = await Class.findById(classId);
    //this might not need this but just in case before frontend is ready
    if(!classObj){
      return next(new Error("Class not found"));
    }

    let leaveRequests = await LeaveRequest.find({classId: classId})
          .populate("studentId", "name")
          .populate("senderId", "userName");
    fMsg(res, "Leave requests", leaveRequests, 200);


  } catch(error){
    next(error)
  }
}

export const readAllLeaveRequests = async(req, res, next) => {
  try{
    console.log("it is working")
    const readerId = req.user._id;
    const reader = await User.findById(readerId);

    let leaveRequests = [];
    for(let i = 0; i < reader.classes.length; i++){
      for(let j = 0; j < reader.childern.length; j++){
        let requests = await LeaveRequest.find({classId: reader.classes[i], studentId: reader.childern[j]});
        if(requests.length>0){
          console.log("This condition work and requests is " + requests)
          leaveRequests.push(requests)
        }
      }
 
      
    }
    fMsg(res, "Leave requests", leaveRequests, 200);


  } catch(error){
    next(error)
  }
}

export const editLeaveRequest = async(req, res, next) => {
  try{
    const editorId = req.user._id;
    const editor = await User.findById(editorId);
    //?? add here that u don't have permission to edit the leave request
    const { leaveReqId, studentId, classId, startDate, endDate, reason, description } = req.body;

      //ensures that only teachers who are assigned to the class can view the requests 
      if(!leaveReqId || !studentId || !classId || !startDate || !endDate || !reason ){
        return fError(res, "Please enter all the field")
      }

    let classPermission = checkArray(editor.classes, classId);
    if(!classPermission){
      return next(new Error("You don't have permission to edit the leave requests from other class"))
    }

    //check if the leaveReqId is in the storage
    const leaveReq = await LeaveRequest.findById(leaveReqId)
    if(!leaveReq){
      return next(new Error("Leave Request is not found"))
    }

    // Check if end date is earlier than start date
    if (new Date(endDate) < new Date(startDate)) {
      return next(new Error("End date cannot be earlier than start date"));
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

    const reasons = ["Health", "Personal", "Others"];
    if (!reasons.includes(reason)) {
      return next(new Error("Invalid reason"));
    }

    const editedLeaveReq = await LeaveRequest.findByIdAndUpdate(
      leaveReqId, 
      {
        studentId, 
        classId, 
        startDate, 
        endDate, 
        reason, 
        description
      },
      { new: true }
    )

    fMsg(res, "Leave Request is updated ", editedLeaveReq, 200)
  }catch(error){
    next(error);
  }
}

export const deleteLeaveRequest = async(req, res,  next) => {
  const deleterId = req.user._id;
    const deleter = await User.findById(deleterId);
    //?? add here that u don't have permission to delete the leave request
    const { leaveReqId } = req.body;

    if(!leaveReqId){
      return fError(res, "Please enter the leave request Id")
    }

    //check if the leaveReqId is in the storage
    const leaveReq = await LeaveRequest.findById(leaveReqId)
    if(!leaveReq){
      return next(new Error("Leave Request is not found"))
    }

    const deletedReq = await LeaveRequest.findByIdAndDelete(leaveReqId);

    fMsg(res, "Request is deleted successfully", deletedReq, 200 )
}

export const respondLeaveRequest = async(req, res, next) => {
  const senderId = req.user._id;
  const user = await User.findById(senderId);

  const { leaveReqId, response } = req.body
  
  if(!leaveReqId || !response){
    return fError(res, "Please enter all the field")
  }

  //check if the leaveReqId is in the storage
  const leaveReq = await LeaveRequest.findById(leaveReqId)
  if(!leaveReq){
    return next(new Error("Leave Request is not found"))
  }  

  //ensures that only teachers who are assigned to the class can respond the requests 
  // let classPermission = false;
  // while(classPermission == false){
  //   for(let i = 0; i < user.classes.length; i++){
      
  //     if(user.classes[i] == leaveReq.classId.toString()){
  //       classPermission = true;
  //       break;
  //     }
  //   }
  //   if(classPermission == false){
  //     classPermission = true;
  //     return fMsg(res, "You don't have permission to view the leave requests from other class", 403)
  //   }
  // }

  let classPermission = checkArray(user.classes, leaveReq.classId);
    if(!classPermission){
      return next(new Error("You don't have permission to view the leave requests from other class"))
    }

    if(response.toString() != "read" && response.toString() != "unread"){
      return fError(res, "Please enter the valid response: read or unread")
    }

  const editedLeaveReq = await LeaveRequest.findByIdAndUpdate(
    leaveReqId, 
    {
      status: response
    },
    { new: true }
  )
  
  fMsg(res, "You have changed status of the response ", editedLeaveReq, 200)
}

export const getLeaveReasons = async (req, res, next) => {
  try {
    const reasons = ["Health", "Personal", "Others"];
    fMsg(res, "Leave reasons", reasons, 200);
  } catch (error) {
    next(error);
    console.log(error)

  }
}
