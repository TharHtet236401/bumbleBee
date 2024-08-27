import express from "express";
import multer from 'multer';
import { parse } from 'path';

import {
    createPost,
    getFeeds,
    getAnnouncements,
    editPost,
    deletePost,
    filterFeeds
} from "../controllers/post.controller.js";

import {
    validateToken,
    isAdmin,
    isNotParents,
    postRBAC,
    isEditorStranger
} from "../utils/validator.js";

import { PostSchema } from "../utils/schema.js";

import { validateBody } from "../utils/validator.js";

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

//** important: don't change the middleware order */
router.post("/create", validateToken(), upload.single('contentPicture'), validateBody(PostSchema.create), postRBAC(), createPost);

router.get("/getFeeds", validateToken(),  getFeeds);
router.get('/getAnnouncements', validateToken(),  getAnnouncements);

router.put("/edit/:post_id", validateToken(), upload.single('contentPicture'), validateBody(PostSchema.edit), postRBAC(), isEditorStranger(), isNotParents(), editPost);
router.delete("/delete/:post_id", validateToken(), isEditorStranger(), isNotParents(), deletePost)

router.get("/filterFeeds", validateToken(), isAdmin(), filterFeeds);

export default router;