import School from "../models/school.model.js";
import User from "../models/user.model.js";
import { fMsg } from "../utils/libby.js";

export const createSchool = async (req, res, next) => {
  try {
    // Get the current user from the request
    const currentUser = req.user;
    if (!currentUser) {
      return next(new Error("User not authenticated"))
    }

    // Extract school details from the request body
    const { schoolName, address, phone, email } = req.body;
    if (!schoolName || !address || !phone || !email) {
      return next(new Error("All fields are required"))
    }

    // Check if the school already exists
    const school = await School.findOne({ schoolName });
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

    // Add the new school to the user's schools array
    userDb.schools.push(newSchool._id);
    await userDb.save();
    fMsg(res, "School created successfully", newSchool, 200);
  } catch (error) {
    // Log the error for debugging
    console.error(error);
    next(error);
  }
};

export const editSchool = async (req, res, next) => {
  try {
    // Extract data from request body
    const { schoolName, address, phone, email } = req.body;
    const currentUser = req.user;

    // Check if user is authenticated
    if (!currentUser) {
      return next(new Error("User not authenticated"))
    }

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
    fMsg(res, "error in updating school", error, 500);
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

    if (schools.length === 0) {
      return next(new Error("No schools found"))
    }

    fMsg(res, "Schools fetched successfully", schools, 200);
  } catch (error) {
    next(error);
  }
};
