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

export default router;
