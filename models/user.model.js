import mongoose from "mongoose";    

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
    },
    email: {    
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {  //admin teacher guardian 
        type: String,
        required: true,
        unique: true
    },
    schools: {
        type: [mongoose.Schema.Types.ObjectId], // we can use the just the name of the school or objectId of the school
        ref: "School",
    },
    classes:{
        type: [mongoose.Schema.Types.ObjectId], // we can use  the classCode of the class or objectId of the class
        ref: 'Class'
    },
    childern:{
        type: [mongoose.Schema.Types.ObjectId], // Updated to reference ObjectId
        ref: 'Student'
    },
    roles: {
        type: [String],
        enum: ['admin', 'teacher', 'guardian'], // Added enum for specific roles
        required: true
    },
    relationship: {
        type: [String], // Added enum for specific roles
        required: true
    }
});

const User = mongoose.model('User', userSchema);

export default User;