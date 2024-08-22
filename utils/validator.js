import jwt from "jsonwebtoken";
import dotenv from "dotenv";

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
      let tokenUser = jwt.verify(token, process.env.SECRET_KEY);
      req.user = tokenUser.data;

      next();
    } catch (error) {
      console.error("Token verification error:", error.message);
      return res.status(401).json({ con: false, msg: "Invalid token" });
    }
  };
};
