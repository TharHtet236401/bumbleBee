import express from "express";
import multer from "multer";

import { UserSchema } from "../utils/schema.js";
import { validateBody } from "../utils/validator.js";

import { parse } from "path";

import { validateToken, isAdmin } from "../utils/validator.js";

import {
  updateUserInfo,
  deleteUser,
  getAllUsers,
} from "../controllers/user.controller.js";

import User from "../models/user.model.js";

const router = express.Router();

// Middleware to fetch user email

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.put(
  "/update",
  validateToken(),
  upload.single("profilePicture"),
  updateUserInfo
);

router.delete("/delete/:userId", deleteUser);

router.get("/all", validateToken(), isAdmin(), getAllUsers);

export default router;
