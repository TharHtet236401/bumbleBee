import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const cookieCheckController = (req, res, next) => {
    const { token } = req.cookies;
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const tokenUser = jwt.verify(token, process.env.SECRET_KEY);
    return res.status(200).json({ message: "Authorized", userData: tokenUser.data });
}