import { Router } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const router = Router();

router.post("/translate-text", async (req, res) => {
  const { text } = req.body as { text?: string };
  if (!text || text.trim().length === 0) {
    res.status(400).json({ error: "text required" });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content:
            "Du bist ein Übersetzer für Magic: The Gathering Regeltext. " +
            "Übersetze den gegebenen englischen Combo-Beschreibungstext ins Deutsche. " +
            "Behalte Kartennamen auf Englisch (z.B. 'Thassa's Oracle' bleibt unverändert). " +
            "Behalte die Nummerierung und Struktur exakt bei. " +
            "Antworte NUR mit dem übersetzten Text, ohne Präfix oder Erklärung.",
        },
        {
          role: "user",
          content: text.trim(),
        },
      ],
    });

    const translated = response.choices[0]?.message?.content?.trim() ?? text;
    res.json({ translated });
  } catch (err: any) {
    console.error("[translate-text] error:", err?.message);
    res.json({ translated: text }); // Fallback: return original
  }
});

export default router;
