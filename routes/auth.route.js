import { register, login, passwordReset, changePassword } from "../controllers/auth.controller.js";
import { validateToken, validateBody } from "../utils/validator.js";
import { UserSchema } from "../utils/schema.js";
import express from "express";
const router = express.Router();

router.post("/register", validateBody(UserSchema.register), register);
router.post("/login", validateBody(UserSchema.login), login);
router.post("/passwordReset", passwordReset);
router.post("/changePassword", validateToken(), changePassword);

export default router;