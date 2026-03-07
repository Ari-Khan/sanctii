import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import users from "./routes/users.js";
import healthcard from "./routes/healthcard.js";
import feedback from "./routes/feedback.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

console.log("Checking MONGO_URI in main:", !!process.env.MONGO_URI);

app.use(cors({ origin: ["http://localhost:5176", "http://localhost:5173", "http://localhost:3000"], credentials: true }));
app.use(express.json({ limit: "20mb" }));

// Optional Mongo connection
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Mongo connected"))
    .catch((err) => {
      console.error("Mongo connection error:", err);
    });
} else {
  console.log("No MONGO_URI provided, skipping MongoDB connection");
}

app.use("/api/users", users);
app.use("/api/healthcard", healthcard);
app.use("/api/feedback", feedback);

app.get("/api/distances", async (req, res) => {
  const { origins, destinations } = req.query;
  if (!origins || !destinations) {
    return res.status(400).json({ error: "Missing origins or destinations" });
  }
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Google Maps API key not configured" });
    }
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origins)}&destinations=${encodeURIComponent(destinations)}&units=metric&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching distances:", error);
    res.status(500).json({ error: "Failed to fetch distances" });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server listening on ${port}`));
