import express from "express";
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

import connectToMongoDB from "./db/connectMongoDb.js";

dotenv.config();

import testingRoute from "./routes/testing.route.js";
import authRoute from "./routes/auth.route.js";
import schoolRoute from "./routes/school.route.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();



// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads/post_images', express.static(path.join(__dirname, 'uploads/post_images')));

// testing api
app.use("/api/testing", testingRoute);

// auth api
app.use("/api/auth", authRoute);

// auth school
app.use("/api/school", schoolRoute);

// auth user
app.use("/api/user", userRoute);

// auth posts
app.use("/api/posts", postRoute);

app.listen(process.env.PORT, () => {
    connectToMongoDB();
    console.log(`Server is running on port ${process.env.PORT}`);
});
