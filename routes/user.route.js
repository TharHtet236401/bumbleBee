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
  getUserById,
  getMyProfile
} from "../controllers/user.controller.js";

import User from "../models/user.model.js";

const router = express.Router();

// Middleware to fetch user email

router.get("/profile", validateToken(), getMyProfile);

router.put(
  "/update",
  validateToken(),
  updateUserInfo
);

router.delete("/delete/:userId", deleteUser);

router.get("/all", validateToken(), isAdmin(), getAllUsers);

router.get("/:userId", validateToken(), getUserById);

export default router;
