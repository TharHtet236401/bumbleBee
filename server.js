import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectToMongoDB from "./config/connectMongoDb.js";
// import { createProfilePicturesBucketIfNotExists } from './utils/supabaseUpload.js';

dotenv.config();

import authRoute from "./routes/auth.route.js";
import schoolRoute from "./routes/school.route.js";
import classRoute from "./routes/class.route.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";
import studentRoute from "./routes/student.route.js";
import requestRoute from "./routes/request.route.js";
import testRoute from "./routes/test.route.js";
import leaveRequestRoute from "./routes/leaveRequest.route.js";
import leaveRequestTypeRoute from "./routes/leaveRequestType.route.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
    "/uploads/post_images",
    express.static(path.join(__dirname, "uploads/post_images"))
);
app.use(
    "/uploads/profile_pictures",
    express.static(path.join(__dirname, "uploads/profile_pictures"))
);

// auth api
app.use("/api/auth", authRoute);

// auth school
app.use("/api/school", schoolRoute);
app.use("/api/class", classRoute);

// auth user
app.use("/api/user", userRoute);

// auth posts
app.use("/api/posts", postRoute);

//student
app.use("/api/student", studentRoute);

// request
app.use("/api/request", requestRoute);

app.use("/api/test/", testRoute);

//this is for the leave request for the guardians to make for their children
app.use("/api/leaveRequest", leaveRequestRoute);

//this is to create the leave request type like sick leave, annual leave, etc 
app.use("/api/leaveRequestType", leaveRequestTypeRoute);

app.use("*", (req, res) => {
    res.status(404).json({ con: false, msg: "Invalid route" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    err.status = err.status || 505;
    res.status(err.status).json({ con: false, msg: err.message });
});

// createProfilePicturesBucketIfNotExists();

app.listen(process.env.PORT, () => {
    connectToMongoDB();
    console.log(`Server is running on port ${process.env.PORT}`);
});
