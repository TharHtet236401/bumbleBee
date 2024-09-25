import {
  createClass,
  deleteClass,
  editClass,
  readAllClasses,
  readClassByAdmin,
  readClassByTeacherAndGuardian,
  readGradeNames,
  readClassNames
} from "../controllers/class.controller.js";
import { validateToken, isAdmin } from "../utils/validator.js";
import express from "express";
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
router.get('/admin', validateToken(),isAdmin(), readClassByAdmin);
router.get('/gradeNames', validateToken(), readGradeNames);
router.get('/classNames', validateToken(), readClassNames);
export default router;
