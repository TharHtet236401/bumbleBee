import express from "express";

import { cookieCheckController } from "../controllers/cookie.controller.js";

const router = express.Router();

router.get("/check", cookieCheckController);

export default router;
