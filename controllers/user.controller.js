import User from "../models/user.model.js";
import { fMsg } from "../utils/libby.js";
import {
  uploadImageToSupabase,
  deleteImageFromSupabase,
} from "../utils/supabaseUpload.js";

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
    if (user.profilePicture && !user.profilePicture.startsWith('https://api.dicebear.com')) {
      try {
        await deleteImageFromSupabase(user.profilePicture, 'profile-pictures');
      } catch (deleteError) {
        console.error("Error deleting profile picture from Supabase:", deleteError);
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

export const getAllUsers = async (req, res) => {
  //admin function
  try {
    const currentUser = req.user;
    const admin = await User.findById(currentUser._id);

    if (!admin) {
      return next(new Error("Admin not found"))
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
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return next(new Error("User not found"));
    }
    fMsg(res, "User fetched successfully", user, 200);
  } catch (error) {
    next(error);
  }
}
