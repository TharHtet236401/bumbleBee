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
    studentName: {
        type: String
    },
    studentDOB: {
        type: Date
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})
pendingRequestSchema.index({ status: 1, classCode: 1, roles: 1 })
pendingRequestSchema.index({ status:1 })

const PendingRequest = mongoose.model("PendingRequest", pendingRequestSchema);

export default PendingRequest;