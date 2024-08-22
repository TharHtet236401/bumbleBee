import express from "express";
import { testing } from "../controllers/testing.controller.js";

const router = express.Router();

router.post("/", testing);
/**
 * chit tl ko gyi doh
 *this is testing branch/

export default router;
