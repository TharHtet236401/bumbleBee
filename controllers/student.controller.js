import Student from "../models/student.model.js";
import Class from "../models/class.model.js";
import { fMsg, checkIfDuplicate } from "../utils/libby.js";
import User from "../models/user.model.js";

export const addNewStudentToClass = async (req, res,next) => {
    try {
        const class_id = req.params.class_id;
        const currentUser = await User.findById(req.user._id);
        const currentUserSchool = currentUser.schools[0];
        const { name, dateofBirth, newStudent = true } = req.body;

        // we do not need to check as the teacher will add this student and passed the pop out screen
        
        // Find if the student already exists
        // let student = await Student.findOne({ name, dateofBirth,currentUserSchool });

        // if (student && !newStudent) {
        //     // Existing student, add class if not already present
        //     if (!student.classes.includes(class_id)) {
        //         student.classes.push(class_id);
        //         await student.save();
        //     }
        // } else if (!student || newStudent) {
            // Create a new student if not found or newStudent is true
            const student = await Student.create({
                name,
                dateofBirth,
                classes: [class_id],
                schools: [currentUserSchool]
            });

        
        // }

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

        if(!name || !dateofBirth){
            return next(new Error("Name and date of birth are required"))
        }
        const currentUser = await User.findById(req.user._id);
        const currentUserSchool = currentUser.schools[0];
        const studentList = await Student.find({ name, dateofBirth, schools: currentUserSchool })
            .populate('classes', 'grade className ');
        
        if (studentList.length > 0) {
            fMsg(res, "Student with that name and date of birth exists in database", studentList, 200);
        } else {
            // we use this here fMsg as the request is success .
            fMsg(res, "Student with that name and date of birth does not exist in database", null, 200);
        }
    }
    catch (error) {
        next(error);
    }
}

export const addStudentToMultipleClass = async (req, res, next) => {

    try {
        const class_id = req.params.class_id;
        const { student_id } = req.body;
        
        // Use Promise.all to run both queries concurrently
        const [student, classObj] = await Promise.all([
            Student.findById(student_id),
            Class.findById(class_id)
        ]);

        if (!student || !classObj) {
            return next(new Error("Student or class not found"));
        }

        if (student.classes.includes(class_id)) {
            return next(new Error("Student already in class"));
        }

        // Use $addToSet to avoid duplicates and update both documents in parallel
        await Promise.all([
            Student.findByIdAndUpdate(student_id, { $addToSet: { classes: class_id } }),
            Class.findByIdAndUpdate(class_id, { $addToSet: { students: student_id } })
        ]);

        // Fetch the updated student document
        const updatedStudent = await Student.findById(student_id);
        fMsg(res, "Student added successfully", updatedStudent, 201);
    } catch (error) {
        next(error);
    }
}

//FOR TWIN SCENARIO
export const checkDuplicateStudents = async(desiredClass) => {
    try{
        // console.log("These are duplicate students "+ desiredClass.students);
        let studentsData = [];
        for(const student of desiredClass.students){
            let oneStudent = await Student.find({_id: student}).select({"name": 1, "dateofBirth": 1});
            // console.log("this is one student data " + oneStudent)
            studentsData.push(oneStudent)
        }

        console.log("This is student data testing " + studentsData)
        
        return checkIfDuplicate(studentsData, "name", "dateofBirth");
        // teacher.classes.forEach((eachClass) => {
        //     if(eachClass.toString() === classId.toString()){
        //       classVerify = true;
        //     }
            
        //   })
    } catch(error){
        return error;
    }
}