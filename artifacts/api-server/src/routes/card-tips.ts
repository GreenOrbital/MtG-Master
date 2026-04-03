import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

router.post("/card-tips", async (req, res) => {
  const { cardName, typeLine, oracleText, keywords, manaCost, power, toughness } = req.body as {
    cardName?: string;
    typeLine?: string;
    oracleText?: string;
    keywords?: string[];
    manaCost?: string;
    power?: string;
    toughness?: string;
  };

  if (!cardName) {
    res.status(400).json({ error: "cardName is required" });
    return;
  }

  const cardInfo = [
    `Karte: ${cardName}`,
    typeLine ? `Typ: ${typeLine}` : null,
    manaCost ? `Manakosten: ${manaCost}` : null,
    power && toughness ? `Stärke/Widerstandskraft: ${power}/${toughness}` : null,
    keywords?.length ? `Schlüsselwörter: ${keywords.join(", ")}` : null,
    oracleText ? `Kartentext: ${oracleText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 220,
      messages: [
        {
          role: "system",
          content:
            "Du bist ein erfahrener Magic: The Gathering-Spieler und erklärst kurz und prägnant auf Deutsch, wann und in welchen Situationen eine Karte gespielt werden sollte. Schreibe 2–4 kurze, praktische Sätze ohne Überschrift oder Einleitung. Fokus auf: wann ist die Karte stark, in welchen Deck-Typen ist sie gut, worauf sollte man beim Einsatz achten.",
        },
        {
          role: "user",
          content: cardInfo,
        },
      ],
    });

    const tip = response.choices[0]?.message?.content?.trim() ?? "";
    res.json({ tip });
  } catch (err) {
    req.log.error({ err }, "card-tips error");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
