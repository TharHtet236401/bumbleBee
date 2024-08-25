import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { fMsg } from "./libby.js";

import User from "../models/user.model.js";
import Post from "../models/post.model.js";

dotenv.config();

//validate the body with schema
export const validateBody = (schema) => {
  return (req, res, next) => {
    let result = schema.validate(req.body);
    if (result.error) {
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
      return res.status(401).json({ con: false, msg: "Unauthorized" });
    }

    let token = req.headers.authorization.split(" ")[1];

        try {
            const tokenUser = jwt.verify(token, process.env.SECRET_KEY);
            // console.log(tokenUser)
            req.user = tokenUser.data;

      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(401).json({ con: false, msg: "Invalid token" });
    }
  };

};


export const isAdmin = () => {
    return (req, res, next) => {
        const roles = req.user.roles;
        if (!roles.includes("admin")) {
            return fMsg(res, "Unauthorized", "You are not an admin");
        }
        next();
    };
};

export const isNotParents = () => {
    return (req, res, next) => {
        const roles = req.user.roles;
        if (roles.includes("guardian")) {
            return fMsg(res, "Unauthorized", "You are a guardian");
        }
        next();
    }
}

export const isEditorStranger = () => {
    return async (req, res, next) => {

        const user = req.user._id;
        const post = req.params.post_id;
        const postUser = await Post.findById(post);
        if (user != postUser.posted_by._id) {
            return fMsg(res, "Unauthorized", "You are not the author of this post");
        } 
        next();
    }
}
        
