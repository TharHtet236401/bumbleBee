import express from "express";
import multer from "multer";
import { validateToken } from "../utils/validator.js";
import {
  profilePictureUpload,
  profilePictureUploadSimple,
} from "../controllers/image.controller.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route for uploading a single profile picture
router.post(
  "/upload-profile-picture",
  validateToken(),
  upload.single("profilePicture"),
  profilePictureUpload
);

router.post(
  "/upload-profile-picture-simple",
  validateToken(),
  upload.single("profilePicture"),
  profilePictureUploadSimple
);

export default router;
