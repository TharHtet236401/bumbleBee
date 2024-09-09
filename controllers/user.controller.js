import User from "../models/user.model.js";
import { fileURLToPath } from "url";
import { fMsg, paginate, deleteFile } from "../utils/libby.js";
import fs from "fs";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const updateUserInfo = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const userInfo = await User.findById(userId);
        const username = req.body.userName;
        const oldPath = path.join(__dirname, "..", userInfo.profilePicture);


        if (username && (req.file == undefined || req.file == null)) {
            try {
                await fs.promises.access(oldPath, fs.constants.F_OK);
                // user has a profile picture, only username is updated
                // do nothing
                console.log(`${oldPath} exists`);
                deleteFile(oldPath);
                const encodedUsername = encodeURIComponent(username);
                req.body.profilePicture = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedUsername}`;
            } catch (err) {
                // user does not have a profile picture
                console.log(`${oldPath} does not exist`);
                const encodedUsername = encodeURIComponent(username);
                req.body.profilePicture = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedUsername}`;
                console.log(req.body.profilePicture);
            }
        } else if (!username && (req.file == undefined || req.file == null)) {
            const user = await User.findById(userId);
            const encodedUsername = encodeURIComponent(user.userName);
            req.body.profilePicture = `https://api.dicebear.com/9.x/initials/svg?seed=${encodedUsername}`
        }
        else if ( req.file != undefined || req.file != null) {
            // user is updating profile picture
            try {
                await fs.promises.access(oldPath, fs.constants.F_OK);
                console.log(`${oldPath} exists`);
                deleteFile(oldPath);
                req.body.profilePicture = `/uploads/profile_pictures/${req.file.filename}`;
            } catch(err) {

                req.body.profilePicture = `/uploads/profile_pictures/${req.file.filename}`;
            }

        }

        const user = await User.findByIdAndUpdate(
            userId,
            { ...req.body },
            { new: true }
        );

        console.log(user);
        fMsg(res, "User updated successfully", user, 200);
    } catch (error) {
        console.log(error);
        next(error);
    }
};


export const deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findByIdAndDelete(userId);
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
        next(error);
    }
};
