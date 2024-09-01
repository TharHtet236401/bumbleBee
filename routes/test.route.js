import express from "express";
import {fMsg} from "../utils/libby";

const router = express.Router();
router.get("/getApi", fMsg(res, "You have get response", {response: "get"}, 200))
router.post("/postApi", fMsg(res, "You have post response", {response: "post"}, 200))
router.put("/putApi", fMsg(res, "You have put response", {response: "put"}, 200))
router.delete("/deleteApi", fMsg(res, "You have delete response", {response: "delete"}, 200))

export default router;