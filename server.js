import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import connectToMongoDB from "./config/connectMongoDb.js";
import http from "http";

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
const server = http.createServer(app);
const io = new Server(server);

app.use(
  cors({
    origin: ["http://127.0.0.1:5501", "http://localhost:5501"], // Frontend URL
    credentials: true, // Allow credentials (cookies)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    exposedHeaders: ["Set-Cookie"],
    path: "/", // Expose Set-Cookie header
  })
);

// For parsing the cookie
app.use(cookieParser());

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Auth API
app.use("/api/auth", authRoute);
app.use("/api/school", schoolRoute);
app.use("/api/class", classRoute);
app.use("/api/user", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/student", studentRoute);
app.use("/api/request", requestRoute);
app.use("/api/test/", testRoute);
app.use("/api/leaveRequest", leaveRequestRoute);
app.use("/api/leaveRequestType", leaveRequestTypeRoute);
app.use("/api/image", imageRoute);
app.use("/api/cookie", cookieRoute);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/index.html"));
});

app.use("*", (req, res) => {
  res.status(404).json({ con: false, msg: "Invalid route" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  err.status = err.status || 505;
  res.status(err.status).json({ con: false, msg: err.message });
});

//initialize socket
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.emit("greet", "hello your id is" + socket.id);

  socket.on("message", (message) => {
    console.log(message);
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    io.emit("userDisconnected", "A user has disconnected");
  });
});

io.on("connect_error", (err) => {
  console.error("Connection Error:", err);
});

// Start the server
server.listen(3000, () => {
  connectToMongoDB();
  console.log("Server is running on port 3000");
});
