import express from "express";
import dotenv from "dotenv";
import connectToMongoDB from "./db/connectMongoDb.js";

dotenv.config();

import authRoute from "./routes/auth.route.js";
import schoolRoute from "./routes/school.route.js";
import userRoute from "./routes/user.route.js";
import postRoute from "./routes/post.route.js";

const app = express();

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// auth api
app.use("/api/auth", authRoute);

// auth school
app.use("/api/school", schoolRoute);

// auth user
app.use("/api/user", userRoute);

// auth posts
app.use("/api/posts", postRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  err.status = err.status || 505;
  res.status(err.status).json({ con: false, "message": err.message });
});


app.listen(process.env.PORT, () => {
  connectToMongoDB();
  console.log(`Server is running on port ${process.env.PORT}`);
});
