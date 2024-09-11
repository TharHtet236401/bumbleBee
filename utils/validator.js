import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

import { fMsg } from "./libby.js";
import { deleteFile } from "./libby.js";

import Post from "../models/post.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//validate the body with schema
export const validateBody = (schema) => {
    return (req, res, next) => {

        let result = schema.validate(req.body);
        if (result.error) {

            if (req.file) {
                const oldFilePath = path.join(__dirname, '..', req.file.path);
                deleteFile(oldFilePath);
            }
            next(new Error(result.error.details[0].message));
        } else {
            next();
        }
    };
};

//validate the token with jwt and attach the user info to the request body
export let validateToken = () => {
    return (req, res, next) => {
        if (!req.headers.authorization) {
            return next(new Error("Unauthorized"));
        }

        let token = req.headers.authorization.split(" ")[1];

        try {
            const tokenUser = jwt.verify(token, process.env.SECRET_KEY);
            req.user = tokenUser.data;

            next();
        } catch (error) {
            console.error("Token verification error:", error.message);
            return next(new Error("Invalid token"));
        }
    };
};

export const isAdmin = () => {
    return (req, res, next) => {
        const roles = req.user.roles;
        if (!roles.includes("admin")) {
            return next(new Error("You are not an admin"));
        }
        next();
    };
};

export const isTeacher = () => {
    return (req, res, next) => {
        const roles = req.user.roles;
        if (!roles.includes("teacher")) {
            return next(new Error("You are not a teacher"));
        }
        next();
    };
};

export const postRBAC = () => {
    return (req, res, next) => {
        const roles = req.user.roles;
        if (roles.includes("teacher") && req.body.contentType === "feed") {
            return next(new Error("Teachers cannot post/modify feeds"));
        }
        next();
    };
}

export const isNotParents = () => {
    return (req, res, next) => {
        const roles = req.user.roles;
        if (roles.includes("guardian")) {
            return next(new Error("You are a guardian"));
        }
        next();
    };
};

export const isEditorStranger = () => {
    return async (req, res, next) => {
        const user = req.user._id;
        const post = req.params.post_id;
        const postUser = await Post.findById(post);
        if (user != postUser.posted_by._id) {
            return next(new Error("You are not the author of this post"));
        }
        next();
    };
};
