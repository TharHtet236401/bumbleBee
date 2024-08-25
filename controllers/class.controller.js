import { fMsg } from "../utils/libby.js";
import User from "../models/user.model.js";
import School from "../models/school.model.js";
import Class from "../models/class.model.js";
import { generateClassCode } from "../utils/libby.js";

export const createClass = async(req, res) => {
    try{
        const { grade, className } = req.body;
        const user = await User.findById(req.user._id);  //find the user
        const school = await School.findById(user.schools[0]); //find the school
        
        let classLists = [];
        let codeGenerate = false;
        //find the classes of that school
        school.classes.forEach((element) => classLists.push(element))
        
        console.log(classLists)
    

        codeGenerationLoop:
        while(codeGenerate == false){
            //generate the class code with 4 digits.
            const code = generateClassCode(4);
            console.log("Code generated: " + code)

            if(classLists.length > 0){
                for(const classId of classLists){
                    const c = await Class.findById(classId);
                    console.log("Class code already in db " + c.classCode)
                    if(c.classCode == code){
                        continue codeGenerationLoop;
                    }
                }
                codeGenerate = true;
            }else{
                codeGenerate = true;
            }
            
        }
        fMsg(res, "Finished");

        
    }catch(err){
        fMsg(res, "error in creating class", error)
    }
}