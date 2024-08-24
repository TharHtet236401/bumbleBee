import { createClass } from "../controllers/class.controller.js";
import { validateToken, isAdmin } from "../utils/validator.js";
import express from "express";
const router = express.Router();

router.post("/create", validateToken(), createClass);

export default router;