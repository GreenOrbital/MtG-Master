import { Router } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const router = Router();

async function validateWithScryfall(name: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`,
      { headers: { "User-Agent": "MtGKeywordsApp/1.0" } }
    );
    if (res.ok) {
      const data = (await res.json()) as { name: string };
      return data.name;
    }
    return null;
  } catch {
    return null;
  }
}

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
      max_tokens: 80,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "auto",
              },
            },
            {
              type: "text",
              text: [
                "This is a Magic: The Gathering card.",
                "The card name is the large text printed at the very top of the card frame, inside the name bar.",
                "The card may be in any language (English, German, French, etc.).",
                "Using your knowledge of Magic: The Gathering, return the ENGLISH canonical card name — even if the card shown is in another language.",
                "Return ONLY the English card name, nothing else, no punctuation, no explanation.",
                'If you cannot identify the card with confidence, return exactly "UNKNOWN".',
              ].join(" "),
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "UNKNOWN";
    req.log.info({ raw }, "recognize-card raw result");

    if (!raw || raw.toUpperCase() === "UNKNOWN") {
      res.json({ cardName: null });
      return;
    }

    // Strip surrounding quotes if model added them
    const detectedName = raw.replace(/^["'`]+|["'`]+$/g, "").trim();

    // Validate + correct via Scryfall fuzzy search
    const validatedName = await validateWithScryfall(detectedName);
    req.log.info({ detectedName, validatedName }, "recognize-card validated");

    res.json({ cardName: validatedName ?? detectedName });
  } catch (err) {
    req.log.error(err, "recognize-card failed");
    res.status(500).json({ error: "Recognition failed" });
  }
});

export default router;
