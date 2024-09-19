import mongoose from "mongoose";

const requestTypesSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    }
});

const RequestTypes = mongoose.model("RequestTypes", requestTypesSchema);

export default RequestTypes;
