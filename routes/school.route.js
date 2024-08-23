import express from "express";
import { createSchool, editSchool } from "../controllers/school.controller.js";
import { validateToken, isAdmin } from "../utils/validator.js"

const router = express.Router();


router.post("/create",validateToken(), createSchool);

//validdateToken is to check who the user is and isAdmin check it is admin or not
router.put("/edit/:school_id",validateToken(), isAdmin(), editSchool);
export default router;