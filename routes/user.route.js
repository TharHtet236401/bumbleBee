import express from "express";

import { validateToken } from "../utils/validator.js"
import { updateUserInfo } from "../controllers/user.controller.js";

const router = express.Router();

router.put("/update", validateToken(), updateUserInfo);

// ** need to refactor delete **
router.put("/delete", validateToken(), updateUserInfo);

export default router;