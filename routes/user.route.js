import express from "express";

import {
    validateToken,
    isAdmin
} from "../utils/validator.js"

import {
    updateUserInfo,
    deleteUser,
    getAllUsers
} from "../controllers/user.controller.js";

const router = express.Router();

router.put("/update", validateToken(), updateUserInfo);

router.post("/delete/:userId", deleteUser);

router.get("/all", validateToken(), isAdmin(), getAllUsers);

export default router;