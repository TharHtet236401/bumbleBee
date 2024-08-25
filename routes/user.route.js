import express from "express";

import { validateToken, isAdmin } from "../utils/validator.js"
import { updateUserInfo , getAllUsers} from "../controllers/user.controller.js";

const router = express.Router();

router.put("/update", validateToken(), updateUserInfo);
router.put("/delete", validateToken(), updateUserInfo);

router.get("/all", validateToken(), isAdmin(), getAllUsers);

export default router;