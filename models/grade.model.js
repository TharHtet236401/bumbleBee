import mongoose from "mongoose";

const gradeSchemma = new mongoose.Schema({
    gradeName: {
        type: String, 
        required: true
    },
    school: {
        type: String, 
        required: true
    }
});

const Grade = mongoose.model("Grade", gradeSchema);

export default Grade;