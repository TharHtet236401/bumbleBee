import User from "../models/user.model.js";
import { fMsg, fError } from "../utils/libby.js";
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} from "../utils/supabaseUpload.js";
import { paginate } from "../utils/libby.js";

// Fetches the current user's profile with their schools, classes, and children information to show in profile page page

export const getMyProfile = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const user = await User.findById(currentUser._id)
      .select("-password")
      .populate({ path: "schools", select: "schoolName" })
      .populate({ path: "classes", select: "className grade" })
      .populate({ path: "childern", select: "name dateOfBirth" });
    fMsg(res, "User fetched successfully", user, 200);
  } catch (error) {
    next(error);
  }
};

//this function is to fetch the related users to chat .. like other users within the same class.
export const getUsersForChat = async (req, res, next) => {
  try {
    // Get current user with populated classes
    const currentUser = await User.findById(req.user._id)
      .populate({
        path: "classes",
        select: "-messages -school -grade -className -announcements",
        populate: [
          {
            path: "teachers",
            select: "userName",
          },
          {
            path: "guardians",
            select: "userName",
          },
        ],
      })
      .select("classes");

    const classes = currentUser.classes;

    // Return populated class data
    fMsg(res, "Classes fetched successfully", classes, 200);
  } catch (error) {
    next(error);
  }
};

//this function is to search for users within the same class
export const searchUser = async (req, res, next) => {
  try {
    const searchingName = req.query.userName;
    // console.log("Searching for:", searchingName);

    // Get current user with populated classes, including teachers and guardians
    const currentUser = await User.findById(req.user._id).populate({
      path: "classes",
      populate: [
        {
          path: "teachers",
          select: "userName _id profilePicture",
        },
        {
          path: "guardians",
          select: "userName _id profilePicture",
        },
      ],
    });

    if (!currentUser || !currentUser.classes) {
      return fMsg(res, "No classes found", [], 200);
    }

    // Create a case-insensitive regex pattern that matches the search term
    const searchRegex = new RegExp(searchingName.replace(/\s+/g, ""), "i");

    let matchingUsers = [];

    // Loop through each class
    for (const classObj of currentUser.classes) {
      // Search through teachers if they exist
      if (classObj.teachers && Array.isArray(classObj.teachers)) {
        const matchingTeachers = classObj.teachers.filter(
          (teacher) =>
            teacher._id.toString() !== currentUser._id.toString() && // Exclude current user
            searchRegex.test(teacher.userName.replace(/\s+/g, ""))
        );
        matchingUsers = [...matchingUsers, ...matchingTeachers];
      }

      // Search through guardians if they exist
      if (classObj.guardians && Array.isArray(classObj.guardians)) {
        const matchingGuardians = classObj.guardians.filter(
          (guardian) =>
            guardian._id.toString() !== currentUser._id.toString() && // Exclude current user
            searchRegex.test(guardian.userName.replace(/\s+/g, ""))
        );
        matchingUsers = [...matchingUsers, ...matchingGuardians];
      }
    }

    // Remove duplicates by user ID
    matchingUsers = Array.from(
      new Set(matchingUsers.map((user) => user._id.toString()))
    ).map((id) => matchingUsers.find((user) => user._id.toString() === id));

    return fMsg(res, "Users found successfully", matchingUsers, 200);
  } catch (error) {
    console.error("Search error:", error);
    return fError(res, error.message, 500);
  }
};

export const updateUserInfo = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userInfo = await User.findById(userId);
    const newUsername = req.body.userName;

    let profilePicture = userInfo.profilePicture;

    if (req.file) {
      try {
        // Delete old profile picture from Supabase if the profilePicture exists and is not a Dicebear avatar
        if (
          userInfo.profilePicture &&
          !userInfo.profilePicture.startsWith("https://api.dicebear.com")
        ) {
          await deleteImageFromSupabase(
            userInfo.profilePicture,
            "profile-pictures"
          );
        }

        // Upload new profile picture
        profilePicture = await uploadImageToSupabase(
          req.file,
          "profile-pictures"
        );
      } catch (uploadError) {
        return next(
          new Error(`Profile picture update failed: ${uploadError.message}`)
        );
      }
    } else if (
      newUsername &&
      newUsername !== userInfo.userName &&
      userInfo.profilePicture.startsWith("https://api.dicebear.com")
    ) {
      // Only update Dicebear avatar if username changed and current picture is a Dicebear avatar (not supabase link)
      const encodedUsername = encodeURIComponent(newUsername);
      profilePicture = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedUsername}`;
    }
    // If no new file and not a Dicebear avatar, keep the existing profile picture

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        profilePicture,
      },
      { new: true }
    );

    fMsg(res, "User updated successfully", updatedUser, 200);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId);

    if (!user) {
      return next(new Error("User not found"));
    }

    // Delete profile picture from Supabase if it exists and is not a Dicebear avatar
    if (
      user.profilePicture &&
      !user.profilePicture.startsWith("https://api.dicebear.com")
    ) {
      try {
        await deleteImageFromSupabase(user.profilePicture, "profile-pictures");
      } catch (deleteError) {
        console.error(
          "Error deleting profile picture from Supabase:",
          deleteError
        );
      }
    }

    // Delete the user from the database
    await User.findByIdAndDelete(userId);

    fMsg(res, "User deleted successfully", user, 200);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  //admin function
  try {
    const currentUser = req.user;
    const admin = await User.findById(currentUser._id);

    if (!admin) {
      return next(new Error("Admin not found"));
    }

    const usersSchoolId = admin.schools[0]; // Fetching usersSchoolId here

    const page = parseInt(req.query.page) || 1;

    const paginatedData = await paginate(
      User,
      { schools: usersSchoolId },
      page,
      10
    );

    // Return paginated response
    fMsg(res, "Users fetched successfully", paginatedData, 200);
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return next(new Error("User not found"));
    }
    fMsg(res, "User fetched successfully", user, 200);
  } catch (error) {
    next(error);
  }
};
