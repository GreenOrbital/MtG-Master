import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

router.post("/card-tips", async (req, res) => {
  const { cardName, typeLine, oracleText, keywords, manaCost, power, toughness, colors, rarity } =
    req.body as {
      cardName?: string;
      typeLine?: string;
      oracleText?: string;
      keywords?: string[];
      manaCost?: string;
      power?: string;
      toughness?: string;
      colors?: string[];
      rarity?: string;
    };

  if (!cardName) {
    res.status(400).json({ error: "cardName is required" });
    return;
  }

  const colorNames: Record<string, string> = { W: "Weiß", U: "Blau", B: "Schwarz", R: "Rot", G: "Grün" };
  const colorStr = colors?.map((c) => colorNames[c] ?? c).join(", ") ?? "Farblos";

  const cardInfo = [
    `Karte: ${cardName}`,
    typeLine ? `Typ: ${typeLine}` : null,
    manaCost ? `Manakosten: ${manaCost}` : null,
    colors?.length ? `Farben: ${colorStr}` : null,
    power && toughness ? `Stärke/Widerstandskraft: ${power}/${toughness}` : null,
    rarity ? `Seltenheit: ${rarity}` : null,
    keywords?.length ? `Schlüsselwörter: ${keywords.join(", ")}` : null,
    oracleText ? `Kartentext: ${oracleText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `Du bist ein erfahrener Magic: The Gathering-Spieler und Coach. Erkläre auf Deutsch in 3–5 prägnanten Sätzen:
1. Wann ist diese Karte stark? In welchen Spielsituationen sollte man sie spielen?
2. In welchen Deck-Typen oder Strategien passt sie besonders gut?
3. Gibt es Karten oder Kombinationen, mit denen sie besonders gut synergiert?
Schreibe direkt ohne Einleitung oder Überschrift. Halte es praktisch und spielrelevant.`,
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
