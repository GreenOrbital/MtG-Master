import { Router } from "express";
import OpenAI from "openai";

const router = Router();

const openai = new OpenAI({
  baseURL: process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"],
  apiKey: process.env["AI_INTEGRATIONS_OPENAI_API_KEY"] ?? "dummy",
});

type ScryfallCard = {
  id: string;
  name: string;
  printed_name?: string;
  type_line?: string;
  image_uris?: { normal?: string };
  card_faces?: Array<{ image_uris?: { normal?: string } }>;
};

router.post("/card-synergies", async (req, res) => {
  const { cardName, typeLine, oracleText, keywords } = req.body as {
    cardName?: string;
    typeLine?: string;
    oracleText?: string;
    keywords?: string[];
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
    // Step 1: Get synergy card names from AI
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `You are a Magic: The Gathering expert. List exactly 5 English card names that synergize strongly with the given card or enable powerful combos/sequences. Reply with only the 5 card names separated by commas, nothing else. Example format: Lightning Bolt, Goblin Guide, Monastery Swiftspear, Shard Volley, Rift Bolt`,
        },
        {
          role: "user",
          content: cardInfo,
        },
      ],
    });

    const content = aiResponse.choices[0]?.message?.content?.trim() ?? "";

    // Parse comma-separated card names
    const names: string[] = content
      .split(",")
      .map((n) => n.trim().replace(/^["'\d.\-\s]+|["'\s]+$/g, ""))
      .filter((n) => n.length > 1 && n.length < 60)
      .slice(0, 5);

    if (names.length === 0) {
      res.json({ cards: [] });
      return;
    }

    // Step 2: Fetch card data from Scryfall on the server (no CORS issues)
    const collectionRes = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MtGKeywordsApp/1.0",
      },
      body: JSON.stringify({ identifiers: names.map((name) => ({ name })) }),
    });

    if (!collectionRes.ok) {
      // Fallback: return just names without images
      res.json({ cards: names.map((name) => ({ id: name, name, imageUri: null, type_line: null })) });
      return;
    }

    const collectionData = (await collectionRes.json()) as { data: ScryfallCard[] };
    const cards = (collectionData.data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      printed_name: c.printed_name ?? null,
      imageUri: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal ?? null,
      type_line: c.type_line ?? null,
    }));

    res.json({ cards });
  } catch (err) {
    req.log.error({ err }, "card-synergies error");
    res.status(500).json({ error: "internal_error" });
  }
});

export default router;
