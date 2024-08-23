import express from "express";
import { testing } from "../controllers/testing.controller.js";

const router = express.Router();

router.post("/", testing);


export default router;