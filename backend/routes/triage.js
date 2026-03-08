import express from "express";
import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";

const router = express.Router();

const triageSchema = new mongoose.Schema({
  category: String,
  message: String,
  symptoms: String,
  patient: mongoose.Schema.Types.Mixed,
  healthCard: mongoose.Schema.Types.Mixed,
  nearestHospital: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});
const TriageRecord = mongoose.models.TriageRecord || mongoose.model("TriageRecord", triageSchema);

// POST /api/triage
router.post("/", async (req, res) => {
  try {
    const { narrative, patient, nearestHospital } = req.body;
    if (!narrative || typeof narrative !== "string") {
      return res.status(400).json({ detail: "Narrative text required" });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ detail: "GEMINI_API_KEY not set" });
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a clinical triage assistant. A patient reports the following symptoms:\n"""\n${narrative}\n"""\n
Please provide a rating of either EMERGENCY, URGENT, or ROUTINE. For EMERGENCY or URGENT, provide a concise recommendation with a brief explanation (1-2 sentences). For ROUTINE, provide 1-2 sentences of practical self-care advice. Respond in format [SEVERITY]: [EXPLANATION_OR_ADVICE]. Do not append any other text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const cleanText = (txt) => {
      let t = txt.trim();
      if (t.startsWith("```") && t.endsWith("```")) {
        t = t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
      }
      t = t.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
      t = t.replace(/\\"/g, '"').replace(/\\'/g, "'");
      if (/^\{.*\}$/.test(t) && (t.match(/\{/g) || []).length === 1) {
        t = t.slice(1, -1).trim();
      }
      if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        t = t.slice(1, -1);
      }
      return t;
    };

    let result;
    try {
      result = JSON.parse(cleanText(response.text));
    } catch (e) {
      result = cleanText(response.text);
    }

    if (result && typeof result === "object" && !Array.isArray(result)) {
      const keys = Object.keys(result);
      if (keys.length === 1 && keys[0] === "raw") result = result.raw;
    }
    if (typeof result === "string") {
      result = result.trim();
      if ((result.startsWith('"') && result.endsWith('"')) || (result.startsWith("'") && result.endsWith("'"))) {
        result = result.slice(1, -1);
      }
    }

    // Determine category + explanation from either object or string format
    let saveCategory = null;
    let saveMessage = null;

    if (result && typeof result === "object" && result.category) {
      saveCategory = String(result.category).toLowerCase();
      saveMessage = result.explanation || result.message || "";
    } else if (typeof result === "string") {
      const upper = result.toUpperCase();
      if (upper.startsWith("EMERGENCY")) {
        saveCategory = "emergency";
      } else if (upper.startsWith("URGENT")) {
        saveCategory = "urgent";
      }
      saveMessage = result.includes(":") ? result.split(":").slice(1).join(":").trim() : result;
    }

    // Save to DB for urgent/emergency cases (visible in doctor portal)
    if (saveCategory === "emergency" || saveCategory === "urgent") {
      try {
        const rec = new TriageRecord({
          category: saveCategory,
          message: saveMessage,
          patient: patient || {},
          nearestHospital: nearestHospital || null,
        });
        await rec.save();
      } catch (saveErr) {
        console.error("Failed to save triage record", saveErr);
      }
    }

    return res.json({ result });
  } catch (err) {
    console.error("Triage error", err);
    return res.status(500).json({ detail: err.message || "Triage failed" });
  }
});

export default router;
