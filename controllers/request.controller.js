import PendingRequest from "../models/pendingRequest.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import User from "../models/user.model.js";
import { fMsg, fError,  checkArray } from "../utils/libby.js";
import mongoose from "mongoose";

//this function is for the guardian to create a request to join the class with classCode, childName, studentDOB
//this function is also for the teacher to create a request to join the class with classCode
export const createRequest = async (req, res, next) => {
  // When the guardian and the teacher want to join the class
  try {
    const { classCode, childName, studentDOB } = req.body;
    const currentUser = await User.findById(req.user._id)
    //?? here, will childName and studentDOB be checked with student database

    //mighte delete this if frontend can handle the error
    //the classCode is required for both guardian and teacher
    if(!classCode){
      return next(new Error("Please provide all the required fields"))
    }

    //if the user is guardian, the childName and studentDOB are required
    // if the user is teacher, the classCode is required
    if(currentUser.roles.includes("guardian")){
      if(!childName || !studentDOB){
        return next(new Error("Please provide all the required fields"))
      }
    }
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Find the desired class using the provided class code
    const desireClass = await Class.findOne({ classCode });
    if (!desireClass) {
      return next(new Error("Class not found"))
    }

    // Check if the user already has a  request for this class
    // that will find the pending request for the same class
    const existingRequest = await PendingRequest.findOne({
      sender: userId,//the user id will differ if there are duplicate student with name and DOB
      desireClass: desireClass._id,
      studentName: childName,
      studentDOB: studentDOB,
      status: { $in: ["pending", "accepted"] } //so that even the rejected user can request again
    });

    if (existingRequest) {
      return next(new Error("Request already exists"))
    }

    // Create a new pending request and save it to pendingrequest collection
    const request = new PendingRequest({
      sender: userId,
      desireClass: desireClass._id,
      classCode: classCode,
      roles: req.user.roles,
      studentName: childName,
      studentDOB: studentDOB
    });

    await request.save();

    fMsg(res, "Request created successfully", request, 200);
  } catch (error) {
    next(error);
  }
};

export const readTeacherReq = async(req, res, next)=> {
  try{
    const { classId }  = req.query;

    if(classId == null){
      return next(new Error("Please provide all the required fields"))
    }

    const classObj = await Class.findById(classId)
    if(!classObj){
      return next(new Error("Class not found"))
    }

    const classCode = classObj.classCode;

    let requests = await PendingRequest.find({roles: ['teacher'], classCode: classCode, status: "pending"});
    if(requests.length === 0){
      return next(new Error("There are no requests at the moment"))
    }

    fMsg(res, `Teacher requests`, requests, 200);
  }catch(error){
    next(error)
  }
}

export const readGuardianReq = async(req, res, next)=> {
  try{
    const { classId, studentId }  = req.query;
    const teacherId = req.user._id; 
    const teacher = await User.findById(teacherId);

    if(classId == null || studentId == null){
      return next(new Error("Please provide all the required fields"))
    }

    const classObj = await Class.findById(classId)
    if(!classObj){
      return next(new Error("Class not found"))
    }

    const classCode = classObj.classCode;

    const student = await Student.findById(studentId)
    if(!student){
      return next(new Error("There is no such student "))
    }

    let classVerify = checkArray(teacher.classes, classId);
    if(!classVerify){
      return next(new Error("You don't have permission to read the leave requests from other class"))
    }

    let requests = await PendingRequest.find({roles: ['guardian'], desireClass: classId, studentName: student.name, studentDOB: student.dateofBirth, status: "pending"}).populate("sender", "userName email phone relationship");
      if(!requests){
        return next(new Error("There are no requests for this student at the moment"))
      }

  fMsg(res, `Guardian requests`, requests, 200);
  }catch(error){
    next(error)
  }
    
}

//this function is for the teacher to respond the requests for the guardian
//this function is also for the admin to respond the requests for the teacher 

export const respondTeacherReq = async(req, res, next) => {
  try{
    const { classId, requestId, response } = req.body;
    const adminId = req.user._id; 

    //might delete later if frontend can handle the error 
    if(!classId || !requestId || response == null){
      return next(new Error("Please provide all the required fields"))
    }
    
    const classObj = await Class.findById(classId);
    if(!classObj){
      return next(new Error("Invalid Class"))
    }

    const request= await PendingRequest.findById({_id: requestId, status: "pending"});
    if(!request){
      return next(new Error("Invalid Request Id"))
    }
    const teacher = await User.findById(request.sender);
    let alreadyInClass = checkArray(teacher.classes, classId);
    if(alreadyInClass == true){
      return fError(res, "User has already joined the class", 505)
    }

    const admin = await User.findById(adminId);
    //currently, since there is only one role, "0" index array will be used. Considerations need to be done in the future. 
    const adminSchool = admin.schools[0];

    if(response == true){
      classObj.teachers.push(request.sender);
      await classObj.save();
  
      //add the class and school into user profile
      teacher.classes.push(classId);
      teacher.schools.push(adminSchool);
      await teacher.save();

      let acceptedTeacher = await PendingRequest.findOneAndUpdate({_id: requestId}, {status:"accepted"})
      return fMsg(res, "Teacher is accepted", acceptedTeacher, 200)
    }else if(response == false){
      let rejectedTeacher = await PendingRequest.findOneAndUpdate({_id: requestId}, {status:"rejected"})
      return fMsg(res, "Teacher is rejected", rejectedTeacher, 200)
    }else{
      return fError(res, "Wrong response",505)
    }
    // await PendingRequest.findOneAndDelete({_id: requestId});
  }catch(error){
    next(error)
  }
}

export const respondGuardianReq = async(req, res, next) => {
  try{
    const { classId, requestId, response } = req.body;
    const teacherId = req.user._id; 

    //might delete later if frontend can handle the error 
    if(!classId || !requestId || response == null){
      return next(new Error("Please provide all the required fields"))
    }
    
    const classObj = await Class.findById(classId);
    if(!classObj){
      return next(new Error("Invalid Class"))
    }

    const request= await PendingRequest.findById({_id: requestId, status: "pending"});
    if(!request){
      return next(new Error("Invalid Request Id"))
    }

    const teacher = await User.findById(teacherId);
    let classPermission = checkArray(teacher.classes, classId);
    if(classPermission == false){
      return fError(res, "You don't have permission to response this request", 505)
    }

    const guardian = await User.findById(request.sender);
    console.log(guardian);
    let alreadyInClass = checkArray(guardian.classes, classId);
    if(alreadyInClass == true){
      return fError(res, "Guardian has already joined the class", 505)
    }

    const studentName = request.studentName;
    const studentDOB = request.studentDOB;
    const student = await Student.findOne({name: studentName, dateofBirth: studentDOB});

    if(response == true){

      //push a class into guardian data
      await User.findOneAndUpdate( {_id: request.sender}, {"$push": {classes: classId}} )

      // add a guradian in student's data if there isn't any guardian yet.  
      let studentAddGuardian = checkArray(student.guardians, request.sender);
      if(!studentAddGuardian){
        await Student.findOneAndUpdate( {_id: student._id}, {"$push": {guardians: request.sender}});
      }

      //add child to the guardian if there is not child yet
      let guardianAddChild = checkArray(guardian.childern, student._id);
      if(!guardianAddChild){
        await User.findOneAndUpdate( {_id: request.sender}, {"$push": {childern: student._id}} )
      }

      // let guardian

      let classAddGuardian = checkArray(classObj.guardians, request.sender);
      if(!classAddGuardian){
        await Class.findOneAndUpdate( {_id: classId}, {"$push": {guardians: request.sender}} );
      }

      let guardianAddSchool = checkArray(guardian.schools, classObj.school)
      if(!guardianAddSchool){
        await User.findOneAndUpdate( {_id: request.sender}, {"$push": {schools: classObj.school}} )
      }

      let studentAddSchool = checkArray(student.schools, classObj.school)
      if(!studentAddSchool){
        await Student.findOneAndUpdate( {_id: student._id}, {"$push": {schools: classObj.school}} )
      }

      let studentAddClass = checkArray(student.classes, classId)
      if(!studentAddClass){
        await Student.findOneAndUpdate( {_id: student._id}, {"$push": {classes: classId}} )
      }

      let requests = await PendingRequest.findOneAndUpdate({_id: requestId}, {status:"accepted"})
      return fMsg(res, "Guardian Requests got accepted ", requests, 200)

    }else if(response == false){
      let requests = await PendingRequest.findOneAndUpdate({_id: requestId}, {status:"rejected"})
      return fMsg(res, "Guardian Requests got rejected", requests, 200)

    }else{
      return fError(res, "Wrong response", 505)
    }
  }catch(error){
    next(error)
  }
}