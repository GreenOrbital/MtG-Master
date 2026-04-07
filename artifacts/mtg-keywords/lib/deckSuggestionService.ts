import { getArchetypesByFormat, findArchetype, type Archetype, type CardSlot } from "./deckArchetypes";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ScryfallCard = {
  id: string;
  name: string;
  mana_cost: string;
  cmc: number;
  type_line: string;
  oracle_text: string;
  keywords: string[];
  imageUri: string | null;
  priceEur: number | null;
  priceUsd: number | null;
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

// ─── Scryfall fetch ────────────────────────────────────────────────────────

async function fetchCard(name: string): Promise<ScryfallCard | null> {
  try {
    const url = `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json() as any;
    return {
      id: data.id,
      name: data.name,
      mana_cost: data.mana_cost ?? "",
      cmc: data.cmc ?? 0,
      type_line: data.type_line ?? "",
      oracle_text: data.oracle_text ?? "",
      keywords: data.keywords ?? [],
      imageUri: data.image_uris?.normal ?? data.card_faces?.[0]?.image_uris?.normal ?? null,
      priceEur: data.prices?.eur ? parseFloat(data.prices.eur) : null,
      priceUsd: data.prices?.usd ? parseFloat(data.prices.usd) : null,
    };
  } catch {
    return null;
  }
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

  const cardDataMap = new Map<string, ScryfallCard>();
  await Promise.all(
    uniqueNames.map(async (name) => {
      const card = await fetchCard(name);
      if (card) cardDataMap.set(name, card);
    })
  );

  function buildCard(slot: CardSlot, isLand = false): SuggestedCard {
    const card = cardDataMap.get(slot.name);
    return {
      name: slot.name,
      count: slot.count,
      roleDe: slot.roleDe ?? (isLand ? "Land: Mana-Basis" : ""),
      roleEn: slot.roleEn ?? (isLand ? "Land: Mana base" : ""),
      id: card?.id ?? `card-${slot.name}`,
      imageUri: card?.imageUri ?? null,
      mana_cost: card?.mana_cost ?? "",
      cmc: card?.cmc ?? 0,
      type_line: card?.type_line ?? (isLand ? "Land" : ""),
      oracle_text: card?.oracle_text ?? "",
      keywords: card?.keywords ?? [],
      priceEur: card?.priceEur ?? null,
      priceUsd: card?.priceUsd ?? null,
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
