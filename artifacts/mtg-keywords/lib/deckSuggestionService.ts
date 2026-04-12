import { getArchetypesByFormat, findArchetype, type Archetype, type CardSlot } from "./deckArchetypes";

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

// ─── Safe fetch with timeout ────────────────────────────────────────────────
function fetchTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id));
}

// ─── Fetch single card — English only, fast ─────────────────────────────────
async function fetchCard(name: string): Promise<ScryfallCard | null> {
  if (cardCache.has(name)) return cardCache.get(name)!;
  try {
    const res = await fetchTimeout(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`,
      8000
    );
    if (!res.ok) return null;
    const data = await res.json() as any;
    const imageUri = data.image_uris?.normal ?? data.card_faces?.[0]?.image_uris?.normal ?? null;
    const card: ScryfallCard = {
      id: data.id,
      name: data.name,
      nameDe: data.name,
      mana_cost: data.mana_cost ?? "",
      cmc: data.cmc ?? 0,
      type_line: data.type_line ?? "",
      oracle_text: data.oracle_text ?? "",
      oracle_text_de: data.oracle_text ?? "",
      keywords: data.keywords ?? [],
      imageUri,
      priceEur: data.prices?.eur ? parseFloat(data.prices.eur) : null,
      priceUsd: data.prices?.usd ? parseFloat(data.prices.usd) : null,
      colors: data.colors ?? [],
      color_identity: data.color_identity ?? [],
      rarity: data.rarity ?? "",
      set_name: data.set_name ?? "",
      legalities: data.legalities ?? {},
    };
    cardCache.set(name, card);
    return card;
  } catch {
    return null;
  }
}

// ─── Parallel batch fetch (max N concurrent to respect Scryfall rate limits) ─
async function fetchCardsBatch(names: string[], concurrency = 5): Promise<Map<string, ScryfallCard>> {
  const result = new Map<string, ScryfallCard>();
  // Filter out already cached
  const toFetch = names.filter((n) => !cardCache.has(n));
  const cached = names.filter((n) => cardCache.has(n));
  for (const n of cached) result.set(n, cardCache.get(n)!);

  // Fetch in parallel batches
  for (let i = 0; i < toFetch.length; i += concurrency) {
    const batch = toFetch.slice(i, i + concurrency);
    const results = await Promise.allSettled(batch.map((name) => fetchCard(name)));
    results.forEach((r, idx) => {
      if (r.status === "fulfilled" && r.value) {
        result.set(batch[idx], r.value);
      }
    });
    // Small delay between batches to respect Scryfall rate limits
    if (i + concurrency < toFetch.length) {
      await new Promise((r) => setTimeout(r, 100));
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

  // Fetch all cards in parallel batches
  const cardDataMap = await fetchCardsBatch(uniqueNames, 5);

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
