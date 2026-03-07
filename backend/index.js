import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import users from "./routes/users.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

console.log("Checking MONGO_URI in main:", !!process.env.MONGO_URI);

app.use(cors({ origin: "http://localhost:5176", credentials: true }));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Mongo connected"))
  .catch((err) => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });

app.use("/api/users", users);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server listening on ${port}`));
