import { createClass, deleteClass, editClass, readAllClasses } from "../controllers/class.controller.js";
import { validateToken, isAdmin } from "../utils/validator.js";
import express from "express";
const router = express.Router();

router.post("/create", validateToken(), isAdmin(), createClass);
router.delete("/delete", validateToken(), isAdmin(), deleteClass);
router.put("/edit", validateToken(), isAdmin(), editClass);
router.get("/allClasses", validateToken(), isAdmin(), readAllClasses)

export default router;