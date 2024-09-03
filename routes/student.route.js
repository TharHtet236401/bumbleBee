import express from "express";
import { addStudentToClass, getStudentsByClass, getStudentsByClassCode,getStudentInfo } from "../controllers/student.controller.js";
import { isTeacher, validateToken } from "../utils/validator.js";

const router = express.Router();

router.post("/add/:class_id", validateToken(), isTeacher(), addStudentToClass);
router.get("/get/:class_id", validateToken(), isTeacher(), getStudentsByClass);
router.get("/getByClassCode/:classCode", getStudentsByClassCode);
router.get("/getStudentInfo/:studentId", getStudentInfo);
export default router;
