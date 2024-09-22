import PendingRequest from "../models/pendingRequest.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import User from "../models/user.model.js";
import { fMsg } from "../utils/libby.js";
import mongoose from "mongoose";

//this function is for the guardian to create a request to join the class with classCode, childName, studentDOB
//this function is also for the teacher to create a request to join the class with classCode
export const createRequest = async (req, res, next) => {
  // When the guardian and the teacher want to join the class
  try {
    const { classCode, childName, studentDOB } = req.body;



    const currentUser = await User.findById(req.user._id)

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

    //to add the student to the guardian and the class , but it will work only if the teacher accpet the request , so i just comment it
    // if(req.user.roles.includes("guardian")){
    //     const guardian = await User.findById(userId)

    //     if(!guardian.childern.includes(student_id)){
    //         guardian.childern.push(student_id)

    //         guardian.classes.push(desireClass._id)
    //         await guardian.save()

    // Check if the user already has a  request for this class
    // that will find the pending request for the same class
    const existingRequest = await PendingRequest.findOne({
      sender: userId,//the user id will differ if there are duplicate student with name and DOB
      desireClass: desireClass._id,
      studentName: childName,
      studentDOB: studentDOB
    });

    if (existingRequest) {
      return next(new Error("Request already exists"))
    }

    // let student;
    // if(childName != null && studentDOB != null){
    //   student = await Student.find({name: childName, dateofBirth: studentDOB});
    // }

    // console.log("user.classes: " + user.classes + "\ntype of user.classes: " + typeof user.classes + "\ndesiredClassid: " + desireClass._id + "\ndesiredClass type:" + typeof desireClass._id)
    //check whether the class has already been joined

    // for(let eachClass of user.classes){
    //   console.log("each Class is " + eachClass)
    //   if(eachClass.toString() == desireClass._id.toString()){

        //There can be error in the future, if the user has both role of teacher and parent.

        //TWIN SCENARIO need further considerations
        // let requestDuplicate = true;

        //   if(user.roles.includes("guardian")){
        //     let studentCheck = false;
        //     while(studentCheck == false){
        //       if(user.childern == null){
        //         studentCheck = true;
        //         requestDuplicate = false;
        //       }

        //       for(let eachChild of user.childern){
        //         if(eachChild == student){
        //           return fMsg(res, "Your child is already in the class", null, 400)
        //         }
        //       }
        //       studentCheck = true;
        //       requestDuplicate = false;
        //     }
        //   }
        
        // if(requestDuplicate == true){
        //   return fMsg(res, "User has already joined this class", null, 400)
        // }

    //     return fMsg(res, "User has already joined this class", null, 400)
    //   }
    // }

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


// this function is for the teacher to read the requests for the guardian
//this function is also for the admin to read the requests for the teacher
export const readRequest = async (req, res, next)=> {
  try{

    //input from the front end which student's guardian requests the teacher wants to see
    //or the teacher's request  whichh the admim wants to see the respective requests
    const { classId, studentId }  = req.body;
    const readerId = req.user._id; 
    const reader = await User.findById(readerId);


    //for both teacher and admin, the classId is required
    if(classId == null){
      return next(new Error("Please provide all the required fields"))
    }

    //as a role of teacher to read the requests for the guardian, he/she will provide to know the studentId to know that student's guardian requests
    if(req.user.roles.includes("teacher")){
      if(!studentId){
        return next(new Error("Please provide all the required fields"))
      }
    }

    const classObj = await Class.findById(classId)

    if(!classObj){
      return next(new Error("Class not found"))
    }

    const classCode = classObj.classCode;

    

    //currently, since there is only one role, "0" index array will be used. Considerations need to be done in the future. 
    const readerRole = reader.roles[0];

    let requestsType;
    let requests;
    let classCodes = [];
    
    if(readerRole == "admin"){ // the reader is admin , the requests are for the teacher
      requestsType = "Teacher";
      requests = await PendingRequest.find({roles: ['teacher'], classCode: classCode, status: "pending"});
      // console.log(requests)
    } 
    //only the teacher, who is responsible for the class should be viewing the class
    else{ // the reader is teacher , the requests are for the guardian
      const teacher = await User.findOne({_id: readerId, roles: ['teacher']})
      
      if(teacher == null) {
        return next(new Error("You do not have permission to read"))
      }
      if(teacher.classes == []){
        return next(new Error("You do not have permission to read"))
      }

      if(studentId == null){
        return next(new Error("Something went wrong with student Id"))
      }
      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return next(new Error("Invalid student Id"))
      }
      const student = await Student.findById(studentId)
      if(student == null){
        return next(new Error("There is no such student "))
      }
      
      
      let classVerify = false;
      //this block checks whether the teacher is responsible for the class
      while(classVerify == false){
        //change into for loop
        teacher.classes.forEach((eachClass) => {
          if(eachClass.toString() === classId.toString()){
            classVerify = true;
          }
          
        })
        if(classVerify != true){
          return next(new Error("You do not have permission to read"))
        }
      }
      requestsType = "Guardian"
      let pendingRequests = await PendingRequest.find({roles: ['guardian'], desireClass: classId, status: "pending"});
      // console.log(pendingRequests)

      let requestCondition = false;
      while(requestCondition == false){
        for(const eachRequest of pendingRequests){
          // console.log(eachRequest.studentDOB === student.dateofBirth)
          if(eachRequest.studentName == student.name && eachRequest.studentDOB.toString() == student.dateofBirth.toString()){
            requests = await PendingRequest.find({roles: ['guardian'], desireClass: classId, studentName: student.name, studentDOB: student.dateofBirth, status: "pending"});
            // console.log("This is requests: " + requests);
            requestCondition = true;
          }
        }
        if(requestCondition == false){
          return next(new Error("There are no requests for this student at the moment"))
        }
      }

    }

    if(requests.length === 0){
      return next(new Error("There are no requests at the moment"))
    }

    fMsg(res, `${requestsType} requests`, requests, 200);

  }catch(error){
    next(error);
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
    const readerEmail = reader.email;
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
            console.log("Student Object " + student)
            student.guardians.forEach((guardian) => {
              console.log("Each Guardian: " + guardian + "\nRequester id: (Probably Not) " + requester + "\nRequester Id: " + request.sender)
              if(guardian.toString() == request.sender.toString()){
                console.log("There is already guardian in the student")
                guardianAlreadyAdded = true;
              }
            })

            if(guardianAlreadyAdded == false){
              console.log("student guardians? " + student.guardians)
              // newGuardian = student.guardians.push(requester)
              newGuardian = await Student.findOneAndUpdate(
                {_id: student._id},
                {"$push": {guardians: request.sender}}
              );
              guardianAlreadyAdded = true
              console.log("New Guardian" + newGuardian)
            }
          }

          //add child to the guardian
          let childAlreadyAdded = false;

          while(childAlreadyAdded == false){
            requester.childern.forEach((child) => {
              if(child.toString() == student._id.toString()){
                console.log("there is already child")
                childAlreadyAdded = true;
              }
            })

            if(childAlreadyAdded == false){

              // newChild = requester.childern.push(student)
              newChild = await User.findOneAndUpdate(
                {_id: request.sender},
                {"$push": {childern: student._id}}
              )
              console.log("child is being created " + newChild)
              childAlreadyAdded = true;
            }
          }

          //if the guardian is not already in class, push that again as well
          let classAlreadyAdded = false;

          while(classAlreadyAdded == false){
            requester.classes.forEach((eachClass) => {
              if(eachClass.toString()== classId.toString()){
                console.log("there is already class")
                classAlreadyAdded = true;
              }
            })

            if(classAlreadyAdded == false){
              console.log("class is added ")
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
                console.log("there is already guardian")
                classAddGuardian = true;
              }
            })

            if(classAddGuardian == false){
              console.log("guardian is added ")
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
                console.log("there is already school")
                schoolAlreadyAdded = true
              }
            })

            if(schoolAlreadyAdded == false){
              console.log("school is added")
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
                console.log("there is already school for student")
                studentAddSchool = true
              }
            })

            if(studentAddSchool == false){
              console.log("school is added to student")
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
                console.log("there is already class for student")
                studentAddClass = true
              }
            })

            if(studentAddClass == false){
              console.log("class is added to student")
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