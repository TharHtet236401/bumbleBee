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
    },
    classCode: {
        type: String,
        required: true
    },
    roles: {
        type: [String],
        required: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
    }
})

const PendingRequest = mongoose.model("PendingRequest", pendingRequestSchema);

export default PendingRequest;