import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

// you can format the response
export const fMsg = (res, msg, result = {}, statusCode = 200) => {
    res.status(statusCode).json({ con: true, msg, result });
};

//you can encode the password
export const encode = (payload) => {
    return bcrypt.hashSync(payload, 10);
};

//you can decode the password
export const decode = (payload, hash) => {
    return bcrypt.compareSync(payload, hash);
};

//you can generate JWT the token
export const genToken = (payload) =>
    jwt.sign(
        {
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
            data: payload,
        },
        process.env.SECRET_KEY
    );
