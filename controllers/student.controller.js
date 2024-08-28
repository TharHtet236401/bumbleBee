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

            student.classes.push(class_id);g

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

export const getStudentsByClass = async (req, res) => {
    try {
        const class_id = req.params.class_id;
        const classObj = await Class.findById(class_id).populate('students'); // Populate students

        // const students = await Student.find({ classes: class_id });We can also search like
        if (!classObj) {
            return fMsg(res, "Class not found", null, 404); // Return if class not found
        }

        fMsg(res, "Students fetched successfully", classObj.students, 200); // Return populated students
    } catch (error) {
        fMsg(res, "Error in fetching students", error, 500);
    }
};


export const getStudentsByClassCode = async (req, res) => {
    try {
        const classCode = req.params.classCode;
        const classObj = await Class.findOne({ classCode }).populate('students');
        
        if (!classObj) {
            return fMsg(res, "Class not found", null, 404);
        }
        const students = classObj.students.map(student => ({
            _id: student._id,
            name: student.name,
            dateofBirth: student.dateofBirth
        }));
        fMsg(res, "Students fetched successfully", students, 200);
    } catch (error) {
        fMsg(res, "Error in fetching students", error, 500);
    }
}