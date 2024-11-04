import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
const app = express();
const server = http.createServer(app);
import { tokenFromSocket } from "../utils/validator.js";
import { setObj, getObj, delObj } from "../utils/redis.js";

app.use(
  cors({
    origin: [
      "http://127.0.0.1:5501", // Localhost development URLs
      "http://localhost:5501",
      "http://localhost:3000",
      "https://159.223.127.127", // Frontend production URL
      "https://68.183.135.203", // Backend production URL
    ],
    credentials: true, // Allow credentials (cookies)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    exposedHeaders: ["Set-Cookie"],
    path: "/",
    sameSite: "None",
    secure: true, // Expose Set-Cookie header
  })
);

const io = new Server(server, {
  cors: {
    origin: [
      "http://127.0.0.1:5501", // Localhost development URLs
      "http://localhost:5501",
      "http://localhost:3000",
      "https://159.223.127.127", // Frontend production URL
      "https://68.183.135.203", // Backend production URL
    ],
    methods: ["GET", "POST"],
  },
});

io.of("/chat")
  .use(async (socket, next) => {
    // console.log("Middleware running for socket:", socket.id);
    try {
      await tokenFromSocket(socket, next);
    } catch (error) {
      next(new Error("Authentication error"));
    }
  })
  .on("connection", async (socket) => {
    try {
      //   console.log("New connection on /chat namespace:", socket.id);
      //   console.log("User:", socket.currentUser);

      const userId = socket.currentUser._id.toString();

      // Store user's socket ID in Redis
      await setObj(`user_socket:${userId}`, socket.id);
      //   console.log("Updated user-socket mapping for:", userId);

      // Send welcome message and socket ID to the client
      socket.emit("welcome", socket.currentUser);
      socket.emit("socketId", socket.id);

      // Check and send any offline messages
      const offlineMessages = await getObj(`offline_messages:${userId}`);
      if (offlineMessages && offlineMessages.length > 0) {
        socket.emit("offlineMessages", offlineMessages);
        await delObj(`offline_messages:${userId}`);
        // console.log("Sent offline messages to user:", userId);
      }

      // Handle new messages from this socket
      socket.on("sendMessage", async (data) => {
        // console.log("Received message from user:", userId);

        io.of("/chat").to(data.receiverId).emit("newMessage", data.message);
      });

      socket.on("disconnect", async () => {
        // console.log("User disconnected:", userId);
        await delObj(`user_socket:${userId}`);
      });
    } catch (error) {
      console.error("Error in socket connection:", error);
      socket.disconnect(true);
    }
  });

// Error handling for io
io.on("connect_error", (err) => {
  console.error("Connection Error:", err);
});

export { app, io, server };
