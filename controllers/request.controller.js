import PendingRequest from "../models/pendingRequest.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import User from "../models/user.model.js";
import { fMsg, fError, checkClassPermission, checkArray } from "../utils/libby.js";
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

  fMsg(res, `Teacher requests`, requests, 200);
  }catch(error){
    next(error)
  }
    
}

//this function is for the teacher to respond the requests for the guardian
//this function is also for the admin to respond the requests for the teacher 
export const respondRequest = async(req, res, next) => {
  try{
    const { classId, requestId, response } = req.body;

    //might delete later if frontend can handle the error 
    if(!classId || !requestId || response == null){
      return next(new Error("Please provide all the required fields"))
    }
    
    const classObj = await Class.findById(classId);

    const readerId = req.user._id; 
    const reader = await User.findById(readerId);
    //currently, since there is only one role, "0" index array will be used. Considerations need to be done in the future. 
    const readerRole = reader.roles[0];
    const readerSchool = reader.schools[0];
    
    if(classObj == null){
      return next(new Error("Invalid Class"))
    }

    const request= await PendingRequest.findById({_id: requestId, status: "pending"});
    if(request == null){
      return next(new Error("Invalid Request Id"))
    }

    const requester = await User.findById(request.sender);
    let output = [];
    let content;
    let decision;

  

    if(readerRole == "admin"){
      switch(response){
        case true:
          //add the sender into class
          const newTeacher = classObj.teachers.push(request.sender);
          await classObj.save();

          //add the class into user profile
          const newClass = requester.classes.push(classId);
          await requester.save();

          //add the school into user profile
          const newSchool = requester.schools.push(readerSchool);
          await requester.save();

          // remove the request
          // await PendingRequest.findOneAndDelete({_id: requestId});
          await PendingRequest.findOneAndUpdate({_id: requestId}, {status:"accepted"})

          content = "teacher";
          decision = "accepted";
          output = null;
          // output = [newTeacher, newClass]
          break;

        case false:
          // await PendingRequest.findOneAndDelete({_id: requestId});
          await PendingRequest.findOneAndUpdate({_id: requestId}, {status:"rejected"})
          content = "teacher";
          decision = "rejected";

          output = []
          break;

        default:
          return next(new Error("Wrong response "))
      }
    }else if(readerRole == "teacher"){
      switch(response){
        case true:
          let newGuardian;
          let classGuardian;
          let newChild;
          let newSchool;
          
          // const classGuardian =  classObj.guardians.push(request.sender);

          //add the guardian into the student's guardian list if it is not added

          const studentName = request.studentName;
          const studentDOB = request.studentDOB;

          const student = await Student.findOne({name: studentName, dateofBirth: studentDOB});
          
          let guardianAlreadyAdded = false;
         
          while(guardianAlreadyAdded == false){
            student.guardians.forEach((guardian) => {
              if(guardian.toString() == request.sender.toString()){
                guardianAlreadyAdded = true;
              }
            })

            if(guardianAlreadyAdded == false){
              // newGuardian = student.guardians.push(requester)
              newGuardian = await Student.findOneAndUpdate(
                {_id: student._id},
                {"$push": {guardians: request.sender}}
              );
              guardianAlreadyAdded = true
            }
          }

          //add child to the guardian
          let childAlreadyAdded = false;

          while(childAlreadyAdded == false){
            requester.childern.forEach((child) => {
              if(child.toString() == student._id.toString()){
                childAlreadyAdded = true;
              }
            })

            if(childAlreadyAdded == false){

              // newChild = requester.childern.push(student)
              newChild = await User.findOneAndUpdate(
                {_id: request.sender},
                {"$push": {childern: student._id}}
              )
              childAlreadyAdded = true;
            }
          }

          //if the guardian is not already in class, push that again as well
          let classAlreadyAdded = false;

          while(classAlreadyAdded == false){
            requester.classes.forEach((eachClass) => {
              if(eachClass.toString()== classId.toString()){
                classAlreadyAdded = true;
              }
            })

            if(classAlreadyAdded == false){
              newChild = await User.findOneAndUpdate(
                {_id: request.sender},
                {"$push": {classes: classId}}
              )

              classAlreadyAdded = true;
            }
          }

          const classObj = await Class.findById(request.desireClass);

          let classAddGuardian = false;
          while(classAddGuardian == false){
            classObj.guardians.forEach((eachGuardian) => {
              if(eachGuardian.toString()== request.sender.toString()){
                classAddGuardian = true;
              }
            })

            if(classAddGuardian == false){
              //‌add the sender into the class's guardians
              classGuardian = await Class.findOneAndUpdate(
                {_id: classId},
                {"$push": {guardians: request.sender}}
              );
              // newGuardian = await User.findOneAndUpdate(
              //   {_id: request.sender},
              //   {"$push": {classes: classId}}
              // )

              classAddGuardian = true;
            }
          }
          

          let schoolAlreadyAdded = false;
          while(schoolAlreadyAdded == false){
            requester.schools.forEach((eachSchool) => {
              if(eachSchool.toString() == classObj.school.toString()){
                schoolAlreadyAdded = true
              }
            })

            if(schoolAlreadyAdded == false){
              newSchool = await User.findOneAndUpdate(
                {_id: request.sender},
                {"$push": {schools: classObj.school}}
              )

              schoolAlreadyAdded = true;
            }
          }

          //school is added in the student
          let studentAddSchool = false;
          while(studentAddSchool == false){
            student.schools.forEach((eachSchool) => {
              if(eachSchool.toString() == classObj.school.toString()){
                studentAddSchool = true
              }
            })

            if(studentAddSchool == false){
              newSchool = await Student.findOneAndUpdate(
                {_id: student._id},
                {"$push": {schools: classObj.school}}
              )

              studentAddSchool = true;
            }
          }

          let studentAddClass = false;
          while(studentAddClass == false){
            student.classes.forEach((eachClass) => {
              if(eachClass.toString() == classId.toString()){
                studentAddClass = true
              }
            })

            if(studentAddClass == false){
              newSchool = await Student.findOneAndUpdate(
                {_id: student._id},
                {"$push": {classes: classId}}
              )

              studentAddClass = true;
            }
          }

          //class is added in the student
          
          //delete the request
          // await PendingRequest.findOneAndDelete({_id: requestId});
          await PendingRequest.findOneAndUpdate({_id: requestId}, {status:"accepted"})

          content = "guardian";
          decision = "accepted";
          output = [classGuardian, newGuardian, newChild, newSchool]
          break;

          case false:
            // await PendingRequest.findOneAndDelete({_id: requestId});
            await PendingRequest.findOneAndUpdate({_id: requestId}, {status:"rejected"})
            content = "guardian";
            decision = "rejected";
  
            output = []
            break;
  
          default:
            return next(new Error("Wrong response "))

      }
    }else{
      return next(new Error("You don't have any permission"))
    }

    fMsg(res, `${content} got ${decision}`, output, 200)

    
  }catch(error){
    next(error);
  }
}

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
    let alreadyInClass = checkArray(guardian.classes, classId);
    if(alreadyInClass == true){
      return fError(res, "Guardian has already joined the class", 505)
    }

    

    const studentName = request.studentName;
    const studentDOB = request.studentDOB;
    const student = await Student.findOne({name: studentName, dateofBirth: studentDOB});
  }catch(error){
    next(error)
  }
}