import Student from "../models/student.model.js";
import Class from "../models/class.model.js";
import { fMsg } from "../utils/libby.js";
import User from "../models/user.model.js";

export const addStudentToClass = async (req, res,next) => {
    try {
        const class_id = req.params.class_id;
        const { name, dateofBirth, newStudent = false } = req.body;

        // Find if the student already exists
        let student = await Student.findOne({ name, dateofBirth });

        if (student && !newStudent) {
            // Existing student, add class if not already present
            if (!student.classes.includes(class_id)) {
                student.classes.push(class_id);
                await student.save();
            }
        } else if (!student || newStudent) {
            // Create a new student if not found or newStudent is true
            student = await Student.create({
                name,
                dateofBirth,
                classes: [class_id],
            });
        }

        // Find the class to add the student to
        const studentClass = await Class.findById(class_id);
        if (!studentClass.students.includes(student._id)) {
            studentClass.students.push(student._id);
            await studentClass.save();
        } else {
            return next(new Error("Student already in class"))
        }

        fMsg(res, "Student created or updated successfully", student, 201);
    } catch (error) {
        next(error);
    }
};

export const getStudentsByClass = async (req, res,next) => {
    try {
        const class_id = req.params.class_id;
        const classObj = await Class.findById(class_id).populate('students'); // Populate students

        // const students = await Student.find({ classes: class_id });We can also search like
        if (!classObj) {
            return next(new Error("Class not found")) // Return if class not found
        }

        fMsg(res, "Students fetched successfully", classObj.students, 200); // Return populated students
    } catch (error) {
        next(error);
    }
};


export const getStudentsByClassCode = async (req, res,next) => {
    try {
        const classCode = req.params.classCode;
        const classObj = await Class.findOne({ classCode }).populate('students');
        
        if (!classObj) {
            return next(new Error("Class not found"))
        }
        const students = classObj.students.map(student => ({
            _id: student._id,
            name: student.name,
            dateofBirth: student.dateofBirth
        }));
        fMsg(res, "Students fetched successfully", students, 200);
    } catch (error) {
        next(error);
    }
}

export const getStudentInfo = async (req, res, next) => {
    try {
        const studentId = req.params.studentId;
        const student = await Student.findById(studentId);
        if (!student) {
            return next(new Error("Student not found"))
        }
        fMsg(res, "Student fetched successfully", student, 200);
    }catch(error){
        next(error);
    }
}


///new version starts here 


export const checkStudentExists = async (req, res, next) => {
    try {
        const { name, dateofBirth } = req.body;
        const currentUser = await User.findById(req.user._id);
        console.log(currentUser);
        const studentList = await Student.find({ name, dateofBirth })
            .populate('classes', 'grade className school');
        
        if (studentList.length > 0) {
            const formattedStudentList = studentList.map(student => ({
                _id: student._id,
                name: student.name,
                dateofBirth: student.dateofBirth,
                classes: student.classes.map(cls => ({
                    grade: cls.grade,
                    className: cls.className,
                    school: cls.school
                }))
            }));
            fMsg(res, "Student with that name and date of birth exists in database", formattedStudentList, 200);
        } else {
            next(new Error("Student does not exist in the database"))
        }
    }
    catch (error) {
        next(error);
    }
}

