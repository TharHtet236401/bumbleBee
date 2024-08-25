import { fMsg } from "../utils/libby.js";
import User from "../models/user.model.js";
import School from "../models/school.model.js";
import { generateClassCode } from "../utils/libby.js";

export const createClass = async(req, res) => {
    try{
        const { grade, className } = req.body;
        const user = await User.findById(req.user._id);
        // const school = user.schools[0];
        const school = await School.findById(user.schools[0]);
        let classLists = [];
        classLists = school.classes;

        console.log("this is user's school " + classLists.length);

        //generate the class code with 4 digits.
        const code = generateClassCode(4);
        
    }catch(err){
        fMsg(res, "error in creating class", error)
    }
}