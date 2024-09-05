import path from "path";
import { fileURLToPath } from "url";

import User from "../models/user.model.js";

import { deleteFile } from "../utils/libby.js";

import { encode, genToken, fMsg, decode } from "../utils/libby.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const register = async (req, res) => {
    // Handles user registration by creating a new user in the database
    try {

        let {
            userName,
            email,
            password,
            phone,
            confirmedPassword,
            profilePicture,
            roles,
            ...otherInfos
        } = req.body;

        const encodedUsername = encodeURIComponent(userName);


        profilePicture = req.file
            ? `/uploads/profile_pictures/${req.file.filename}`
            : `https://api.dicebear.com/9.x/initials/svg?seed=${encodedUsername}`;

        
        if (password !== confirmedPassword) {
            return fMsg(
                res,
                "Registration failed",
                "Passwords do not match",
                400
            );
        }

        //you can use bcrypt to hash the password that encode function can be found in utils/libby.js
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
        // console.log(req.body)
        //save the new user to the database
        const user = await User.create(newUser);

        // Remove the password from the user object before sending the response
        const userWithoutPassword = user.toObject();
        delete userWithoutPassword.password;

        //this is to encrypt the user id and create a token
        const toEncrypt = {
            _id: user._id,
            roles: user.roles,
            email: user.email,
        };

        //this is to create a token
        const token = genToken(toEncrypt);

        //this is to send the response and token to the client-frontend and save in local storage
        fMsg(
            res,
            "Registered Successfully",
            { user: userWithoutPassword, token },
            201
        );
    } catch (error) {
        console.log(error);
        if (req.file) {
            const oldFilePath = path.join(__dirname, "..", req.file.path);
            deleteFile(oldFilePath);
        }
        fMsg(res, "Registration failed", error.message, 500);
    }
};

export const login = async (req, res) => {
    // Handles user login by verifying email and password
    try {
        const { email, password } = req.body;

        // if the email or password is not provided, return an error message
        if (!email || !password) {
            return fMsg(
                res,
                "Login failed",
                "Email and password are required",
                400
            );
        }

        //search the user in the database by email
        const user = await User.findOne({ email });
        if (!user) {
            return fMsg(
                res,
                "Login failed",
                "Invalid username or password",
                404
            );
        }

        //check if the password is correct and decode the password
        const isMatch = decode(password, user.password);

        if (!isMatch) {
            return fMsg(
                res,
                "Login failed",
                "Invalid username or password",
                400
            );
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
        fMsg(res, "Login failed", error.message, 500);
    }
};

export const passwordReset = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email.trim() || !newPassword.trim()) {
            return fMsg(
                res,
                "Password reset failed",
                "Email and new password are required",
                400
            );
        }
        const user = await User.findOne({ email });

        if (!user) {
            return fMsg(res, "Password reset failed", "User not found", 404);
        }

        const hashedPassword = encode(newPassword);

        await User.updateOne({ email }, { password: hashedPassword });

        fMsg(res, "Password reset successful", "Password has been reset", 200);
    } catch (error) {
        fMsg(res, "Password reset failed", error.message, 500);
    }
};

export const changePassword = async (req, res) => {
    try {
        const { email } = req.user;

        const { oldPassword, newPassword, confirmedNewPassword } = req.body;

        if (
            !email.trim() ||
            !oldPassword.trim() ||
            !newPassword.trim() ||
            !confirmedNewPassword.trim()
        ) {
            return fMsg(
                res,
                "Password change failed",
                "Email, old password, new password and confirmed new password are required",
                400
            );
        }

        if(newPassword !== confirmedNewPassword){
            return fMsg(
                res,
                "Password change failed",
                "New password and confirmed new password do not match",
                400
            );
        }

        const user = await User.findOne({ email });
        if (!user) {
            return fMsg(res, "Password change failed", "User not found", 404);
        }

        const isMatch = decode(oldPassword, user.password);

        if (!isMatch) {
            return fMsg(
                res,
                "Password change failed",
                "Invalid old password",
                400
            );
        }

        if (newPassword !== confirmedNewPassword) {
            return fMsg(
                res,
                "Password change failed",
                "New password and confirmed new password do not match",
                400
            );
        }

        if (newPassword === oldPassword) {
            return fMsg(
                res,
                "Password change failed",
                "New password and old password are the same",
                400
            );
        }

        const hashedPassword = encode(newPassword);

        await User.updateOne({ email }, { password: hashedPassword });

        fMsg(res, "Password change successful", "Password has been changed", 200);
    } catch (error) {
        fMsg(res, "Password change failed", error.message, 500);
    }
};

export const logout = async (req, res) => {
    try {
        // Since JWT is stateless, we don't need to invalidate the token on the server
        // The actual "logout" happens on the client-side by removing the token
        // For now, we'll just send a success message
        fMsg(res, "Logout successful", "User has been logged out", 200);
    } catch (error) {
        fMsg(res, "Logout failed", error.message, 500);
    }
};

//note
//acutually we dont have to generate token for both login and register, it may depend on the workflow of UI but discuss later ..But i have created both but will delete one base on discussion

