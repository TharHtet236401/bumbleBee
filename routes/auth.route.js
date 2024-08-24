import { register, login, passwordReset, changePassword } from "../controllers/auth.controller.js";
import { validateToken } from "../utils/validator.js";
import express from "express";
const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/passwordReset", passwordReset);
router.post("/changePassword", validateToken(), changePassword);
export default router;