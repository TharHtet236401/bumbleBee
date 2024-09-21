import express from "express";
import multer from "multer";
import {
  register,
  login,
  passwordReset,
  changePassword,
  logout,
} from "../controllers/auth.controller.js";
import { validateBody, validateToken } from "../utils/validator.js";
import { UserSchema } from "../utils/schema.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post(
  "/register",
  upload.single("profilePicture"),
  validateBody(UserSchema.register),
  register
);
router.post("/login", validateBody(UserSchema.login), login);
router.post(
  "/passwordReset",
  validateBody(UserSchema.resetPassword),
  passwordReset
);
router.post(
  "/changePassword",
  validateToken(),
  validateBody(UserSchema.changePassword),
  changePassword
);
router.post("/logout", validateToken(), logout);
export default router;
