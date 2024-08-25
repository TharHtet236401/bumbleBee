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

