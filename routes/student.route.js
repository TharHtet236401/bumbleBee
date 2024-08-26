import express from "express";
import { addStudentToClass } from "../controllers/student.controller.js";
import { isTeacher, validateToken } from "../utils/validator.js";

const router = express.Router();

router.post("/add/:class_id", validateToken(), isTeacher(), addStudentToClass);

export default router;
