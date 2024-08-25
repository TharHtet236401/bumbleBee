import { fMsg } from "../utils/libby.js";
import User from "../models/user.model.js";

export const createClass = async(req, res) => {
    try{
        const { grade, className } = req.body;
        const user = await User.findById(req.user_id);
        //here need to check which school the user is creating account from. 
        const school = await User.findById(req.schools);
        
    }catch(err){
        fMsg(res, "error in creating class", error)
    }
}