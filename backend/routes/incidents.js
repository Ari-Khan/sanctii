import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Define (or reuse) the TriageRecord model here so this route never
// depends on triage.js having been loaded first.
const triageSchema = new mongoose.Schema({
  category:        String,
  message:         String,
  symptoms:        String,
  patient:         mongoose.Schema.Types.Mixed,
  healthCard:      mongoose.Schema.Types.Mixed,
  nearestHospital: mongoose.Schema.Types.Mixed,
  timestamp:       { type: Date, default: Date.now },
});
const TriageRecord =
  mongoose.models.TriageRecord ||
  mongoose.model("TriageRecord", triageSchema);

// GET /api/incidents
// Return the most recent triage record per unique patient (by email or name)
router.get("/", async (req, res) => {
  console.log("incidents route invoked; connection state=", mongoose.connection.readyState);
  console.log("using MONGO_URI", process.env.MONGO_URI && process.env.MONGO_URI.substring(0,60) + "...");
  try {
    // Fetch all records sorted newest-first, then deduplicate in JS.
    // This avoids $replaceRoot/$group aggregation bugs on older MongoDB versions.
    const all = await TriageRecord.find({}).sort({ timestamp: -1 }).lean();

    const seen = new Set();
    const incidents = [];
    for (const rec of all) {
      const key = rec.patient?.email || rec.patient?.name || String(rec._id);
      if (!seen.has(key)) {
        seen.add(key);
        incidents.push(rec);
      }
    }

    res.json(incidents);
  } catch (err) {
    console.error("Incidents fetch error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch incidents" });
  }
});

// POST /api/incidents — save a triage incident directly (no Gemini call)
router.post("/", async (req, res) => {
  try {
    const { category, message, patient, nearestHospital, symptoms } = req.body;
    if (!category || !patient) {
      return res.status(400).json({ error: "category and patient are required" });
    }
    const TriageRecord = mongoose.model("TriageRecord");
    const rec = new TriageRecord({
      category,
      message: message || "",
      symptoms: symptoms || "",
      patient: patient || {},
      healthCard: req.body.healthCard || null,
      nearestHospital: nearestHospital || null,
    });
    await rec.save();
    console.log(`Incident saved: ${category} for ${patient.name || patient.email}`);
    res.json({ ok: true, id: rec._id });
  } catch (err) {
    console.error("Incident save error", err);
    res.status(500).json({ error: err.message || "Failed to save incident" });
  }
});

// DELETE /api/incidents/:id — remove all triage records for that patient
router.delete("/:id", async (req, res) => {
  try {
    const TriageRecord = mongoose.model("TriageRecord");
    // Find the record first to get the patient info
    const record = await TriageRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: "Incident not found" });

    // Delete ALL records for the same patient so they don't reappear
    const email = record.patient?.email;
    const name = record.patient?.name;
    let result;
    if (email) {
      result = await TriageRecord.deleteMany({ "patient.email": email });
    } else if (name) {
      result = await TriageRecord.deleteMany({ "patient.name": name });
    } else {
      result = await TriageRecord.findByIdAndDelete(req.params.id);
    }
    console.log(`Incidents deleted for ${email || name}: ${result.deletedCount || 1} records`);
    res.json({ ok: true });
  } catch (err) {
    console.error("Incident delete error", err);
    res.status(500).json({ error: err.message || "Failed to delete incident" });
  }
});

export default router;