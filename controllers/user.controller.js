import User from "../models/user.model.js";
import { fileURLToPath } from "url";
import { fMsg, paginate } from "../utils/libby.js";
import fs from "fs";
import path from "path";
import { deleteFile } from "../utils/libby.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const updateUserInfo = async (req, res) => {
    try {
        const userId = req.user._id;
        const userInfo = await User.findById(userId);
        const username = req.body.userName;
        if (username && (req.file == undefined || req.file == null)) {
            const oldPath = path.join(__dirname, "..", userInfo.profilePicture);

            fs.access(oldPath, fs.constants.F_OK, (err) => {
                if (err) {
                    console.log("Path does not exist");
                    fMsg(res, "Path does not exist", err, 500);
                } else {
                    deleteFile(oldPath)
                }
            });
            const encodedUsername = encodeURIComponent(username);
            req.body.profilePicture = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedUsername}`;
        } else if (req.file) {
            req.body.profilePicture = `/uploads/profile_pictures/${req.file.filename}`;
        } 

        const user = await User.findByIdAndUpdate(
            userId,
            {
                ...req.body,
            },
            { new: true }
        );
        fMsg(res, "User updated successfully", user, 200);
    } catch (error) {
        console.log(error);
        fMsg(res, "error in updating user", error, 500);
    }
};

export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findByIdAndDelete(userId);
        fMsg(res, "User deleted successfully", user, 200);
    } catch (error) {
        console.log(error);
        fMsg(res, "error in deleting user", error, 500);
    }
};

export const getAllUsers = async (req, res) => {
    //admin function
    try {
        const currentUser = req.user;
        const admin = await User.findById(currentUser._id);

        if (!admin) {
            return fMsg(res, "Admin not found", [], 404);
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
        fMsg(res, "Error in fetching users", error, 500);
    }
};
