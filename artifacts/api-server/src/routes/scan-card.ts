import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

type ScryfallCard = {
  name: string;
  oracle_text?: string;
  keywords?: string[];
  type_line?: string;
  mana_cost?: string;
  power?: string;
  toughness?: string;
  set_name?: string;
  image_uris?: { normal?: string; small?: string };
};

async function fetchScryfallCard(name: string): Promise<ScryfallCard | null> {
  try {
    const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "MtGKeywordsApp/1.0" },
    });
    if (!res.ok) return null;
    return (await res.json()) as ScryfallCard;
  } catch {
    return null;
  }
}

router.post("/scan-card", async (req, res) => {
  const { imageBase64 } = req.body as { imageBase64?: string };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 is required" });
    return;
  }

  try {
    // Use vision to extract the card name from the top of the card
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 64,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'This is a Magic: The Gathering card. Look at the card name printed at the TOP of the card (the large text at the very top of the card frame). Return ONLY the exact card name, nothing else. If you cannot clearly read the card name, return "UNKNOWN".',
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
                detail: "low",
              },
            },
          ],
        },
      ],
    });

    const rawName = visionResponse.choices[0]?.message?.content?.trim() ?? "UNKNOWN";
    const cardName = rawName.replace(/^["']|["']$/g, "").trim();

    if (cardName === "UNKNOWN" || cardName.length < 2) {
      res.status(422).json({ error: "card_not_recognized", message: "Kartenname nicht erkannt" });
      return;
    }

    // Query Scryfall for the card
    const card = await fetchScryfallCard(cardName);

    if (!card) {
      res.status(404).json({
        error: "card_not_found",
        message: `Karte "${cardName}" nicht in Scryfall gefunden`,
        detectedName: cardName,
      });
      return;
    }

    res.json({
      detectedName: cardName,
      cardName: card.name,
      keywords: card.keywords ?? [],
      oracleText: card.oracle_text ?? "",
      typeLine: card.type_line ?? "",
      manaCost: card.mana_cost ?? "",
      power: card.power,
      toughness: card.toughness,
      setName: card.set_name ?? "",
      imageUri: card.image_uris?.normal ?? card.image_uris?.small,
    });
  } catch (err) {
    req.log.error({ err }, "scan-card error");
    res.status(500).json({ error: "internal_error", message: "Serverfehler beim Scannen" });
  }
});

export default router;
