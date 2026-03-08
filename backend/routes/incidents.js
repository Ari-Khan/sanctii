import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// GET /api/incidents
// Return most recent triage record per patient (grouped by email/name)
router.get("/", async (req, res) => {
  console.log("incidents route invoked; connection state=", mongoose.connection.readyState);
  console.log("using MONGO_URI", process.env.MONGO_URI && process.env.MONGO_URI.substring(0,60) + "...");
  try {
    const TriageRecord = mongoose.model("TriageRecord");
    if (!TriageRecord) throw new Error("TriageRecord model missing");
    const incidents = await TriageRecord.aggregate([
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            email: { $ifNull: ["$patient.email", ""] },
            name:  { $ifNull: ["$patient.name", ""] }
          },
          doc: { $first: "$$ROOT" },
        },
      },
      { $replaceRoot: { newRoot: "$doc" } },
    ]);
    res.json(incidents);
  } catch (err) {
    console.error("Incidents fetch error", err);
    res.status(500).json({ error: err.message || "Failed to fetch incidents", stack: err.stack });
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