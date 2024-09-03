import {
  createClass,
  deleteClass,
  editClass,
  readAllClasses,
  readClassByAdmin,
  readClassByTeacherAndGuardian
} from "../controllers/class.controller.js";
import { validateToken, isAdmin } from "../utils/validator.js";
import express from "express";
const router = express.Router();

router.post("/create", validateToken(), createClass);
router.delete("/delete", validateToken(), deleteClass);
router.put("/edit", validateToken(), editClass);
router.get("/allClasses", validateToken(), readAllClasses);
router.get("/readByAdmin", validateToken(), readClassByAdmin);
router.get(
  "/readByTeacherAndGuardian",
  validateToken(),
  readClassByTeacherAndGuardian
);
export default router;
