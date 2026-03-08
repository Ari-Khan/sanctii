import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// ── Mongoose schema & model ───────────────────────────────────────────────────
const feedbackSchema = new mongoose.Schema({
  patientName: { type: String, default: "Anonymous Patient" },
  doctorName: { type: String, required: true },
  liked: { type: String, default: "-" },
  improved: { type: String, default: "-" },
  date: { type: Date, default: Date.now },
});

// Virtual "id" so the frontend can use f.id (maps to _id)
feedbackSchema.set("toJSON", { virtuals: true });

const Feedback =
  mongoose.models.Feedback ||
  mongoose.model("Feedback", feedbackSchema);

// POST /api/feedback
router.post("/", async (req, res) => {
  try {
    const { patientName, doctorName, liked, improved, date } = req.body;
    if (!doctorName) return res.status(400).json({ error: "Doctor name required" });

    const doc = new Feedback({
      patientName: patientName || "Anonymous Patient",
      doctorName,
      liked: liked || "-",
      improved: improved || "-",
      date: date || new Date(),
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    console.error("Feedback save error:", err);
    res.status(500).json({ error: err.message || "Failed to save feedback" });
  }
});

// GET /api/feedback
router.get("/", async (req, res) => {
  try {
    const all = await Feedback.find({}).sort({ date: -1 }).lean();
    // Add string "id" field for frontend compatibility
    const result = all.map(f => ({ ...f, id: f._id.toString() }));
    res.json(result);
  } catch (err) {
    console.error("Feedback fetch error:", err);
    res.status(500).json({ error: err.message || "Failed to fetch feedback" });
  }
});

// DELETE /api/feedback/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Feedback.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Feedback not found" });
    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Feedback delete error:", err);
    res.status(500).json({ error: err.message || "Failed to delete feedback" });
  }
});

export default router;
