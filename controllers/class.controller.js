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
        let duplicateError = false;

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
                    
                    //During the code generation, the duplicate name will also be checked
                    if(c.className == className){
                        duplicateError = true;
                    }

                    if(c.classCode == generatedClassCode){
                        continue codeGenerationLoop;
                    }
                }
                codeGenerate = true;
            }else{
                codeGenerate = true;
            }
        }

        //return this if there is duplicate class name
        if(duplicateError){
            return fMsg(res, "There is already that class name for your school. ", null, 200)
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
        fMsg(res, "error in creating class", null, error)
    }
}

export const editClass = async(req, res) => {
    try{
        const { classId, grade, className } = req.body;
        const classObj = await Class.findById(classId);

        if(!classObj){
            return fMsg(res, "There is no such class ", null, 200)
        }

        const editedClass = await Class.findByIdAndUpdate(
            classId,
            {
              grade,
              className
            },
            { new: true }
          );
        
          fMsg(res, "Class Updated", editedClass, 200)
        
    }catch(err){
        console.log(err);
        fMsg(res, "error in updating the class", null, error)
    }
}

export const readAllClasses = async(req, res) => {
    try{

        const allClasses = await Class.find({});
        if(allClasses == null){
            return fMsg(res, "There are no classes at the moment", null, 200)
        }

        fMsg(res, "All Classes are found", allClasses, 200)
    }
    catch(err){
        console.log(err)
        fMsg(res, "error in reading the classes", null, error)
    }
}

export const deleteClass = async(req, res) => {
    try{
        
        const { classId } = req.body;
        const classObj = await Class.findById(classId);
        if(!classObj){
            return fMsg(res, "There is no such class",null, 200)
        }

        const schoolId = classObj.school;
        const school = await School.findById(schoolId);
        
    
        school.classes.pop(classId);
        const deletedClass = await Class.deleteOne(classObj);
        await school.save();
        
        fMsg(res, "Class Deleted Successfully", deletedClass , 200)

    }catch(err){
        console.log(err)
        fMsg(res, "error in deleting class", null, error)
    }
}