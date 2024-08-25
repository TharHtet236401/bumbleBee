import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    dateofBirth: {
        type: Date,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    schools: {
        type: [mongoose.Schema.Types.ObjectId], 
        ref: "School",
        required: true
    },
    classes: {
        type: [mongoose.Schema.Types.ObjectId], // Updated to reference ObjectId
        ref: 'Class',
        required: true
    },
    guardians: {
        type: [mongoose.Schema.Types.ObjectId], // Updated to reference ObjectId
        ref: 'User',
        required: true
    }

});

const Student = mongoose.model('Student', studentSchema);

export default Student;