import { createRequest, readRequest, respondRequest} from "../controllers/request.controller.js";
import { validateToken, isNotParents } from "../utils/validator.js";
import express from "express";
const router = express.Router();

router.post("/create", validateToken(), createRequest)

//There can be problems here in the future, if there is a user with both roles of teacher and parent
router.get("/read", validateToken(), isNotParents(), readRequest)
router.post("/respond", validateToken(), isNotParents(), respondRequest)

export default router;