// Hybrid deck-vs-deck matchup simulator.
//
// Two layers:
//   1) heuristicScore(deck) — fast, deterministic, breaks the deck down into
//      curve / lands / colour-fixing / focus / threats. Returns 0..100.
//   2) monteCarlo(deckA, deckB, trials) — runs simplified mock games and
//      reports an empirical win rate for A.
// simulateMatchup() combines both into a single win rate plus prose
// suggestions for improving the user's own deck.

import type { Deck, DeckCard } from "@/context/DeckContext";

// ─── Helpers ────────────────────────────────────────────────────────────────

function expand(cards: DeckCard[]): DeckCard[] {
  // Flat list of physical cards (one entry per copy).
  const out: DeckCard[] = [];
  for (const c of cards) {
    for (let i = 0; i < (c.count || 1); i++) out.push(c);
  }
  return out;
}

function isLand(c: DeckCard): boolean {
  return !!c.type_line && c.type_line.toLowerCase().includes("land");
}

function isCreature(c: DeckCard): boolean {
  return !!c.type_line && c.type_line.toLowerCase().includes("creature");
}

function totalLands(deck: Deck): number {
  const basicLands =
    (deck.lands?.W ?? 0) +
    (deck.lands?.U ?? 0) +
    (deck.lands?.B ?? 0) +
    (deck.lands?.R ?? 0) +
    (deck.lands?.G ?? 0);
  const cardLands = expand(deck.cards).filter(isLand).length;
  return basicLands + cardLands;
}

function totalCards(deck: Deck): number {
  return totalLands(deck) + expand(deck.cards).filter((c) => !isLand(c)).length;
}

function colourFootprint(deck: Deck): Set<string> {
  const used = new Set<string>();
  for (const c of expand(deck.cards)) {
    const m = c.mana_cost ?? "";
    if (m.includes("W")) used.add("W");
    if (m.includes("U")) used.add("U");
    if (m.includes("B")) used.add("B");
    if (m.includes("R")) used.add("R");
    if (m.includes("G")) used.add("G");
  }
  return used;
}

function fixingScore(deck: Deck): number {
  const colours = colourFootprint(deck);
  if (colours.size <= 1) return 100;
  const expanded = expand(deck.cards);
  const fixers = expanded.filter((c) => {
    if (!isLand(c) && (c.produced_mana?.length ?? 0) < 2) return false;
    return (c.produced_mana?.length ?? 0) >= 2;
  }).length;
  // Need ~6 fixers per extra colour.
  const wanted = (colours.size - 1) * 6;
  if (wanted === 0) return 100;
  const ratio = Math.min(1, fixers / wanted);
  return Math.round(40 + ratio * 60);
}

function curveScore(deck: Deck): number {
  // Reward decks whose non-land cmc distribution peaks around 2-3.
  const nonLands = expand(deck.cards).filter((c) => !isLand(c));
  if (nonLands.length === 0) return 0;
  const buckets = [0, 0, 0, 0, 0, 0, 0, 0]; // 0,1,2,3,4,5,6,7+
  for (const c of nonLands) {
    const cmc = Math.max(0, Math.min(7, Math.floor(c.cmc ?? 0)));
    buckets[cmc]++;
  }
  const total = nonLands.length;
  const pct = buckets.map((n) => n / total);
  // Ideal-ish curve weights (tuned by feel for 60-card decks).
  const ideal = [0.05, 0.15, 0.25, 0.20, 0.15, 0.10, 0.06, 0.04];
  let dist = 0;
  for (let i = 0; i < ideal.length; i++) dist += Math.abs(pct[i] - ideal[i]);
  // dist is roughly 0..1.5 — invert to 0..100.
  return Math.max(0, Math.round(100 - (dist / 1.5) * 100));
}

function landsScore(deck: Deck): number {
  const lands = totalLands(deck);
  const total = totalCards(deck);
  if (total === 0) return 0;
  const ratio = lands / total;
  // Aim for ~38-40% lands; falloff outside 32-46%.
  if (ratio < 0.30) return Math.round((ratio / 0.30) * 50);
  if (ratio > 0.50) return Math.round(Math.max(20, 100 - (ratio - 0.50) * 200));
  // Inside the sweet zone, distance to 0.39.
  const off = Math.abs(ratio - 0.39);
  return Math.round(100 - off * 200);
}

function focusScore(deck: Deck): number {
  // Reward repeated keywords across non-land cards (synergy proxy).
  const nonLands = expand(deck.cards).filter((c) => !isLand(c));
  if (nonLands.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const c of nonLands) {
    for (const k of c.keywords ?? []) {
      counts.set(k.toLowerCase(), (counts.get(k.toLowerCase()) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return 30;
  const top = [...counts.values()].sort((a, b) => b - a).slice(0, 3);
  const overlap = top.reduce((s, n) => s + n, 0);
  // 12+ stacked keyword copies = focused.
  return Math.min(100, Math.round((overlap / 12) * 100));
}

function threatScore(deck: Deck): number {
  // Average mana value of creatures + count → bigger creatures + enough of them.
  const creatures = expand(deck.cards).filter(isCreature);
  if (creatures.length === 0) return 20;
  const avgCmc = creatures.reduce((s, c) => s + (c.cmc ?? 0), 0) / creatures.length;
  const countScore = Math.min(1, creatures.length / 22); // ~22 creatures = full
  const sizeScore = Math.min(1, avgCmc / 4); // avg 4 cmc creatures = full
  return Math.round((countScore * 0.6 + sizeScore * 0.4) * 100);
}

// ─── Heuristic ──────────────────────────────────────────────────────────────

export type HeuristicBreakdown = {
  curve: number;
  lands: number;
  fixing: number;
  focus: number;
  threats: number;
};

export type HeuristicResult = {
  power: number;
  breakdown: HeuristicBreakdown;
};

export function heuristicScore(deck: Deck): HeuristicResult {
  const breakdown: HeuristicBreakdown = {
    curve: curveScore(deck),
    lands: landsScore(deck),
    fixing: fixingScore(deck),
    focus: focusScore(deck),
    threats: threatScore(deck),
  };
  // Weighted sum.
  const power = Math.round(
    breakdown.curve * 0.20 +
    breakdown.lands * 0.20 +
    breakdown.fixing * 0.15 +
    breakdown.focus * 0.20 +
    breakdown.threats * 0.25,
  );
  return { power, breakdown };
}

// ─── Monte-Carlo ────────────────────────────────────────────────────────────

type SimDeck = {
  library: DeckCard[];
  hand: DeckCard[];
  battlefield: DeckCard[]; // non-land permanents only
  lands: number;            // number of lands in play
  damageDealt: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeSimDeck(deck: Deck): SimDeck {
  const expanded = expand(deck.cards);
  // Treat basic-land counts as nameless lands.
  const basics = totalLands(deck) - expanded.filter(isLand).length;
  const library: DeckCard[] = [...expanded];
  for (let i = 0; i < basics; i++) {
    library.push({
      id: `__basic_${i}`,
      name: "Basic Land",
      type_line: "Land",
      cmc: 0,
      count: 1,
    });
  }
  return {
    library: shuffle(library),
    hand: [],
    battlefield: [],
    lands: 0,
    damageDealt: 0,
  };
}

function draw(s: SimDeck, n = 1): void {
  for (let i = 0; i < n; i++) {
    const c = s.library.pop();
    if (c) s.hand.push(c);
  }
}

function takeTurn(s: SimDeck, _turn: number): void {
  // Draw.
  draw(s);
  // Play a land if we have one.
  const landIdx = s.hand.findIndex(isLand);
  if (landIdx >= 0) {
    s.hand.splice(landIdx, 1);
    s.lands += 1;
  }
  // Cast as many cheap spells as we can afford this turn (mana = lands).
  let manaLeft = s.lands;
  // Sort hand by cmc ascending so we cast cheap first; bigger threats wait.
  s.hand.sort((a, b) => (a.cmc ?? 0) - (b.cmc ?? 0));
  const remaining: DeckCard[] = [];
  for (const c of s.hand) {
    if (isLand(c)) { remaining.push(c); continue; }
    const cost = c.cmc ?? 0;
    if (cost > 0 && cost <= manaLeft) {
      manaLeft -= cost;
      if (isCreature(c)) s.battlefield.push(c);
      // Non-creature spells: we approximate their effect as +1 damage tick
      // (removal, ramp, draw — all push the game forward).
      else s.damageDealt += 1;
    } else {
      remaining.push(c);
    }
  }
  s.hand = remaining;
  // Combat: each creature on battlefield deals (1 + cmc/2) damage.
  for (const c of s.battlefield) {
    s.damageDealt += 1 + ((c.cmc ?? 0) / 2);
  }
}

function playOneGame(
  deckA: Deck,
  deckB: Deck,
  aGoesFirst: boolean,
  maxTurns = 8,
): "A" | "B" | "draw" {
  const a = makeSimDeck(deckA);
  const b = makeSimDeck(deckB);
  draw(a, 7);
  draw(b, 7);
  for (let t = 1; t <= maxTurns; t++) {
    const first = aGoesFirst ? a : b;
    const second = aGoesFirst ? b : a;
    const firstLabel: "A" | "B" = aGoesFirst ? "A" : "B";
    const secondLabel: "A" | "B" = aGoesFirst ? "B" : "A";
    takeTurn(first, t);
    if (first.damageDealt >= 20) return firstLabel;
    takeTurn(second, t);
    if (second.damageDealt >= 20) return secondLabel;
  }
  // Tally on time-out.
  if (a.damageDealt > b.damageDealt) return "A";
  if (b.damageDealt > a.damageDealt) return "B";
  return "draw";
}

export function monteCarlo(deckA: Deck, deckB: Deck, trials = 500): { winRateA: number } {
  let aWins = 0;
  let games = 0;
  for (let i = 0; i < trials; i++) {
    // Alternate the starting player so neither side gets a systematic
    // first-turn advantage. Over an even number of trials this exactly
    // balances out; over an odd number the bias is at most 1/trials.
    const aFirst = i % 2 === 0;
    const r = playOneGame(deckA, deckB, aFirst);
    if (r === "A") aWins++;
    if (r !== "draw") games++;
  }
  return { winRateA: games === 0 ? 0.5 : aWins / games };
}

// ─── Combined ───────────────────────────────────────────────────────────────

export type Suggestion = { de: string; en: string; severity: "info" | "warn" | "high" };

export type MatchupResult = {
  winRateA: number;            // 0..1
  heuristic: { a: HeuristicResult; b: HeuristicResult };
  monteCarloRate: number;      // raw MC rate for A
  suggestions: Suggestion[];   // suggestions for deck A
  trials: number;
};

function makeSuggestions(a: HeuristicResult, b: HeuristicResult): Suggestion[] {
  const out: Suggestion[] = [];
  const push = (de: string, en: string, severity: Suggestion["severity"]) =>
    out.push({ de, en, severity });

  // Compare each axis; flag the worst gaps.
  if (a.breakdown.lands < 60) {
    push(
      "Manabase ist instabil — Anteil an Ländern liegt außerhalb des sicheren Bereichs.",
      "Mana base is shaky — land ratio is outside the safe band.",
      a.breakdown.lands < 40 ? "high" : "warn",
    );
  }
  if (a.breakdown.curve < 60 && a.breakdown.curve < b.breakdown.curve - 10) {
    push(
      "Manakurve ist unausgewogen — füge billigere Karten (1-3 Mana) hinzu, um früh ins Spiel zu kommen.",
      "Mana curve is uneven — add cheaper cards (1-3 mana) to get on the board faster.",
      "warn",
    );
  }
  if (a.breakdown.fixing < 70 && a.breakdown.fixing < b.breakdown.fixing - 10) {
    push(
      "Mehrfarbiges Deck ohne genug Manafixing — ergänze Dual-Länder oder Karten, die zwei Farben Mana erzeugen.",
      "Multi-coloured deck without enough fixing — add dual lands or cards that produce two colours of mana.",
      "warn",
    );
  }
  if (a.breakdown.focus < 50) {
    push(
      "Wenig Synergie zwischen den Karten — gleiche Schlüsselwörter und Themen verstärken sich gegenseitig.",
      "Cards rarely synergise — the same keywords and themes amplify each other.",
      "info",
    );
  }
  if (a.breakdown.threats < 55 && a.breakdown.threats < b.breakdown.threats - 10) {
    push(
      "Zu wenig oder zu kleine Kreaturen, um den Gegner unter Druck zu setzen.",
      "Too few or too small creatures to put real pressure on your opponent.",
      "warn",
    );
  }
  // If everything looks fine but you still trail.
  if (out.length === 0 && a.power < b.power) {
    push(
      "Auf dem Papier ähnlich aufgestellt — der Gegner hat aktuell ein Quäntchen mehr Tempo.",
      "Roughly even on paper — your opponent currently has a sliver more tempo.",
      "info",
    );
  }
  if (out.length === 0) {
    push(
      "Solide aufgestellt — keine offensichtlichen Schwächen.",
      "Solid build — no obvious weaknesses.",
      "info",
    );
  }
  return out;
}

export function simulateMatchup(deckA: Deck, deckB: Deck, trials = 500): MatchupResult {
  const a = heuristicScore(deckA);
  const b = heuristicScore(deckB);
  const heuristicShare = (a.power + 1) / (a.power + b.power + 2); // Laplace
  const mc = monteCarlo(deckA, deckB, trials);
  // Blend: 40 % heuristic, 60 % Monte-Carlo.
  let winRateA = 0.4 * heuristicShare + 0.6 * mc.winRateA;
  // Clamp away from 0/100 so we don't lie about certainty.
  winRateA = Math.max(0.05, Math.min(0.95, winRateA));
  return {
    winRateA,
    heuristic: { a, b },
    monteCarloRate: mc.winRateA,
    suggestions: makeSuggestions(a, b),
    trials,
  };
}
