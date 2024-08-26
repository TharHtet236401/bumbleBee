import { createRequest } from "../controllers/request.controller.js";
import { validateToken } from "../utils/validator.js";
import express from "express";
const router = express.Router();

router.post("/create", validateToken(), createRequest)

export default router;