import { fMsg } from "../utils/libby.js";
import User from "../models/user.model.js";
import School from "../models/school.model.js";
import Class from "../models/class.model.js";
import { generateClassCode } from "../utils/libby.js";

export const createClass = async(req, res) => {
    try{
        const { grade, className } = req.body;
        const user = await User.findById(req.user._id);  //find the user
        const schoolId = user.schools[0]; //0 is defined here, because it is assuming that there is only one school for one admin at the moment
        const school = await School.findById(schoolId); //find the school
        
        let classLists = [];
        let codeGenerate = false;

        //find the classes of that school
        school.classes.forEach((element) => classLists.push(element))
        
        console.log(classLists)
        let generatedClassCode = "";
    

        //loop that checks whether or not the code generated is unique or not
        codeGenerationLoop:
        while(codeGenerate == false){
            //generate the class code with 4 digits.
            generatedClassCode = generateClassCode(4);
            console.log("Code generated: " + generatedClassCode)

            if(classLists.length > 0){
                for(const classId of classLists){
                    const c = await Class.findById(classId);
                    console.log("Class code already in db " + c.classCode)
                    if(c.classCode == generatedClassCode){
                        continue codeGenerationLoop;
                    }
                }
                codeGenerate = true;
            }else{
                codeGenerate = true;
            }
        }

        //create a new class
        const newClass = await Class.create({
            grade,
            className,
            classCode: generatedClassCode,
            school: schoolId
          });

        school.classes.push(newClass._id);
        await school.save();
        fMsg(res, "Class created successfully", newClass, 200);
        
    }catch(err){
        console.log(err)
        fMsg(res, "error in creating class", error)
    }
}