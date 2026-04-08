export type CardScoreResult = { total: number; mana: number; flex: number; type_: number };

export type ScoredCard = {
  type_line?: string;
  oracle_text?: string;
  keywords?: string[];
  cmc?: number;
};

export function calculateCardScore(card: ScoredCard): CardScoreResult {
  const typeLine = (card.type_line ?? "").toLowerCase();
  const oracle   = (card.oracle_text ?? "").toLowerCase();
  const kws      = (card.keywords ?? []).map(k => k.toLowerCase()).join(" ");
  const allText  = oracle + " " + kws;
  const cmc      = card.cmc ?? 0;

  let mana = 0;
  if (typeLine.includes("land")) {
    mana = 30;
  } else if (cmc === 0) {
    mana = 40;
  } else if (typeLine.includes("instant")) {
    mana = cmc <= 1 ? 38 : cmc <= 2 ? 30 : cmc <= 3 ? 22 : Math.max(5, 40 - cmc * 5);
  } else if (typeLine.includes("sorcery")) {
    mana = cmc <= 2 ? 28 : cmc <= 4 ? 20 : Math.max(5, 35 - cmc * 4);
  } else if (typeLine.includes("planeswalker")) {
    mana = Math.min(40, Math.max(5, 40 - cmc * 4));
  } else {
    mana = Math.max(5, 30 - cmc * 3);
  }

  const highFlex = ["flash", "cycling", "kicker", "flashback", "modal", "adventure",
                    "foretell", "escape", "mutate", "buyback", "replicate", "overload"];
  const medFlex  = ["flying", "haste", "deathtouch", "lifelink", "trample",
                    "hexproof", "indestructible", "ward", "vigilance", "first strike", "double strike"];
  let flex = 0;
  for (const kw of highFlex) { if (allText.includes(kw)) flex += 10; }
  for (const kw of medFlex)  { if (allText.includes(kw)) flex += 3; }
  if (cmc <= 2 && !typeLine.includes("land")) flex += 5;
  flex = Math.min(35, flex);

  let type_ = 10;
  if (typeLine.includes("land"))             type_ = 20;
  else if (typeLine.includes("instant"))     type_ = 22;
  else if (typeLine.includes("planeswalker")) type_ = 20;
  else if (typeLine.includes("creature"))    type_ = 18;
  else if (typeLine.includes("artifact"))    type_ = 16;
  else if (typeLine.includes("sorcery"))     type_ = 15;
  else if (typeLine.includes("enchantment")) type_ = 14;

  const total = Math.min(100, Math.round(mana + flex + type_));
  return { total, mana: Math.round(mana), flex: Math.round(flex), type_: Math.round(type_) };
}

export function scoreColor(total: number): string {
  if (total >= 75) return "#7c3aed";
  if (total >= 50) return "#16a34a";
  if (total >= 25) return "#f59e0b";
  return "#6b7280";
}

export function scoreLabel(total: number, en: boolean): string {
  if (total >= 75) return en ? "Strong" : "Stark";
  if (total >= 50) return en ? "Good"   : "Gut";
  if (total >= 25) return en ? "Fair"   : "Mittel";
  return en ? "Weak" : "Schwach";
}

export function deckScore(cards: { type_line?: string; oracle_text?: string; keywords?: string[]; cmc?: number; count: number }[]): number {
  if (cards.length === 0) return 0;
  let totalWeight = 0;
  let weightedSum = 0;
  for (const c of cards) {
    const s = calculateCardScore(c);
    weightedSum += s.total * c.count;
    totalWeight += c.count;
  }
  return totalWeight === 0 ? 0 : Math.round(weightedSum / totalWeight);
}
