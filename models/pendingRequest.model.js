import mongoose from "mongoose";

const pendingRequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    desireClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
        required: true
    }
})

const PendingRequest = mongoose.model("PendingRequest", pendingRequestSchema);

export default PendingRequest;