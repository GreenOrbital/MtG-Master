import { Router } from "express";

const router = Router();

type CSBUse = { card?: { name?: string; imageUriFrontSmall?: string }; quantity?: number; templateName?: string };
type CSBProduce = { feature?: { name?: string } };
type CSBVariant = {
  id: string | number;
  uses?: CSBUse[];
  produces?: CSBProduce[];
  description?: string;
  popularity?: number;
};

// Normalize a card name: strip everything after " // " (split cards), lowercase, trim
function normalizeName(name: string): string {
  return name.split(" // ")[0].toLowerCase().trim();
}

// Fetch all variants from CSB for a single card name, with retry
async function fetchVariantsForCard(name: string): Promise<CSBVariant[]> {
  const url = `https://backend.commanderspellbook.com/variants/?q=${encodeURIComponent(`card:"${name}"`)}`;
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": "MtGKeywordsApp/1.0", Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return [];
    const data = (await r.json()) as { results?: CSBVariant[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

router.post("/deck-combos", async (req, res) => {
  const { cardNames } = req.body as { cardNames?: string[] };
  if (!Array.isArray(cardNames) || cardNames.length === 0) {
    res.status(400).json({ error: "cardNames array required" });
    return;
  }

  // Build a normalized name set for the full deck (no limit)
  const deckNameSet = new Set(cardNames.map(normalizeName));

  // Unique card names (normalized for querying), no artificial cap
  // Use the ORIGINAL names for querying CSB (they use their own canonical names)
  const uniqueOriginal = [...new Set(cardNames.map((n) => n.trim()))];

  // Batch requests in groups of 20 to avoid overwhelming CSB
  const BATCH = 20;
  const comboMap = new Map<string, CSBVariant>();

  for (let i = 0; i < uniqueOriginal.length; i += BATCH) {
    const batch = uniqueOriginal.slice(i, i + BATCH);
    const fetched = await Promise.all(batch.map((name) => fetchVariantsForCard(name)));
    for (const variants of fetched) {
      for (const v of variants) {
        const key = String(v.id);
        if (!comboMap.has(key)) comboMap.set(key, v);
      }
    }
    // Small pause between batches to be polite to CSB
    if (i + BATCH < uniqueOriginal.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // Keep combos where all SPECIFIC card requirements are satisfied by the deck.
  // Template uses (uses without a card name, e.g. "any zombie") are skipped —
  // we count them as satisfied if at least the other cards are present.
  const matched = [...comboMap.values()].filter((v) => {
    const specificRequired = (v.uses ?? [])
      .map((u) => normalizeName(u.card?.name ?? ""))
      .filter(Boolean);

    if (specificRequired.length === 0) return false;

    // All specific cards must be in the deck
    return specificRequired.every((n) => deckNameSet.has(n));
  });

  // Sort by popularity desc
  matched.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

  const results = matched.slice(0, 30).map((v) => ({
    id: String(v.id),
    cards: (v.uses ?? [])
      .filter((u) => u.card?.name)
      .map((u) => ({
        name: u.card!.name!,
        imageSmall: u.card?.imageUriFrontSmall ?? undefined,
      })),
    produces: (v.produces ?? []).map((p) => p.feature?.name ?? "").filter(Boolean),
    description: v.description ?? "",
    popularity: v.popularity ?? 0,
  }));

  res.json({ results });
});

export default router;
