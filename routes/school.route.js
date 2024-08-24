import { createSchool, editSchool } from "../controllers/school.controller.js";
import { validateToken, isAdmin } from "../utils/validator.js"
import express from "express";
const router = express.Router();


router.post("/create",validateToken(), createSchool);

// validdateToken is to check who the user is and isAdmin check it is admin or not
router.put("/edit/", validateToken(), isAdmin(),editSchool);

export default router;