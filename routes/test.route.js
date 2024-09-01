import express from "express";
import { fMsg } from "../utils/libby.js";

const router = express.Router();
router.get("/getApi", (req, res) => {
    fMsg(res, "You have get response", {"response": "get"}, 200)
})
router.post("/postApi", (req, res) => {
    fMsg(res, "You have post response", {"response": "post"}, 200)
})
router.put("/putApi", (req, res) => {
    fMsg(res, "You have put response", {"response": "put"}, 200)
})
router.delete("/deleteApi", (req, res) => {
    fMsg(res, "You have delete response", {"response": "delete"}, 200)
})

export default router;