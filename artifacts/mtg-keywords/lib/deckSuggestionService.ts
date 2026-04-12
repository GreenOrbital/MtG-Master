import { getArchetypesByFormat, findArchetype, type CardSlot } from "./deckArchetypes";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ScryfallCard = {
  id: string;
  name: string;
  nameDe: string;
  mana_cost: string;
  cmc: number;
  type_line: string;
  oracle_text: string;
  oracle_text_de: string;
  keywords: string[];
  imageUri: string | null;
  priceEur: number | null;
  priceUsd: number | null;
  colors: string[];
  color_identity: string[];
  rarity: string;
  set_name: string;
  legalities: Record<string, string>;
};

export type SuggestedCard = ScryfallCard & {
  count: number;
  roleDe: string;
  roleEn: string;
};

export type DeckSuggestion = {
  key: string;
  format: string;
  deckSize: number;
  labelDe: string;
  labelEn: string;
  colors: string[];
  colorHex: string;
  icon: string;
  tagsDe: string[];
  tagsEn: string[];
  summaryDe: string;
  summaryEn: string;
  whyDe: string;
  whyEn: string;
  totalCards: number;
  commanderCard: SuggestedCard | null;
  deckCards: SuggestedCard[];
  landCards: SuggestedCard[];
};

export type ArchetypeMeta = {
  key: string;
  format: string;
  deckSize: number;
  labelDe: string;
  labelEn: string;
  colors: string[];
  colorHex: string;
  icon: string;
  tagsDe: string[];
  tagsEn: string[];
  summaryDe: string;
  summaryEn: string;
};

// ─── In-memory cache ────────────────────────────────────────────────────────
const cardCache = new Map<string, ScryfallCard>();

// ─── Parse raw Scryfall card into our type ──────────────────────────────────
function parseCard(data: any): ScryfallCard {
  const imageUri =
    data.image_uris?.normal ??
    data.card_faces?.[0]?.image_uris?.normal ??
    null;
  return {
    id: data.id,
    name: data.name,
    nameDe: data.name,
    mana_cost: data.mana_cost ?? "",
    cmc: data.cmc ?? 0,
    type_line: data.type_line ?? "",
    oracle_text: data.oracle_text ?? data.card_faces?.[0]?.oracle_text ?? "",
    oracle_text_de: data.oracle_text ?? data.card_faces?.[0]?.oracle_text ?? "",
    keywords: data.keywords ?? [],
    imageUri,
    priceEur: data.prices?.eur ? parseFloat(data.prices.eur) : null,
    priceUsd: data.prices?.usd ? parseFloat(data.prices.usd) : null,
    colors: data.colors ?? data.card_faces?.[0]?.colors ?? [],
    color_identity: data.color_identity ?? [],
    rarity: data.rarity ?? "",
    set_name: data.set_name ?? "",
    legalities: data.legalities ?? {},
  };
}

// ─── Normalize name for matching (handles DFC "Front // Back" → "Front") ────
function normalizeName(n: string) {
  return n.split(" // ")[0].trim().toLowerCase();
}

// ─── Scryfall Collection API — up to 75 cards in ONE request ────────────────
async function fetchCardsCollection(names: string[]): Promise<Map<string, ScryfallCard>> {
  const result = new Map<string, ScryfallCard>();

  // Serve from cache first
  const uncached = names.filter((n) => !cardCache.has(n));
  for (const n of names) {
    if (cardCache.has(n)) result.set(n, cardCache.get(n)!);
  }
  if (uncached.length === 0) return result;

  // Scryfall collection allows max 75 identifiers per request
  const CHUNK = 75;
  for (let i = 0; i < uncached.length; i += CHUNK) {
    const chunk = uncached.slice(i, i + CHUNK);
    // Build a lookup: normalizedName → requested slot name
    const normalizedToRequested = new Map<string, string>();
    for (const n of chunk) normalizedToRequested.set(normalizeName(n), n);

    try {
      const res = await fetch("https://api.scryfall.com/cards/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifiers: chunk.map((name) => ({ name })),
        }),
      });
      if (!res.ok) continue;
      const json = await res.json() as { data: any[]; not_found?: any[] };
      for (const raw of json.data ?? []) {
        const card = parseCard(raw);
        const canonicalName = raw.name as string;
        // Match canonical name back to the slot name we used
        const requestedName =
          normalizedToRequested.get(normalizeName(canonicalName)) ??
          canonicalName;
        cardCache.set(requestedName, card);
        cardCache.set(canonicalName, card);
        result.set(requestedName, card);
        result.set(canonicalName, card);
      }
    } catch {
      // If collection API fails, skip — cards will show without images
    }
  }

  return result;
}

// ─── Public API ────────────────────────────────────────────────────────────

export function getArchetypeList(format: string): ArchetypeMeta[] {
  return getArchetypesByFormat(format).map((a) => ({
    key: a.key,
    format: a.format ?? "modern",
    deckSize: a.deckSize ?? 60,
    labelDe: a.labelDe,
    labelEn: a.labelEn,
    colors: a.colors,
    colorHex: a.colorHex,
    icon: a.icon,
    tagsDe: a.tagsDe,
    tagsEn: a.tagsEn,
    summaryDe: a.summaryDe,
    summaryEn: a.summaryEn,
  }));
}

export async function getDeckSuggestion(key: string, format: string): Promise<DeckSuggestion | null> {
  const archetype = findArchetype(key, format);
  if (!archetype) return null;

  const uniqueNames = [...new Set([
    ...(archetype.commanderSlot ? [archetype.commanderSlot.name] : []),
    ...archetype.slots.map((s) => s.name),
    ...archetype.lands.map((l) => l.name),
  ])];

  // ONE network request for all cards
  const cardDataMap = await fetchCardsCollection(uniqueNames);

  function buildCard(slot: CardSlot, isLand = false): SuggestedCard {
    const card = cardDataMap.get(slot.name);
    return {
      name: slot.name,
      nameDe: card?.nameDe ?? slot.name,
      count: slot.count,
      roleDe: slot.roleDe ?? (isLand ? "Land: Mana-Basis" : ""),
      roleEn: slot.roleEn ?? (isLand ? "Land: Mana base" : ""),
      id: card?.id ?? `card-${slot.name}`,
      imageUri: card?.imageUri ?? null,
      mana_cost: card?.mana_cost ?? "",
      cmc: card?.cmc ?? 0,
      type_line: card?.type_line ?? (isLand ? "Land" : ""),
      oracle_text: card?.oracle_text ?? "",
      oracle_text_de: card?.oracle_text_de ?? "",
      keywords: card?.keywords ?? [],
      priceEur: card?.priceEur ?? null,
      priceUsd: card?.priceUsd ?? null,
      colors: card?.colors ?? [],
      color_identity: card?.color_identity ?? [],
      rarity: card?.rarity ?? "",
      set_name: card?.set_name ?? "",
      legalities: card?.legalities ?? {},
    };
  }

  const deckCards: SuggestedCard[] = archetype.slots.map((s) => buildCard(s));
  const landCards: SuggestedCard[] = archetype.lands.map((l) =>
    buildCard({ name: l.name, count: l.count, roleDe: "Land: Mana-Basis", roleEn: "Land: Mana base" }, true)
  );

  let commanderCard: SuggestedCard | null = null;
  if (archetype.commanderSlot) {
    commanderCard = buildCard(archetype.commanderSlot);
  }

  const totalCards =
    deckCards.reduce((s, c) => s + c.count, 0) +
    landCards.reduce((s, c) => s + c.count, 0) +
    (commanderCard ? 1 : 0);

  return {
    key: archetype.key,
    format: archetype.format ?? "modern",
    deckSize: archetype.deckSize ?? 60,
    labelDe: archetype.labelDe,
    labelEn: archetype.labelEn,
    colors: archetype.colors,
    colorHex: archetype.colorHex,
    icon: archetype.icon,
    tagsDe: archetype.tagsDe,
    tagsEn: archetype.tagsEn,
    summaryDe: archetype.summaryDe,
    summaryEn: archetype.summaryEn,
    whyDe: archetype.whyDe,
    whyEn: archetype.whyEn,
    totalCards,
    commanderCard,
    deckCards,
    landCards,
  };
}
