import express from "express";
import { GoogleGenAI } from "@google/genai";
import Healthcard from "../models/Healthcard.js";

const router = express.Router();

const PROMPT = `
Analyze this health card image carefully and extract ALL visible information.

Look for these specific fields:
- Full name (first, middle, last)
- Date of birth (DOB, BORN, NAISSANCE)
- Health card number (usually 10 digits, may have dashes)
- Version code (usually 2 letters after the card number)
- Expiry date (EXP, EXPIRY, VALID UNTIL)
- Gender/Sex (M/F)
- Province (Ontario, BC, Alberta, etc.)
- Issue date (if visible)

Return the data as a JSON object with these exact keys:
{
    "full_name": "First Middle Last",
    "date_of_birth": "YYYY-MM-DD",
    "card_number": "1234-567-890",
    "version_code": "XX",
    "expiry_date": "YYYY-MM-DD",
    "gender": "M or F",
    "province": "ON, BC, AB, etc.",
    "issue_date": "YYYY-MM-DD",
    "confidence": "high, medium, or low",
    "notes": "any issues or unclear text"
}

Use null for any field you cannot read clearly.
Format all dates as YYYY-MM-DD.
Format card numbers with dashes: XXXX-XXX-XXX

IMPORTANT: Only return the JSON object, no other text.
`;

function parseGeminiResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/```json?\n?/, "").replace(/```\n?$/, "");
  }
  const data = JSON.parse(cleaned);
  const confidenceMap = { high: 0.95, medium: 0.75, low: 0.5 };
  data.confidence = confidenceMap[data.confidence] || 0.75;
  return data;
}

// POST /api/healthcard/scan-base64
router.post("/scan-base64", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ detail: "GEMINI_API_KEY not set" });

    const ai = new GoogleGenAI({ apiKey });

    let imageData = req.body.image;
    if (!imageData) return res.status(400).json({ detail: "No image provided" });

    let mimeType = "image/png";
    if (imageData.includes(",")) {
      const header = imageData.split(",")[0];
      const mimeMatch = header.match(/data:(image\/\w+);/);
      if (mimeMatch) mimeType = mimeMatch[1];
      imageData = imageData.split(",")[1];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType, data: imageData } },
          ],
        },
      ],
    });

    const result = parseGeminiResponse(response.text);
    return res.json(result);
  } catch (err) {
    console.error("Healthcard scan error:", err);
    return res.status(500).json({ detail: err.message || "Scan failed" });
  }
});

// POST /api/healthcard/save
// Body: { email, full_name, card_number, ... , source: "scan"|"manual" }
router.post("/save", async (req, res) => {
  try {
    const { email, ...cardData } = req.body;
    if (!email) return res.status(400).json({ detail: "email is required" });

    const card = await Healthcard.findOneAndUpdate(
      { email },
      { ...cardData, updatedAt: new Date() },
      { upsert: true, new: true, runValidators: true }
    );
    return res.json(card);
  } catch (err) {
    console.error("Save healthcard error:", err);
    return res.status(500).json({ detail: err.message });
  }
});

// GET /api/healthcard?email=foo@bar.com
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ detail: "email query param required" });

    const card = await Healthcard.findOne({ email });
    if (!card) return res.status(404).json({ detail: "No healthcard found" });
    return res.json(card);
  } catch (err) {
    console.error("Get healthcard error:", err);
    return res.status(500).json({ detail: err.message });
  }
});

// POST /api/healthcard/validate
router.post("/validate", (req, res) => {
  const data = req.body;
  const errors = [];
  if (!data.full_name || data.full_name.trim().length < 2) errors.push("Full name is required");
  if (!data.card_number) errors.push("Health card number is required");
  if (!data.date_of_birth) errors.push("Date of birth is required");
  if (errors.length) return res.status(400).json({ valid: false, errors });
  return res.json({ valid: true, errors: [], message: "Health card data is valid" });
});

export default router;
