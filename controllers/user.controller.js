import User from "../models/user.model.js";
import { fMsg } from "../utils/libby.js";

export const updateUserInfo = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findByIdAndUpdate(
            userId,
            {
                ...req.body,
            },
            { new: true }
        );
        fMsg(res, "User updated successfully", user, 200);
    } catch (error) {
        fMsg(res, "error in updating user", error, 500);
    }
}

export const getAllUsers = async (req, res) => { //admin function 
    try {
        // Get page and limit from query parameters with default values
        const currentUser = req.user;
        const admin = await User.findById(currentUser._id);
        console.log(admin);

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Calculate the number of documents to skip
        const skip = (page - 1) * limit;

        // Get total user count for pagination info
        const totalUsers = await User.countDocuments();
        const totalPages = Math.ceil(totalUsers / limit);

        // Check if requested page is within range
        if (page > totalPages) {
            return fMsg(res, `Page ${page} is out of range. Only ${totalPages} pages available.`, [], 404);
        }

        // Fetch paginated users from the database
        const users = await User.find().skip(skip).limit(limit);

        // Return paginated response
        fMsg(res, "Users fetched successfully", {
            users,
            totalUsers,
            totalPages,
            currentPage: page,
        }, 200);
    } catch (error) {
        fMsg(res, "Error in fetching users", error, 500);
    }
};
