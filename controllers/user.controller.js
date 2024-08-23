import User from "../models/user.model.js";
import { fMsg } from "../utils/libby.js";

export const updateUserInfo = async (req, res) => {
    try {
        console.log(req.user)
        const userId = req.user._id;
        console.log({...req.body})
        const user = await User.findByIdAndUpdate(
            userId,
            {
                ...req.body,
            },
            { new: true }
        );
        fMsg(res, "User updated successfully", user);
    } catch (error) {
        fMsg(res, "error in updating user", error);
    }
}

