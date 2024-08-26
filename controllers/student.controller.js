import Student from "../models/student.model.js";
import Class from "../models/class.model.js";
import { fMsg } from "../utils/libby.js";

export const addStudentToClass = async (req, res) => {
    try {
        const class_id = req.params.class_id;
        const { name, dateofBirth } = req.body;
        // Find if the student already exists
        let student = await Student.findOne({ name, dateofBirth });
        if (student) {
            // Check if class_id is already in student's classes array

            student.classes.push(class_id);

            await student.save();
        } else {
            // Create a new student if not found

            student = await Student.create({
                name,
                dateofBirth,
                classes: [class_id], // Initialize with the class_id
            });
        }

        // Find the class to add the student to
        const studentClass = await Class.findById(class_id);
        if (!studentClass.students.includes(student._id)) {
            studentClass.students.push(student._id); // Push the student's ID to the class's students array
            await studentClass.save();
        }

        fMsg(res, "Student created or updated successfully", student, 201);
    } catch (error) {
        fMsg(res, "Error in creating or updating student", error, 500);
    }
};
