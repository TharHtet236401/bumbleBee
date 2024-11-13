import {
  createClass,
  deleteClass,
  editClass,
  readAllClasses,
  readClassByAdmin,
  readClassByTeacherAndGuardian,
  readGradeNames,
  readClassNames,
  readClassNamesByTeacherNew,
  readClassNamesByTeacher,
  readGradeNamesByTeacher, // Ensure this is correctly imported
  getClassById
} from "../controllers/class.controller.js";
import{sendGroupMessage, getGroupMessage} from "../controllers/message.controller.js"
import { validateToken, isAdmin } from "../utils/validator.js";
import express from "express";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();

router.post("/create", validateToken(),isAdmin(), createClass);
router.delete("/delete", validateToken(), isAdmin(), deleteClass);
router.put("/edit", validateToken(), isAdmin(),editClass);
router.get("/allClasses", validateToken(), readAllClasses);
router.get("/readByAdmin", validateToken(), isAdmin(), readClassByAdmin);
router.get(
  "/readByTeacherAndGuardian",
  validateToken(),
  readClassByTeacherAndGuardian
);
router.get('/gradeNames', validateToken(), readGradeNames);
router.get('/classNames', validateToken(), readClassNames);
router.get('/classNamesByTeacherNew/:gradeName', validateToken(), readClassNamesByTeacherNew);
router.get('/gradeNamesByTeacher', validateToken(), readGradeNamesByTeacher);
router.get('/classNamesByTeacher', validateToken(), readClassNamesByTeacher);
router.get('/classById/:classId', validateToken(), getClassById);
router.post("/chat/send/:classId", validateToken(), upload.fields([{name:"images",maxCount:5},{name:"documents",maxCount:5}]), sendGroupMessage)
router.get("/chat/get/:classId", validateToken(), getGroupMessage)
export default router;
