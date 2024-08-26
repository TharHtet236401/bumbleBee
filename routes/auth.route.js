import { register, login, passwordReset, changePassword } from "../controllers/auth.controller.js";
import { validateToken, validateBody } from "../utils/validator.js";
import { UserSchema } from "../utils/schema.js";
import { parse } from 'path';

import express from "express";
import multer from 'multer';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profile_pictures');
    },
    filename: (req, file, cb) => {
        const { ext } = parse(file.originalname);
        console.log(ext)
        cb(null, `${req.body.userName}-${Date.now()}${ext}`); // Ensure unique file names
    }
});

const upload = multer({ storage });

router.post("/register", upload.single('profilePicture'), validateBody(UserSchema.register), register);
router.post("/login", validateBody(UserSchema.login), login);
router.post("/passwordReset", passwordReset);
router.post("/changePassword", validateToken(), changePassword);

export default router;