import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

router.post("/card-synergies", async (req, res) => {
  const { cardName, typeLine, oracleText, keywords, colors } = req.body as {
    cardName?: string;
    typeLine?: string;
    oracleText?: string;
    keywords?: string[];
    colors?: string[];
  };

  if (!cardName) {
    res.status(400).json({ error: "cardName is required" });
    return;
  }

  const cardInfo = [
    `Karte: ${cardName}`,
    typeLine ? `Typ: ${typeLine}` : null,
    keywords?.length ? `Schlüsselwörter: ${keywords.join(", ")}` : null,
    oracleText ? `Kartentext: ${oracleText}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 120,
      messages: [
        {
          role: "system",
          content: `Du bist ein Magic: The Gathering-Experte. Gib genau 5 Kartennamen zurück (auf Englisch, exakte offizielle Schreibweise), die sehr gut mit der genannten Karte synergieren oder starke Kombos/Sequenzen ermöglichen. Antworte NUR mit einem JSON-Array, keine Erklärungen: ["Name1","Name2","Name3","Name4","Name5"]`,
        },
        {
          role: "user",
          content: cardInfo,
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() ?? "[]";
    let cards: string[] = [];
    try {
      const match = content.match(/\[[\s\S]*?\]/);
      cards = JSON.parse(match?.[0] ?? "[]");
    } catch {
      cards = [];
    }
    res.json({ cards: cards.filter((c) => typeof c === "string").slice(0, 5) });
  } catch (err) {
    req.log.error({ err }, "card-synergies error");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
