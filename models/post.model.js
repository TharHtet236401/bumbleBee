import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    posted_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
    },
    heading: {
      type: String,
      required: true,
    },
    body: {
      type: String,
    },
    contentPicture: {
      type: String,
    },
    contentType: {
      type: String,
      enum: ["announcement", "feed"], //annoucment class, general feed for whole school
      required: true,
      index: true,
    },
    reactions: {
      type: Number,
      default: 0,
    },
    documents: [{ type: String }], // Array of document URLs
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

postSchema.index({ contentType: 1 });
const Post = mongoose.model("Post", postSchema);

export default Post;
