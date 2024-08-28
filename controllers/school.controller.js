import School from "../models/school.model.js";
import User from "../models/user.model.js";
import { fMsg } from "../utils/libby.js";

export const createSchool = async (req, res) => {
  try {
    // Get the current user from the request
    const currentUser = req.user;
    if (!currentUser) {
      return fMsg(res, "User not authenticated", null, 401);
    }

    // Extract school details from the request body
    const { schoolName, address, phone, email } = req.body;
    if (!schoolName || !address || !phone || !email) {
      return fMsg(res, "All fields are required", null, 400);
    }

    // Check if the school already exists
    const school = await School.findOne({ schoolName });
    if (school) {
      return fMsg(res, "School already exists", null, 400);
    }

    // Find the user in the database
    const userDb = await User.findById(currentUser._id);
    if (!userDb) {
      return fMsg(res, "User not found", null, 404);
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
    fMsg(res, "Error in creating school", error, 500);
  }
};

export const editSchool = async (req, res) => {
  try {
    // Extract data from request body
    const { schoolName, address, phone, email } = req.body;
    const currentUser = req.user;

    // Check if user is authenticated
    if (!currentUser) {
      return fMsg(res, "User not authenticated", null, 401);
    }

    // Find the user in the database
    const userDb = await User.findById(currentUser._id);
    if (!userDb) {
      return fMsg(res, "User not found", null, 404);
    }

    // Get the school ID from the user's schools array
    const schoolId = userDb.schools[0];

    // Find the school by ID
    const school = await School.findById(schoolId);
    if (!school) {
      return fMsg(res, "School not found", null, 404);
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

export const getSchool = async (req, res) => { //get the school info based on the user's school id
  try {
    const currentUser_id = req.user._id;
    const userObj = await User.findById(currentUser_id);
    const schoolId = userObj.schools[0];
    const school = await School.findById(schoolId);
    if (!school) {
      return fMsg(res, "School not found", null, 404);
    }
    fMsg(res, "School fetched successfully", school, 200);
  } catch (error) {
    fMsg(res, "error in fetching school", error, 500);
  }
};