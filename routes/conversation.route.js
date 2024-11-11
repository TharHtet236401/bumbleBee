import express from "express";
import { getConversations } from "../controllers/conversation.controller.js";
import { validateToken } from "../utils/validator.js";

const router = express.Router();

router.get("/all", validateToken(), getConversations);

export default router;