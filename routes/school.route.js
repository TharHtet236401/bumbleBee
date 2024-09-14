import { createSchool, editSchool, getSchool ,deleteSchool} from "../controllers/school.controller.js";
import { validateToken, isAdmin ,validateBody} from "../utils/validator.js"
import { SchoolSchema } from "../utils/schema.js";
import express from "express";
const router = express.Router();


router.post("/create",validateToken(), isAdmin(), validateBody(SchoolSchema.create), createSchool);

// validdateToken is to check who the user is and isAdmin check it is admin or not
router.put("/edit/", validateToken(), isAdmin(), editSchool);

router.get("/getSchool", validateToken(), getSchool);

router.delete("/delete", validateToken(), isAdmin(), deleteSchool);

export default router;