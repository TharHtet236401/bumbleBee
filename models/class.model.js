import mongoose from "mongoose";

const classSchema = new mongoose.Schema({
  grade: {
    type: String,
    required: true,
    index: true,
  },
  className: {
    type: String,
    required: true,
    index: true,
  },
  classCode: {
    type: String,
    unique: true,
    required: true,
  },
  school: {
    type: mongoose.Schema.ObjectId,
    ref: "School",
    required: true,
  },
  students: {
    type: [mongoose.Schema.Types.ObjectId], // Updated to reference ObjectId
    ref: "Student",
  },
  teachers: {
    type: [mongoose.Schema.Types.ObjectId], // Updated to reference ObjectId
    ref: "User",
  },
  guardians: {
    type: [mongoose.Schema.Types.ObjectId], // Updated to reference ObjectId
    ref: "User",
  },
  announcements: {
    type: [mongoose.Schema.Types.ObjectId], // Updated to reference ObjectId
    ref: "Announcement",
  },
});

const Class = mongoose.model("Class", classSchema);

export default Class;
