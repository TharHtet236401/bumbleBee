import express from "express";
import { sendMessage, getMessages } from "../controllers/message.controller.js";
import { validateToken } from "../utils/validator.js";
import multer from "multer";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });



router.post("/send/:id", validateToken(), upload.fields([{name:"images",maxCount:5},{name:"documents",maxCount:5}])   ,sendMessage);
router.get("/get/:id", validateToken(), getMessages);
export default router;
