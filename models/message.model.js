import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class"
    },
    message: {
      type: String,
    },
    image: {
      type: [String],
      default: null,
    },
    document: {
      type: [String],
      default: null,
    },
    isGroupMessage: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
export default Message;
