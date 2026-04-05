import { Router } from "express";

const router = Router();

type CSBUse = { card?: { name?: string; imageUriFrontSmall?: string }; quantity?: number };
type CSBProduce = { feature?: { name?: string } };
type CSBVariant = {
  id: string | number;
  uses?: CSBUse[];
  produces?: CSBProduce[];
  description?: string;
  popularity?: number;
};

router.post("/deck-combos", async (req, res) => {
  const { cardNames } = req.body as { cardNames?: string[] };
  if (!Array.isArray(cardNames) || cardNames.length === 0) {
    res.status(400).json({ error: "cardNames array required" });
    return;
  }

  const deckNameSet = new Set(cardNames.map((n) => n.toLowerCase().trim()));

  // Query at most 40 distinct card names in parallel to avoid hammering CSB
  const unique = [...new Set(cardNames.map((n) => n.trim()))].slice(0, 40);

  const fetches = unique.map((name) =>
    fetch(
      `https://backend.commanderspellbook.com/variants/?q=${encodeURIComponent(`card:"${name}"`)}`,
      { headers: { "User-Agent": "MtGKeywordsApp/1.0" }, signal: AbortSignal.timeout(8000) }
    )
      .then((r) => (r.ok ? (r.json() as Promise<{ results?: CSBVariant[] }>) : { results: [] }))
      .catch(() => ({ results: [] as CSBVariant[] }))
  );

  const responses = await Promise.all(fetches);

  // Collect unique combos by ID
  const comboMap = new Map<string, CSBVariant>();
  for (const data of responses) {
    for (const variant of data.results ?? []) {
      const key = String(variant.id);
      if (!comboMap.has(key)) comboMap.set(key, variant);
    }
  }

  // Keep only combos whose required cards are ALL present in the deck
  const matched = [...comboMap.values()].filter((v) => {
    const required = (v.uses ?? [])
      .map((u) => (u.card?.name ?? "").toLowerCase().trim())
      .filter(Boolean);
    return required.length > 0 && required.every((n) => deckNameSet.has(n));
  });

  // Sort by popularity desc (higher = more popular)
  matched.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

  const results = matched.slice(0, 20).map((v) => ({
    id: String(v.id),
    cards: (v.uses ?? []).map((u) => ({
      name: u.card?.name ?? "",
      imageSmall: u.card?.imageUriFrontSmall ?? undefined,
    })),
    produces: (v.produces ?? []).map((p) => p.feature?.name ?? "").filter(Boolean),
    description: v.description ?? "",
    popularity: v.popularity ?? 0,
  }));

  res.json({ results });
});

export default router;
