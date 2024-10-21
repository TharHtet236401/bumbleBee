import { fMsg, fError } from "../utils/libby.js";
import User from "../models/user.model.js";
import School from "../models/school.model.js";
import Class from "../models/class.model.js";
import { generateClassCode } from "../utils/libby.js";

const defaultGradeNames = ["HND", "HNC", "Grade", "Batch", "Year"];

export const createClass = async (req, res, next) => {
  try {
    //that grade input will come from the dropdown menu
    //that classname input will come from the dropdown menu or text field at first we have no default class names like gradeNames;
    const { grade, className } = req.body;
    const user = await User.findById(req.user._id);

    if (!grade || !className) {
      return fError(res, "Please provide both grade and class name", 400);
    }
    //find the user
    if (user.schools.length == 0) {
      return fError(res, "You are not associated with any school", 400);
    }

    ////find the school and user.schools[0] is the school id as the admin can only from one school at the moment
    const schoolId = user.schools[0];
    const school = await School.findById(schoolId);

    //if the user input grade is not in the school's gradeNames, then add it to the school's gradeNames
    if (!school.gradeNames.includes(grade)) {
      school.gradeNames.push(grade);
      await school.save();
    }

    //if the user input class name is not in the school's classNames, then add it to the school's classNames
    if (!school.classNames.includes(className)) {
      school.classNames.push(className);
      await school.save();
    }

    let classLists = school.classes;
    let codeGenerate = false;
    //find the classes of that school to check the input class name and grade are already exists in that school
    // school.classes.forEach((element) => classLists.push(element));

    let generatedClassCode = "";
    //loop that checks whether or not the code generated is unique or not
    //also check the duplicate class name and grade
    codeGenerationLoop: while (codeGenerate == false) {
      //generate the class code with 4 digits.
      generatedClassCode = generateClassCode(4);

      if (classLists.length > 0) {
        //classObj
        for (const classId of classLists) {
          const classObj = await Class.findById(classId);

          //During the code generation, the duplicate name will also be checked

          //to find out new class name and grade are already exists in the school
          if (classObj.className == className && classObj.grade == grade) {
            //duplicateError = true;
            return fError(
              res,
              "There is already that class name for your school. ",
              409
            );
          }

          //to find out the generated class code is already exists in the school
          if (classObj.classCode == generatedClassCode) {
            continue codeGenerationLoop;
          }
        }
        codeGenerate = true;
      } else {
        codeGenerate = true;
      }
    }

    //create a new class
    const newClass = await Class.create({
      grade,
      className,
      classCode: generatedClassCode,
      school: schoolId,
    });

    school.classes.push(newClass._id);
    user.classes.push(newClass._id);
    await school.save();
    await user.save();
    fMsg(res, "Class created successfully", newClass, 201);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const editClass = async (req, res, next) => {
  try {
    const { classId, grade, className } = req.body;

    const user = await User.findById(req.user._id);

    if (!classId) {
      return fError(res, "Please provide the class id", 400);
    }
    //might delete later if the front end can handle the error message
    if (!grade && !className) {
      return fError(res, "Please provide at least one field to update", 400);
    }
    const classObj = await Class.findById(classId);
    const oldGrade = classObj.grade;
    const oldClassName = classObj.className;

    if (!classObj) {
      return fError(res, "There is no such class ", 404);
    }

    ///there is the grade and it is the new one

    const editedClass = await Class.findByIdAndUpdate(
      classId,
      {
        grade,
        className,
      },
      { new: true }
    );
    // grade prr tl and
    console.log("This is old grade " + oldGrade);
    console.log("This is new grade " + grade);
    console.log("This is user school id " + user.schools[0]);
    // let newSchool = await School.findByIdAndUpdate(user.schools[0], {
    //   $pull: { gradeNames: oldGrade },

    //  }, { new: true });

    console.log("This is new grade names ");
    let newSchool = await School.findById(user.schools[0]);
    if (!newSchool.gradeNames.includes(grade)) {
      newSchool = await School.findByIdAndUpdate(
        user.schools[0],
        {
          $push: { gradeNames: grade },
        },
        { new: true }
      );
    }

    if(!newSchool.classNames.includes(className)){
      newSchool = await School.findByIdAndUpdate(
        user.schools[0],
        {
          $push: { classNames: className },
        },
        { new: true }
      );
    }

    console.log(newSchool);
    await newSchool.save();

    // console.log(oldGrade)
    // if(grade && oldGrade != grade && !defaultGradeNames.includes(grade)){
    //   console.log("old grade in if")
    //   userSchool.gradeNames.pop(oldGrade);
    //   await userSchool.save();
    // }

    fMsg(res, "Class Updated", editedClass, 200);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

//it might not be useful as it will serach all the classes in the entire database
export const readAllClasses = async (req, res, next) => {
  try {
    const allClasses = await Class.find({});
    if (allClasses == null) {
      return fMsg(res, "There are no classes at the moment", {}, 204);
    }

    fMsg(res, "All Classes are found", allClasses, 200);
  } catch (err) {
    next(err);
  }
};

export const deleteClass = async (req, res, next) => {
  try {
    //might delete later if the front end can handle the error message

    const { classId } = req.body;
    if (!classId) {
      return fError(res, "Please provide the class id", 400);
    }
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return fError(res, "There is no such class", 404);
    }

    const schoolId = classObj.school;
    const school = await School.findById(schoolId);

    school.classes.pop(classId);

    await User.updateMany(
      { $pull: { classes: classId } } // Pull the specific classId from the classes array
    );
    // console.log("userclasses " + usersClasses)
    const deletedClass = await Class.findByIdAndDelete(classId);

    await school.save();

    fMsg(res, "Class Deleted Successfully", deletedClass, 200);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

//read classes by admin by its school
export const readClassByAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return fError(res, "User is not found", 404);
    }
    const schoolId = user.schools[0];
    const { page = 1 } = req.query; // Default to page 1
    const limit = 10; // Fixed limit of 10 items per page

    const skip = (page - 1) * limit;

    const classes = await Class.find({ school: schoolId })
      .populate("students")
      .populate("school")
      .populate("teachers", "userName")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by creation date, newest first

    const total = await Class.countDocuments({ school: schoolId });

    fMsg(
      res,
      "Classes found",
      {
        classes,
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalClasses: total,
      },
      200
    );
  } catch (error) {
    next(error);
  }
};

//read classes by teacher and guardian by its assigned classes
export const readClassByTeacherAndGuardian = async (req, res, next) => {
  try {
    const { page = 1 } = req.query; // Default to page 1
    const limit = 10; // Fixed limit of 10 items per page

    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user._id).populate({
      path: "classes",
      options: {
        skip: skip,
        limit: limit,
        sort: { createdAt: -1 }, // Sort by creation date, newest first
      },
      populate: [{
        path: "teachers",
        select: "userName"
      },
      {
        path: "school",
        select: "schoolName"
      },
      {
        path: "students"
      }
      ]
    })
    console.log("Current User is ", currentUser)

    if (currentUser.classes.length === 0) {
      return fError(res, "No classes registered for you", 404);
    }

    const totalClasses = await User.findById(req.user._id)
      .populate("classes")
      .then((user) => user.classes.length);
    console.log(currentUser.classes)
    fMsg(
      res,
      "Classes found",
      {
        classes: currentUser.classes,
        currentPage: Number(page),
        totalPages: Math.ceil(totalClasses / limit),
        totalClasses: totalClasses,
      },
      200
    );
  } catch (err) {
    next(err);
  }
};

//this is for the dropdown menu for Grades while creating a new class
//this is dedicated for the admin
export const readGradeNames = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return fError(res, "User is not found", 404);
    }
    const schoolId = user.schools[0];
    const school = await School.findById(schoolId);
    if (!school) {
      return fError(res, "School is not found", 404);
    }
    const gradeNames = school.gradeNames;

    if (gradeNames.length === 0) {
      return fMsg(res, "No grade names found", {}, 200);
    }

    fMsg(res, "Grade names found", gradeNames, 200);
  } catch (err) {
    next(err);
  }
};

//this is dedicate for the admin
export const readClassNames = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return fError(res, "User is not found", 404);
    }
    const schoolId = user.schools[0];
    const school = await School.findById(schoolId);
    if (!school) {
      return fError(res, "School is not found", 404);
    }
    const classNames = school.classNames;

    if (classNames.length === 0) {
      return fMsg(res, "No class names found", {}, 200);
    }
    fMsg(res, "Class names found", classNames, 200);
  } catch (err) {
    next(err);
  }
};

//this is dedicated for the teacher when creating the anncouncement
export const readClassNamesByTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("classes");
    if (!user) {
      return fError(res, "User is not found", 404);
    }
    const classes = user.classes;
    const classNames = classes.map((classObj) => classObj.className);
    fMsg(res, "Class names found", classNames, 200);
  } catch (err) {
    next(err);
  }
};

export const readGradeNamesByTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("classes");
    if (!user) {
      return fError(res, "User is not found", 404);
    }
    const classes = user.classes;

    const gradeNames = classes.map((classObj) => classObj.grade);

    fMsg(res, "Grade names found", gradeNames, 200);
  } catch (err) {
    next(err);
  }
};

export const readClassNamesByTeacherNew = async (req, res, next) => {
  try {
    const gradeName = req.params.gradeName;
    if (!gradeName) {
      return fError(res, "Grade name is not found", 505);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return fError(res, "User is not found", 404);
    }
    const schoolId = user.schools[0];
    const school = await School.findById(schoolId);
    if (!school) {
      return fError(res, "School is not found", 404);
    }
    const classObj = await Class.find({
      grade: gradeName,
      teachers: { $in: [user._id] },
      school: schoolId,
    }).select([
      "-_id",
      "-grade",
      "-classCode",
      "-school",
      "-students",
      "-teachers",
      "-guardians",
      "-announcements",
      "-__v",
    ]);
    let classNames = [];
    classObj.forEach((eachClass) => {
      classNames.push(eachClass.className);
    });

    if (classNames.length === 0) {
      return fMsg(res, "No class names found", {}, 200);
    }
    fMsg(res, "Class names found", classNames, 200);
  } catch (err) {
    next(err);
  }
};


export const getClassById = async (req, res, next) => {
  try {
    const classId = req.params.classId;
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return fError(res, "Class is not found", 404);
    }
    fMsg(res, "Class found", classObj, 200);
  } catch (err) {
    fError(res, "Class not found", 505);
  }
};
