import express from "express";
import dotenv from "dotenv";
import connectToMongoDB from "./db/connectMongoDb.js";

dotenv.config();

import testingRoute from "./routes/testing.route.js";
import authRoute from "./routes/auth.route.js";
import schoolRoute from "./routes/school.route.js";
import classRoute from "./routes/class.route.js";

const app = express();
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use("/api/testing", testingRoute);
app.use("/api/auth", authRoute);
app.use("/api/school", schoolRoute);
app.use("/api/class", classRoute);

app.listen(process.env.PORT, () => {
  connectToMongoDB();
  console.log(`Server is running on port ${process.env.PORT}`);
});
