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

export default router;