import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

router.post("/deck-analysis", async (req, res) => {
  const { deckName, cards, totalCards, manaOk } = req.body as {
    deckName?: string;
    cards?: Array<{ name: string; count: number; type_line?: string; mana_cost?: string }>;
    totalCards?: number;
    manaOk?: boolean;
  };

  if (!cards || cards.length === 0) {
    res.status(400).json({ error: "cards is required" });
    return;
  }

  const cardList = cards
    .map(
      (c) =>
        `${c.count}x ${c.name}${c.mana_cost ? ` (${c.mana_cost})` : ""}${c.type_line ? ` [${c.type_line}]` : ""}`,
    )
    .join("\n");

  const deckInfo = [
    deckName ? `Deckname: ${deckName}` : null,
    `Gesamtkarten: ${totalCards ?? cards.reduce((a, c) => a + c.count, 0)}`,
    manaOk !== undefined
      ? `Manaverhältnis: ${manaOk ? "ausgewogen" : "unausgewogen"}`
      : null,
    `\nKartenliste:\n${cardList}`,
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
          content: `Du bist ein erfahrener Magic: The Gathering-Coach. Analysiere das folgende Deck auf Deutsch und gib folgende Punkte kompakt an:
1. Erkennbare Strategie/Deck-Archetype
2. Stärken des Decks
3. Schwachstellen oder fehlende Karten
4. Ein konkreter Verbesserungsvorschlag
Schreibe direkt, ohne Einleitung oder Nummerierung. Maximal 5–6 Sätze.`,
        },
        {
          role: "user",
          content: deckInfo,
        },
      ],
    });

    const analysis = response.choices[0]?.message?.content?.trim() ?? "";
    res.json({ analysis });
  } catch (err) {
    req.log.error({ err }, "deck-analysis error");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
