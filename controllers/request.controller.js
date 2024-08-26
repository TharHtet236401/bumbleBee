import PendingRequest from "../models/pendingRequest.model.js";
import Class from "../models/class.model.js";
import Student from "../models/student.model.js";
import User from "../models/user.model.js";
import { fMsg } from "../utils/libby.js";

export const createRequest = async (req, res) => {  // When the guardian and the teacher want to join the class 
    try {
        const { classCode ,student_id } = req.body;
        const userId = req.user._id;

        

        // Find the desired class using the provided class code
        const desireClass = await Class.findOne({ classCode });
        if (!desireClass) {
            return fMsg(res, "Class not found", "The class with the given code does not exist", 404);
        }

        if(req.user.roles.includes("guardian")){
            const guardian = await User.findById(userId)
        
            if(!guardian.childern.includes(student_id)){
                guardian.childern.push(student_id)
              
                guardian.classes.push(desireClass._id)
                await guardian.save()
                
            }
        }

        // Check if the user already has a pending request for this class
        const existingRequest = await PendingRequest.findOne({ sender: userId, desireClass: desireClass._id ,student_id: student_id});
        if (existingRequest) {
            return fMsg(res, "Request already exists", "You already have a pending request for this class", 400);
        }

        // Create a new pending request
        const request = new PendingRequest({
            sender: userId,
            desireClass: desireClass._id,
            classCode: classCode,
            roles: req.user.roles,
            student_id: student_id
        });
        
        await request.save();

        fMsg(res, "Request created successfully", request, 200);
    } catch (error) {
        fMsg(res, "Error in creating request", error.message, 500);
    }
}
