import express from "express";
import mongoose from "mongoose";

const router = express.Router();

const apptSchema = new mongoose.Schema({
  patient: String,
  type: String,
  doctor: String,
  day: Number,
  hour: Number,
  min: Number,
  dur: Number,
  color: String,
  severity: String,
  healthCard: mongoose.Schema.Types.Mixed,
  symptoms: String,
  nearestHospital: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});
const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", apptSchema);

// GET /api/schedule
router.get("/", async (req, res) => {
  try {
    const appts = await Appointment.find().sort({ day: 1, hour: 1, min: 1 });
    res.json(appts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/schedule — auto-find next free slot and book
router.post("/", async (req, res) => {
  try {
    const { patient, doctor, severity, healthCard, symptoms, nearestHospital } = req.body;

    const dur = severity === "emergency" ? 60 : 30;
    const color = severity === "emergency" ? "#A84040" : "#D4974A";
    const type = severity === "emergency" ? "Emergency Consult" : "Urgent Care";

    const now = new Date();
    const nowH = now.getHours();
    const nowM = now.getMinutes();

    const existing = await Appointment.find({ day: { $gte: 0 } });

    // Occupied slots set: "day-hour-min"
    const occupied = new Set();
    existing.forEach(a => {
      if (a.day == null) return;
      const slots = a.dur / 30;
      for (let s = 0; s < slots; s++) {
        const totalMin = a.hour * 60 + a.min + s * 30;
        occupied.add(`${a.day}-${Math.floor(totalMin / 60)}-${totalMin % 60}`);
      }
    });

    // Find next free slot starting just after current time
    let day = 0, h = Math.max(8, nowH), m = nowM < 30 ? 30 : 0;
    if (m === 0) h++;          // bump past current half-hour
    if (h >= 18) { h = 8; m = 0; day = 1; }

    let found = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      if (h >= 18) { h = 8; m = 0; day++; }
      if (day >= 5) break;

      // Check dur/30 consecutive slots free
      let clear = true;
      for (let s = 0; s < dur / 30; s++) {
        const totalMin = h * 60 + m + s * 30;
        if (occupied.has(`${day}-${Math.floor(totalMin / 60)}-${totalMin % 60}`)) { clear = false; break; }
      }
      if (clear) { found = true; break; }

      if (m === 0) m = 30;
      else { m = 0; h++; }
    }

    if (!found) return res.status(409).json({ error: "No available slots this week" });

    // Wait time from now to slot
    const nowTotalMin = Math.max(0, (nowH - 8) * 60 + nowM);
    const slotTotalMin = day * 10 * 60 + (h - 8) * 60 + m; // 10h work day
    const waitMin = Math.max(0, slotTotalMin - nowTotalMin);
    const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

    const appt = new Appointment({
      patient, type, doctor: doctor || "Dr. Roberts",
      day, hour: h, min: m, dur, color, severity,
      healthCard: healthCard || null,
      symptoms: symptoms || null,
      nearestHospital: nearestHospital || null,
    });
    await appt.save();

    return res.json({
      appointment: appt,
      waitTime: waitMin === 0 ? "Immediate" : `~${Math.ceil(waitMin / 15) * 15} min`,
      procedureTime: `${dur} min`,
      slot: `${DAYS[day]} at ${String(h).padStart(2, "0")}:${m === 0 ? "00" : "30"}`,
    });
  } catch (err) {
    console.error("Schedule POST error", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
