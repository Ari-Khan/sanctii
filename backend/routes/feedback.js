import express from "express";

const router = express.Router();

// In-memory array for feedback data. (Resets on server restart).
let feedbacks = [];

// POST /api/feedback
router.post("/", (req, res) => {
  const { patientName, doctorName, liked, improved, date } = req.body;
  if (!doctorName) return res.status(400).json({ error: "Doctor name required" });
  
  const newFeedback = {
    id: Date.now().toString(),
    patientName: patientName || "Anonymous Patient",
    doctorName,
    liked: liked || "-",
    improved: improved || "-",
    date: date || new Date().toISOString()
  };
  feedbacks.unshift(newFeedback);
  res.status(201).json(newFeedback);
});

// GET /api/feedback
router.get("/", (req, res) => {
  res.json(feedbacks);
});

// DELETE /api/feedback/:id
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const initialLength = feedbacks.length;
  feedbacks = feedbacks.filter(f => f.id !== id);
  if (feedbacks.length === initialLength) {
    return res.status(404).json({ error: "Feedback not found" });
  }
  res.status(200).json({ message: "Deleted successfully" });
});

export default router;
