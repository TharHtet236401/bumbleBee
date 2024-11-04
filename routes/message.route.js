import express from "express";
import { sendMessage, getMessages } from "../controllers/message.controller.js";
import { validateToken } from "../utils/validator.js";
const router = express.Router();

router.post("/send/:id", validateToken(), sendMessage);
router.get("/get/:id", validateToken(), getMessages);
export default router;
