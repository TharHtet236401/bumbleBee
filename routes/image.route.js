import express from "express";
import multer from "multer";
import { validateToken } from "../utils/validator.js";
import { profilePictureUpload } from "../controllers/image.controller.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route for uploading a single profile picture
router.post('/upload-profile-picture', validateToken(), upload.single('profilePicture'), profilePictureUpload);

// You can add more image-related routes here in the future, such as:
// router.delete('/delete-profile-picture/:imageId', validateToken(), deleteProfilePicture);
// router.get('/get-profile-pictures', validateToken(), getProfilePictures);

export default router;