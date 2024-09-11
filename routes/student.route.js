import express from "express";
import {
  addNewStudentToClass,
  getStudentsByClass,
  getStudentsByClassCode,
  getStudentInfo,
  checkStudentExists,
  addStudentToMultipleClass,
  editStudent,
  deleteStudent
} from "../controllers/student.controller.js";
import { isTeacher, validateToken } from "../utils/validator.js";

const router = express.Router();

router.post("/add/:class_id", validateToken(), isTeacher(), addNewStudentToClass);
router.get("/get/:class_id", validateToken(), isTeacher(), getStudentsByClass);
router.get("/getByClassCode/:classCode",validateToken(), getStudentsByClassCode);
router.get("/getStudentInfo/:studentId", validateToken(), getStudentInfo);
router.put("/edit/:studentId", validateToken(), editStudent);
router.delete("/delete/:studentId", validateToken(), deleteStudent);

//new version routes

router.post("/checkStudentExists", validateToken(), checkStudentExists);
router.post("/addStudentToMultipleClass/:class_id", validateToken(), addStudentToMultipleClass);

export default router;
