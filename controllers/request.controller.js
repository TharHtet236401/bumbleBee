import PendingRequest from "../models/pendingRequest.model.js";
import Class from "../models/class.model.js";
import { fMsg } from "../utils/libby.js";

export const createRequest = async(req, res) => {
    try{
        const {classCode} = req.body;
        const user = req.user;
        const request = new PendingRequest({
            sender: user._id,
            desireClass: classCode
        })
        await request.save();
        fMsg(res, "request created successfully", request, 200);
    }catch(err){
        console.log(err)
        fMsg(res, "error in creating request", error, 500)
    }
}