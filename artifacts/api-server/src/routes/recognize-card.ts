import { Router } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const router = Router();

router.post("/recognize-card", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 required" });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 60,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "low",
              },
            },
            {
              type: "text",
              text: 'This is a Magic: The Gathering card. Reply with ONLY the exact English card name as printed at the top of the card, nothing else. If you cannot clearly identify the card name, reply with exactly "UNKNOWN".',
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "UNKNOWN";
    req.log.info({ raw }, "recognize-card result");

    if (!raw || raw.toUpperCase() === "UNKNOWN") {
      res.json({ cardName: null });
      return;
    }

    // Strip surrounding quotes if model added them
    const cardName = raw.replace(/^["'`]+|["'`]+$/g, "").trim();
    res.json({ cardName });
  } catch (err) {
    req.log.error(err, "recognize-card failed");
    res.status(500).json({ error: "Recognition failed" });
  }
});

export default router;
