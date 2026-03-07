import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import users from "./routes/users.js";
import healthcard from "./routes/healthcard.js";
<<<<<<< HEAD
import triage from "./routes/triage.js";
=======
import feedback from "./routes/feedback.js";
>>>>>>> refs/remotes/origin/main
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();

// --- 1. VITALS DATABASE SETUP ---
const vitalSchema = new mongoose.Schema({
  pulse: String,
  breathing: String,
  status: String,
  timestamp: { type: Date, default: Date.now, expires: 3600 } // Auto-deletes after 1 hour to save space
});
const Vital = mongoose.model("Vital", vitalSchema);

console.log("Checking MONGO_URI in main:", !!process.env.MONGO_URI);

app.use(cors({ 
  origin: ["http://localhost:5176", "http://localhost:5173", "http://localhost:3000"], 
  credentials: true 
}));
app.use(express.json({ limit: "20mb" }));

// Mongo connection
if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Mongo connected"))
    .catch((err) => console.error("Mongo connection error:", err));
}

// --- 2. VITALS ROUTES (THE BRIDGE) ---

// For React to get the latest numbers
app.get("/api/vitals/latest", async (req, res) => {
  try {
    const latest = await Vital.findOne().sort({ timestamp: -1 });
    // Default to "--" if no data has been pushed yet
    res.json(latest || { pulse: "--", breathing: "--", status: "Offline" });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch vitals" });
  }
});

// For the C++ Engine to push data
app.post("/api/vitals/update", async (req, res) => {
  try {
    const { pulse, breathing, status } = req.body;
    const newVital = new Vital({ pulse, breathing, status });
    await newVital.save();
    console.log(`Vitals Logged: ${pulse} BPM / ${breathing} RPM`);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error saving vitals:", error);
    res.status(500).json({ error: "DB Save Failed" });
  }
});

// --- 3. EXISTING ROUTES ---
app.use("/api/users", users);
app.use("/api/healthcard", healthcard);
<<<<<<< HEAD
app.use("/api/triage", triage);
=======
app.use("/api/feedback", feedback);
>>>>>>> refs/remotes/origin/main

app.get("/api/distances", async (req, res) => {
  const { origins, destinations } = req.query;
  if (!origins || !destinations) {
    return res.status(400).json({ error: "Missing origins or destinations" });
  }
  try {
<<<<<<< HEAD
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || "AIzaSyCKqQCSCZoUCMSTkN1hzYOWm44bwClhDsE";
=======
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Google Maps API key not configured" });
    }
>>>>>>> refs/remotes/origin/main
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
app.listen(port, '0.0.0.0', () => console.log(`Sanctii Backend listening on all interfaces at ${port}`));