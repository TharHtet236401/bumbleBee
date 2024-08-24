import express from "express";
import multer from 'multer';
import { parse } from 'path';

import { createPost, getPosts, editPost, deletePost } from "../controllers/post.controller.js";
import { validateToken, isNotParents, isEditorStranger } from "../utils/validator.js";

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/post_images');
    },
    filename: (req, file, cb) => {
        const { name, ext } = parse(file.originalname);
        cb(null, `${name}-${Date.now()}${ext}`); // Ensure unique file names
    }
});

const upload = multer({ storage });

router.post("/create", validateToken(), isNotParents(), upload.single('contentPicture'), createPost);
router.get("/getPosts", validateToken(),  getPosts);
router.put("/edit/:post_id", validateToken(), isEditorStranger(), isNotParents(), upload.single('contentPicture'), editPost);
router.delete("/delete/:post_id", validateToken(), isEditorStranger(), isNotParents(), deletePost)

export default router;