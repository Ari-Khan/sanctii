import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// GET /api/incidents
// Return most recent triage record per patient (grouped by email/name)
router.get("/", async (req, res) => {
  try {
    const TriageRecord = mongoose.model("TriageRecord");
    const incidents = await TriageRecord.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: { email: "$patient.email", name: "$patient.name" },
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
    ]);
    res.json(incidents);
  } catch (err) {
    console.error("Incidents fetch error", err);
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

export default router;