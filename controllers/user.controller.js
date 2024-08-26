import User from "../models/user.model.js";
import { fMsg,paginate} from "../utils/libby.js";

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

export const deleteUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User
            .findByIdAndDelete(userId);
        fMsg(res, "User deleted successfully", user, 200);
    }
    catch (error) {
        console.log(error)
        fMsg(res, "error in deleting user", error, 500);
    }
}

export const getAllUsers = async (req, res) => {  //admin function
    try {
        const currentUser = req.user;
        const admin = await User.findById(currentUser._id);

        if (!admin) {
            return fMsg(res, "Admin not found", [], 404);
        }

        const usersSchoolId = admin.schools[0]; // Fetching usersSchoolId here

        const page = parseInt(req.query.page) || 1;


        const paginatedData = await paginate(User, { schools: usersSchoolId }, page, 10);

        // Return paginated response
        fMsg(res, "Users fetched successfully", paginatedData, 200);
    } catch (error) {
        fMsg(res, "Error in fetching users", error, 500);
    }
};

