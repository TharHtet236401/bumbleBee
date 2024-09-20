import express from "express";
import multer from 'multer';

import { UserSchema } from "../utils/schema.js";
import { validateBody } from "../utils/validator.js";

import { parse } from 'path';

import {
    validateToken,
    isAdmin
} from "../utils/validator.js"

import {
    updateUserInfo,
    deleteUser,
    getAllUsers
} from "../controllers/user.controller.js";

import User from "../models/user.model.js";

const router = express.Router();

// Middleware to fetch user email
const fetchUserEmail = async (req, res, next) => {
    if (!req.body.email) {
        try {
            const user = await User.findById(req.user._id);
            if (user) {
                req.email = user.email;
            } else {
                return res.status(404).send('User not found');
            }
        } catch (error) {
            return res.status(500).send('Error fetching user email');
        }
    } else if (req.body.email) {
        req.email = req.body.email;
    }
    next(); // Proceed only if everything is fine
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        cb(null, 'uploads/profile_pictures');
    },
    filename: (req, file, cb) => {
        const { ext } = parse(file.originalname);

        cb(null, `${Date.now()}${ext}`); // Ensure unique file names
    }
});

const upload = multer({ storage });

router.put("/update", validateToken(), upload.single('profilePicture'), validateBody(UserSchema.edit), updateUserInfo);

router.post("/delete/:userId", deleteUser);

router.get("/all", validateToken(), isAdmin(), getAllUsers);

export default router;