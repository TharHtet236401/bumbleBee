import express from "express"
import {addStudent} from "../controllers/student.controller.js"
import {isTeacher,validateToken} from "../utils/validator.js"

const router=express.Router()

router.post("/add/:class_id",validateToken(),isTeacher(),addStudent)

export default router