import { fMsg } from "../utils/libby.js";
import User from "../models/user.model.js";
import School from "../models/school.model.js";
import Class from "../models/class.model.js";
import { generateClassCode } from "../utils/libby.js";

export const createClass = async(req, res, next) => {
    try{
        const  { grade, className } = req.body;
        const user = await User.findById(req.user._id);  //find the user
        const schoolId = user.schools[0]; //0 is defined here, because it is assuming that there is only one school for one admin at the moment
        const school = await School.findById(schoolId); //find the school
        
        let classLists = [];
        let codeGenerate = false;
        let duplicateError = false;

        //find the classes of that school to check the input class name and grade are already exists in that school
        school.classes.forEach((element) => classLists.push(element))
        

        let generatedClassCode = "";
    

        //loop that checks whether or not the code generated is unique or not
        codeGenerationLoop:
        while(codeGenerate == false){
            //generate the class code with 4 digits.
            generatedClassCode = generateClassCode(4);
            
            if(classLists.length > 0){
                for(const classId of classLists){
                    const c = await Class.findById(classId);
                    
                    //During the code generation, the duplicate name will also be checked
                    
                    if(c.className == className && c.grade == grade){
                        
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
            return next(new Error("There is already that class name for your school. "))
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
        next(err);
    }
}

export const editClass = async(req, res, next) => {
    try{
        const { classId, grade, className } = req.body;

        if(!classId || !grade || !className){
            return next(new Error("Please provide all the required fields"))
        }
        const classObj = await Class.findById(classId);

        if(!classObj){
            return next(new Error("There is no such class "))
        }

        //duplicate class name return something. 

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
        next(err);
    }
}

export const readAllClasses = async(req, res, next) => {
    try{

        const allClasses = await Class.find({});
        if(allClasses == null){
            return next(new Error("There are no classes at the moment"))
        }

        fMsg(res, "All Classes are found", allClasses, 200)
    }
    catch(err){
        console.log(err)
        next(err);
    }
}

export const deleteClass = async(req, res, next) => {
    try{
        
        const { classId } = req.body;
        const classObj = await Class.findById(classId);
        if(!classObj){
            return next(new Error("There is no such class"))
        }

        const schoolId = classObj.school;
        const school = await School.findById(schoolId);
        
    
        school.classes.pop(classId);
        const deletedClass = await Class.deleteOne(classObj);
        await school.save();
        
        fMsg(res, "Class Deleted Successfully", deletedClass , 200)

    }catch(err){
        console.log(err)
        next(err);
    }
}

export const readClassByAdmin = async (req, res, next) => { // differenet admins can read different schools classes
    try {
        // Find the user and populate the school data if it's required
        const user = await User.findById(req.user._id);
        if (!user) {
            return next(new Error("User not found"));
        }

        // Assuming user.schools is an array and we need to handle multiple schools in the future
        const schoolId = user.schools[0];
        if (!schoolId) {
            return next(new Error("No school associated with this user"));
        }

        
        const [school, classes] = await Promise.all([
            School.findById(schoolId),
            Class.find({ school: schoolId })
        ]);

        if (!school) {
            return next(new Error("School not found"));
        }

        if (!classes || classes.length === 0) {
            return next(new Error("No classes found for this school"));
        }

        fMsg(res, "Classes found", classes, 200);

    } catch (err) {
        console.error("Error in reading the class:", err);
        next(err);
    }
};


export const readClassByTeacherAndGuardian = async (req, res, next) => {
    try{
        //After swam htet to complete the class data, we will add it here
        const currentUser = await User.findById(req.user._id).populate('classes'); // Populate only the classes field
        const classesToRead = currentUser.classes;
        if(classesToRead.length == 0){
            return next(new Error("No classes registered for you"));
        }
        fMsg(res, "Classes found", classesToRead, 200);
    }catch(err){
        console.log(err)
        next(err);
    }
}
