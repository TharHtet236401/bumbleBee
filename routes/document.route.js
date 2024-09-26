import express from "express";
import multer from "multer";
import { validateToken } from "../utils/validator.js";
import { uploadMultipleDocuments } from "../controllers/document.controller.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route for uploading multiple documents
router.post('/upload-multiple', validateToken(), upload.array('documents', 10), uploadMultipleDocuments);

export default router;