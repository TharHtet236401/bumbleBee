import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { fError } from "./libby.js";

import Post from "../models/post.model.js";
import Token from "../models/token.model.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//validate the body with schema
export const validateBody = (schema) => {
  return (req, res, next) => {
    let result = schema.validate(req.body);

    if (result.error) {
      if (req.file) {
        const oldFilePath = path.join(__dirname, "..", req.file.path);
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
  return async (req, res, next) => {
    if (!req.headers.authorization) {
      return next(new Error("Unauthorized"));
    }

    let token = req.headers.authorization.split(" ")[1];
    // console.log(token);
    try {
      const tokenUser = jwt.verify(token, process.env.SECRET_KEY);
      req.user = tokenUser.data;

      let findToken = await Token.findOne({ token });
      // console.log(findToken)
      if (!findToken) {
        return next(new Error("Your session is already expired"));
      }

      next();
    } catch (error) {
      await Token.findOneAndDelete({ token });
      return next(new Error("Invalid token"));
    }
  };
};

export const tokenFromSocket = async (socket,next)=>{
  let user = "blank"
  let token = socket.handshake.headers.authorization.split(" ")[1]
  // console.log("this is the token",token)
  if(token){
      try{
          user = jwt.verify(token,process.env.SECRET_KEY)
          socket.currentUser = user.data
      }catch(err){
          next(new Error("Handshake Error"))
      }
      next()
  }else{
      next(new Error("Token is required"))
  }
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
    if (!roles.includes("teacher") && !roles.includes("admin")) {
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
};

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
    const roles = req.user.roles;
    const postUser = await Post.findById(post);
    if (!postUser) {
      return next(new Error("Post not found"));
    }
    if (user != postUser.posted_by._id && !roles.includes("admin")) {
      return next(new Error("You are not the author of this post"));
    }
    next();
  };
};

export const isGuardian = () => {
  return (req, res, next) => {
    const roles = req.user.roles;
    if (!roles.includes("guardian") && !roles.includes("admin")) {
      return next(new Error("You are not a guardian"));
    }
    next();
  };
};
