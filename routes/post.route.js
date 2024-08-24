import express from "express";

import { createPost, editPost, deletePost } from "../controllers/post.controller.js";
import { validateToken, isNotParents, isEditorStranger } from "../utils/validator.js";

const router = express.Router();

router.post("/create", validateToken(), isNotParents(), createPost);
router.put("/edit/:post_id", validateToken(), isEditorStranger(), isNotParents(), editPost);
router.delete("/delete/:post_id", validateToken(), isEditorStranger(), isNotParents(), deletePost)

export default router;