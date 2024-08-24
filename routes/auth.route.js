import { register,login } from "../controllers/auth.controller.js";
import { validateBody } from "../utils/validator.js";
import { UserSchema } from "../utils/schema.js";
import express from "express";
const router = express.Router();

router.post("/register", validateBody(UserSchema.register), register);
router.post("/login", validateBody(UserSchema.login), login);

export default router;