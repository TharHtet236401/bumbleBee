import express from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import cookieParser from 'cookie-parser';
import { fileURLToPath } from "url";
import connectToMongoDB from "./config/connectMongoDb.js";


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
import imageRoute from "./routes/image.route.js";
import cookieRoute from "./routes/cookie.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Removed socket.io server creation
// const server = http.createServer(app);
// const io = new Server(server);

app.use(cors({
    origin: ['http://127.0.0.1:5501', 'http://localhost:5501'],  // Frontend URL
    credentials: true,  // Allow credentials (cookies)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    exposedHeaders: ['Set-Cookie'],
    path: '/' // Expose Set-Cookie header
}));

//for parsing the cookie
app.use(cookieParser());

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

//image
app.use("/api/image", imageRoute);

// cookie
app.use("/api/cookie", cookieRoute);

app.get("/", (req, res) => {
    res.send("<html> <h1>Server is running</h1> </html>");
});


app.use("*", (req, res) => {
    res.status(404).json({ con: false, msg: "Invalid route" });
});

// Error handling middleware
app.use((err, req, res, next) => {
    err.status = err.status || 505;
    res.status(err.status).json({ con: false, msg: err.message });
});


// Start the server
app.listen(3000, () => { 
    connectToMongoDB();
    console.log('Server is running on port 3000');
});

