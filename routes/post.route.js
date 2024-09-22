import express from "express";
import multer from "multer";
import { parse } from "path";

import {
  createPost,
  getFeeds,
  getAnnouncements,
  editPost,
  deletePost,
  filterFeeds,
} from "../controllers/post.controller.js";

import {
  validateToken,
  isAdmin,
  isNotParents,
  isEditorStranger,
} from "../utils/validator.js";

import { PostSchema } from "../utils/schema.js";

import { validateBody } from "../utils/validator.js";

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

//** important: don't change the middleware order */
router.post(
  "/create",
  validateToken(),
  upload.fields([
    { name: "contentPicture", maxCount: 1 },
    { name: "documents", maxCount: 5 }, // Allow up to 5 documents
  ]),
  validateBody(PostSchema.create),
  isNotParents(),
  createPost
);

router.get("/getFeeds", validateToken(), getFeeds);
router.get("/getAnnouncements", validateToken(), getAnnouncements);

router.put(
  "/edit/:post_id",
  validateToken(),
  validateBody(PostSchema.edit),
  isEditorStranger(),
  isNotParents(),
  upload.fields([
    { name: "contentPicture", maxCount: 1 },
    { name: "documents", maxCount: 5 }, // Allow up to 5 documents
  ]),
  editPost
);
router.delete(
  "/delete/:post_id",
  validateToken(),
  isEditorStranger(),
  isNotParents(),
  deletePost
);

router.get("/filterFeeds", validateToken(), isAdmin(), filterFeeds);

export default router;
