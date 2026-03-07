import express from "express";
import { GoogleGenAI } from "@google/genai";

const router = express.Router();

// POST /api/triage
// Body: { narrative: "..." }
// Uses Gemini to generate a clinical triage response based on patient narrative.
router.post("/", async (req, res) => {
  try {
    const { narrative } = req.body;
    if (!narrative || typeof narrative !== "string") {
      return res.status(400).json({ detail: "Narrative text required" });
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ detail: "GEMINI_API_KEY not set" });
    }
    const ai = new GoogleGenAI({ apiKey });

    // simple prompt to classify severity and suggest next step
    const prompt = `You are a clinical triage assistant. A patient reports the following symptoms:\n"""\n${narrative}\n"""\n
Please provide a rating of either EMERGENCY, URGENT, or ROUTINE, along with a concise triage recommendation with a brief explanation (1-2 sentences). Respond in format [SEVERITY]: [EXPLANATION]. Do not append any other text.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    // sanitize & parse the AI text
    const cleanText = (txt) => {
      let t = txt.trim();
      if (t.startsWith("```") && t.endsWith("```")) {
        t = t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "");
      }
      // remove escape sequences that might be inserted
      t = t.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
      // unescape any escaped internal quotes
      t = t.replace(/\\"/g, '"').replace(/\\'/g, "'");
      // strip surrounding braces or quotes that sometimes wrap the answer
      if (/^\{.*\}$/.test(t) && (t.match(/\{/g) || []).length === 1) {
        t = t.slice(1, -1).trim();
      }
      if ((t.startsWith("\"") && t.endsWith("\"")) || (t.startsWith("'") && t.endsWith("'"))) {
        t = t.slice(1, -1);
      }
      return t;
    };

    let result;
    try {
      result = JSON.parse(cleanText(response.text));
    } catch (e) {
      // fallback: return cleaned raw text directly
      result = cleanText(response.text);
    }

    // if parsing succeeded but returned an object with a single `raw` key, unwrap it
    if (result && typeof result === "object" && !Array.isArray(result)) {
      const keys = Object.keys(result);
      if (keys.length === 1 && keys[0] === "raw") {
        result = result.raw;
      }
    }
    // if result is string we already cleaned it; make sure no stray surrounding quotes
    if (typeof result === "string") {
      result = result.trim();
      if ((result.startsWith('"') && result.endsWith('"')) ||
          (result.startsWith("'") && result.endsWith("'"))) {
        result = result.slice(1, -1);
      }
    }

    return res.json({ result });
  } catch (err) {
    console.error("Triage error", err);
    return res.status(500).json({ detail: err.message || "Triage failed" });
  }
});

export default router;