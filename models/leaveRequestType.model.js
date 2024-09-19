import mongoose from "mongoose";

const leaveRequestTypeSchema = new mongoose.Schema({
    leaveRequestTypeName: {
        type: String,
        required: true,
        unique: true
    }
});

const LeaveRequestType = mongoose.model("LeaveRequestType", leaveRequestTypeSchema);

export default LeaveRequestType;
