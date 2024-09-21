import School from "../models/school.model.js";
import Class from "../models/class.model.js";
import User from "../models/user.model.js";
import Student from "../models/student.model.js";
import { fMsg } from "../utils/libby.js";


//this function creates a new school and adds it to the user's(which is the admin) schools array
export const createSchool = async (req, res, next) => {
  try {
    // Get the current user from the token
    const currentUser = req.user;
    
    // Extract school details from the request body
    //might delete this later when the frontend can handle errors
    const { schoolName, address, phone, email } = req.body;
    if (!schoolName || !address || !phone || !email) {
      return next(new Error("All fields are required"))
    }

    // Check if the school already exists
    const school = await School.findOne({ schoolName , email});
    if (school) {
      return next(new Error("School already exists"))
    }

    // Find the user in the database
    const userDb = await User.findById(currentUser._id);
    if (!userDb) {
      return next(new Error("User not found"))
    }

    // Create a new school
    const newSchool = await School.create({
      schoolName,
      address,
      phone,
      email,
    });

    // Add the new school to the user's (which is adminschools array
    userDb.schools.push(newSchool._id);
    await userDb.save();
    fMsg(res, "School created successfully", newSchool, 200);
  } catch (error) {
    // Log the error for debugging
    console.error(error);
    next(error);
  }
};


//this functions edits the school info of the user's school which is one of admin's function
export const editSchool = async (req, res, next) => {
  try {
    // Extract data from request body
    const { schoolName, address, phone, email } = req.body;
    const currentUser = req.user;
    // Find the user in the database
    const userDb = await User.findById(currentUser._id);
    if (!userDb) {
      return next(new Error("User not found"))
    }

    // Get the school ID from the user's schools array
    const schoolId = userDb.schools[0];

    // Find the school by ID
    const school = await School.findById(schoolId);
    if (!school) {
      return next(new Error("School not found"))
    }

    // Update the school details
    const updatedSchool = await School.findByIdAndUpdate(
      schoolId,
      {
        schoolName,
        address,
        phone,
        email,
      },
      { new: true }
    );

    // Respond with success message
    fMsg(res, "School updated successfully", updatedSchool, 200);
  } catch (error) {
    // Handle errors
    next(error);
  }
};

// export const getSchool = async (req, res) => { //get the school info based on the user's school id
//   try {
//     const currentUser_id = req.user._id;
//     const userObj = await User.findById(currentUser_id);
//     const schoolId = userObj.schools[0];
//     const school = await School.findById(schoolId);
//     if (!school) {
//       return fMsg(res, "School not found", null, 404);
//     }
//     fMsg(res, "School fetched successfully", school, 200);
//   } catch (error) {
//     fMsg(res, "error in fetching school", error, 500);
//   }
// };


//this function gets all the schools associated with the user
export const getSchool = async (req, res, next) => { 
  try {
    const currentUser_id = req.user._id;
    const userObj = await User.findById(currentUser_id);
    
    // Check if the user has associated schools
    if (!userObj.schools || userObj.schools.length === 0) {
      return next(new Error("No associated schools found"))
    }

    // Fetch all schools associated with the user
    const schools = await School.find({ _id: { $in: userObj.schools } });

    fMsg(res, "Schools fetched successfully", schools, 200);
  } catch (error) {
    next(error);
  }
};

export const deleteSchool = async (req, res, next) => {
  try {
    const currentUser_id = req.user._id;
    const userObj = await User.findById(currentUser_id);

    //get the school id from the user's(admin) schools array by means of token
    const schoolId = userObj.schools[0];
    const school = await School.findById(schoolId);
    if (!school) {
      return next(new Error("School not found"))
    }

    //remove the school id from the user's(admin) schools array
    userObj.schools.pull(schoolId);
    await userObj.save();

    // Delete all classes associated with the school
    await Promise.all(
      school.classes.map((classId) => 
        Class.findByIdAndDelete(classId))
    );
 
    // Delete all students associated with the school if the student only joins one school
    //or else remove the school id from the student's school array
    const  toDeleteStudents = await Student.find({ schools: schoolId });
    if(toDeleteStudents.length === 1){//which means the student only joins one school
      await Promise.all(
        toDeleteStudents.map((student) => 
        Student.findByIdAndDelete(student._id))
      );
    }
    else{//which means the student joins more than one school
      Student.updateMany({ schools: schoolId }, { $pull: { schools: schoolId } });
    }

    //for the teacher condtion , the teacher can join only one school
    const toDeleteTeachers = await User.find({ schools: schoolId });
    await Promise.all(
      toDeleteTeachers.map((teacher) => 
        User.findByIdAndDelete(teacher._id))
    );
    
    // Delete the school
    await School.findByIdAndDelete(schoolId);
    fMsg(res, "School deleted successfully", school, 200);
  } catch (error) {
    next(error);
  }
};