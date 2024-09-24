import { fMsg, fError } from "../utils/libby.js";
import User from "../models/user.model.js";
import School from "../models/school.model.js";
import Class from "../models/class.model.js";
import { generateClassCode } from "../utils/libby.js";

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

    let classLists = [];
    let codeGenerate = false;
    let duplicateError = false;

    //find the classes of that school to check the input class name and grade are already exists in that school
    school.classes.forEach((element) => classLists.push(element));

    let generatedClassCode = "";

    //loop that checks whether or not the code generated is unique or not
    //also check the duplicate class name and grade
    codeGenerationLoop: while (codeGenerate == false) {
      //generate the class code with 4 digits.
      generatedClassCode = generateClassCode(4);

      if (classLists.length > 0) {
        for (const classId of classLists) {
          const c = await Class.findById(classId);

          //During the code generation, the duplicate name will also be checked

          //to find out new class name and grade are already exists in the school
          if (c.className == className && c.grade == grade) {
            duplicateError = true;
          }

          //to find out the generated class code is already exists in the school
          if (c.classCode == generatedClassCode) {
            continue codeGenerationLoop;
          }
        }
        codeGenerate = true;
      } else {
        codeGenerate = true;
      }
    }

    //return this if there is duplicate class name
    if (duplicateError) {
      return fError(
        res,
        "There is already that class name for your school. ",
        409
      );
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

    if (!classId) {
      return fError(res, "Please provide the class id", 400);
    }
    //might delete later if the front end can handle the error message
    if (!grade && !className) {
      return fError(res, "Please provide at least one field to update", 400);
    }
    const classObj = await Class.findById(classId);

    if (!classObj) {
      return fError(res, "There is no such class ", 404);
    }

    //duplicate class name return something.

    const editedClass = await Class.findByIdAndUpdate(
      classId,
      {
        grade,
        className,
      },
      { new: true }
    );

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
    if (!classId) {
      return fError(res, "Please provide the class id", 400);
    }
    const { classId } = req.body;
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return fError(res, "There is no such class", 404);
    }

    const schoolId = classObj.school;
    const school = await School.findById(schoolId);

    school.classes.pop(classId);
    const deletedClass = await Class.deleteOne(classObj);
    await school.save();

    fMsg(res, "Class Deleted Successfully", deletedClass, 200);
  } catch (err) {
    console.log(err);
    next(err);
  }
};

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
    });

    if (currentUser.classes.length === 0) {
      return fError(res, "No classes registered for you", 404);
    }

    const totalClasses = await User.findById(req.user._id)
      .populate("classes")
      .then((user) => user.classes.length);

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
//this is dedicate for the admin
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
export const readGreadNamesByTeacher = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
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
