import { fMsg } from "../utils/libby.js";
import User from "../models/user.model.js";
import { generateClassCode } from "../utils/libby.js";

export const createClass = async(req, res) => {
    try{
        const { grade, className } = req.body;
        const user = await User.findById(req.user._id);
        // const school = user.schools;

        console.log("this is user's school " + JSON.stringify(user));

        //generate the class code with 4 digits.
        const code = generateClassCode(4);
        
    }catch(err){
        fMsg(res, "error in creating class", error)
    }
}