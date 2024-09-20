import path from "path";
import { fileURLToPath } from "url";

import User from "../models/user.model.js";

import { deleteFile } from "../utils/libby.js";

import { encode, genToken, fMsg, decode } from "../utils/libby.js";

import { uploadImageToSupabase } from "../utils/supabaseUpload.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const register = async (req, res, next) => {
  try {
    let {
      userName,
      email,
      password,
      phone,
      confirmedPassword,
      roles,
      ...otherInfos
    } = req.body;

    const findEmail = await User.findOne({ email });
    const findPhone = await User.findOne({ phone });
    if (findEmail) {
      return next(new Error("Email already exists"));
    }
    if (findPhone) {
      return next(new Error("Phone number already exists"));
    }
    const encodedUsername = encodeURIComponent(userName);

    let profilePicture;

    if (req.file) {
      // if the user uploaded a profile picture, upload it to Supabase
      try {
        profilePicture = await uploadImageToSupabase(
          req.file,
          "profile-pictures"
        );
      } catch (uploadError) {
        return next(
          new Error(`Profile picture upload failed: ${uploadError.message}`)
        );
      }
    } else {
      // if the user did not upload a profile picture, generate a Dicebear avatar
      profilePicture = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedUsername}`;
    }

    if (password !== confirmedPassword) {
      return next(new Error("Passwords do not match"));
    }

    const hashedPassword = encode(password);

    const newUser = {
      userName,
      email,
      password: hashedPassword,
      profilePicture,
      phone,
      roles,
      ...otherInfos,
    };

    const user = await User.create(newUser);

    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    const toEncrypt = {
      _id: user._id,
      roles: user.roles,
      email: user.email,
    };

    const token = genToken(toEncrypt);

    fMsg(
      res,
      "Registered Successfully",
      { user: userWithoutPassword, token },
      200
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  // Handles user login by verifying email and password
  try {
    const { email, password } = req.body;

    // if the email or password is not provided, return an error message
    //might delete later if the front end can handle the error message
    if (!email || !password) {
      return next(new Error("Email and password are required"));
    }

    //search the user in the database by email
    const user = await User.findOne({ email });
    if (!user) {
      return next(new Error("Invalid username or password"));
    }

    //check if the password is correct and decode the password
    const isMatch = decode(password, user.password);

    if (!isMatch) {
      return next(new Error("Invalid username or password"));
    }

    // this is to encrypt the user id and create a token
    const toEncrypt = {
      _id: user._id,
      roles: user.roles,
      email: user.email,
    };

    //this is to create a token
    const token = genToken(toEncrypt);

    // destructure the user object to remove the password field
    const { password: _, ...userInfo } = user.toObject();

    //this is to send the response and token to the client-frontend and save in local storage
    fMsg(res, "Login Successfully", { userInfo, token }, 200);
  } catch (error) {
    next(error);
  }
};

export const passwordReset = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    if (!email.trim() || !newPassword.trim()) {
      return next(new Error("All fields are required"));
    }
    const user = await User.findOne({ email });

    if (!user) {
      return next(new Error("User not found"));
    }

    const hashedPassword = encode(newPassword);

    await User.updateOne({ email }, { password: hashedPassword });

    fMsg(res, "Password reset successful", "Password has been reset", 200);
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { email } = req.user;

    const { oldPassword, newPassword, confirmedNewPassword } = req.body;

    //might delete later if the front end can handle the error message
    if (
      !email.trim() ||
      !oldPassword.trim() ||
      !newPassword.trim() ||
      !confirmedNewPassword.trim()
    ) {
      return next(new Error("All fields are required"));
    }

    //might delete later if the front end can handle the error message
    if (newPassword !== confirmedNewPassword) {
      return next(
        new Error("New password and confirmed new password do not match")
      );
    }

    const user = await User.findOne({ email });
    if (!user) {
      return next(new Error("User not found"));
    }

    const isMatch = decode(oldPassword, user.password);

    if (!isMatch) {
      return next(new Error("Invalid old password"));
    }

    if (newPassword !== confirmedNewPassword) {
      return next(
        new Error("New password and confirmed new password do not match")
      );
    }

    //might delete later if the front end can handle the error message
    if (newPassword === oldPassword) {
      return next(new Error("New password and old password are the same"));
    }

    const hashedPassword = encode(newPassword);

    await User.updateOne({ email }, { password: hashedPassword });

    fMsg(res, "Password change successful", "Password has been changed", 200);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res) => {
  try {
    // Since JWT is stateless, we don't need to invalidate the token on the server
    // The actual "logout" happens on the client-side by removing the token
    // For now, we'll just send a success message
    fMsg(res, "Logout successful", "User has been logged out", 200);
  } catch (error) {
    next(error);
  }
};

//note
//acutually we dont have to generate token for both login and register, it may depend on the workflow of UI but discuss later ..But i have created both but will delete one base on discussion

//note
