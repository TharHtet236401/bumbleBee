import mongoose from "mongoose";

const schoolSchema = new mongoose.Schema({
    schoolName: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    address: {
        type: String,
        required: true,
    },
    classes: {
        type: [mongoose.Schema.Types.ObjectId], // Updated to reference ObjectId
        ref: "Class",
    },
    gradeNames:{
        type:[String],
        required:true,
    },
    classNames:{
        type:[String],
       
    },
});

const School = mongoose.model("School", schoolSchema);

export default School;
