import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LanguageToggle } from "@/components/LanguageToggle";
import { useAccount } from "@/context/AccountContext";
import { type Deck, type DeckCard, useDecks } from "@/context/DeckContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = { W: "#f5f0dc", U: "#0e68ab", B: "#2c2c2c", R: "#d3202a", G: "#00733e", C: "#888888" };
const COLOR_TEXT: Record<string, string> = { W: "#1a1a1a", U: "#fff", B: "#e0e0e0", R: "#fff", G: "#fff", C: "#fff" };
const COLORS = ["W", "U", "B", "R", "G"] as const;

// ─── Combo types & helpers ────────────────────────────────────────────────────

type ComboData = {
  id: string;
  cards: Array<{ name: string; imageSmall?: string }>;
  produces: string[];
  description: string;
  popularity?: number;
};

const COMBO_EFFECT_DE: Record<string, string> = {
  "infinite mana": "Unendliches Mana",
  "infinite life": "Unendlich Leben",
  "infinite damage": "Unendlicher Schaden",
  "infinite tokens": "Unendlich Spielsteine",
  "infinite draw": "Unendlich Ziehen",
  "infinite mill": "Unendliches Mühlen",
  "infinite loop": "Unendliche Schleife",
  "infinite combat phases": "Unendliche Kampfphasen",
  "infinite turns": "Unendliche Runden",
  "win the game": "Spiel gewonnen",
  "draw your deck": "Deck ziehen",
  "exile all": "Alles verbannen",
  "destroy all": "Alles zerstören",
};

function translateComboEffect(effect: string): string {
  const lower = effect.toLowerCase().trim();
  if (COMBO_EFFECT_DE[lower]) return COMBO_EFFECT_DE[lower];
  for (const [key, val] of Object.entries(COMBO_EFFECT_DE)) {
    if (lower.includes(key) || key.includes(lower)) return val;
  }
  return effect;
}

function getApiBase(): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  return domain ? `https://${domain}` : "";
}

async function fetchDeckCombos(cardNames: string[]): Promise<ComboData[]> {
  try {
    const apiBase = getApiBase();
    if (!apiBase) {
      return [];
    }
    const res = await fetch(`${apiBase}/api/deck-combos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardNames }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) return [];
    const data = await res.json() as { results?: ComboData[] };
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}


type ManaCounts = { W: number; U: number; B: number; R: number; G: number; colorless: number; generic: number; cmc: number };

function isLand(card: DeckCard) {
  return !!card.type_line?.toLowerCase().includes("land");
}

// Derive what mana symbols a land produces (WUBRG + C for colorless)
function landColors(card: DeckCard): string[] {
  if (card.produced_mana && card.produced_mana.length > 0) {
    // Keep WUBRG and also C (explicit colorless)
    return card.produced_mana.filter((c) =>
      COLORS.includes(c as typeof COLORS[number]) || c === "C"
    );
  }
  // Fallback: parse from type_line basic land subtype
  const tl = (card.type_line ?? "").toLowerCase();
  const derived: string[] = [];
  if (tl.includes("plains"))   derived.push("W");
  if (tl.includes("island"))   derived.push("U");
  if (tl.includes("swamp"))    derived.push("B");
  if (tl.includes("mountain")) derived.push("R");
  if (tl.includes("forest"))   derived.push("G");
  // Wastes fallback (no subtype that matches above, but name is "Wastes")
  if (derived.length === 0 && (card.name ?? "").toLowerCase() === "wastes") derived.push("C");
  return derived;
}

// Compute available mana from land cards (WUBRG + C)
function computeLandMana(cards: DeckCard[]): Record<string, number> {
  const avail: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  for (const c of cards) {
    if (!isLand(c)) continue;
    for (const col of landColors(c)) {
      avail[col] = (avail[col] ?? 0) + c.count;
    }
  }
  return avail;
}

// Collect the distinct mana symbols that appear in card costs (from non-land spells)
function deckColorIdentity(cards: DeckCard[]): string[] {
  const seen = new Set<string>();
  for (const c of cards) {
    if (isLand(c) || !c.mana_cost) continue;
    const m = parseMana(c.mana_cost);
    for (const col of COLORS) { if (m[col] > 0) seen.add(col); }
    if (m.colorless > 0) seen.add("C");
  }
  const order = ["W", "U", "B", "R", "G", "C"];
  return order.filter((k) => seen.has(k));
}

function parseMana(manaCost: string): ManaCounts {
  const r: ManaCounts = { W: 0, U: 0, B: 0, R: 0, G: 0, colorless: 0, generic: 0, cmc: 0 };
  const matches = manaCost.match(/\{([^}]+)\}/g) ?? [];
  for (const m of matches) {
    const sym = m.replace(/[{}]/g, "").toUpperCase();
    if (sym === "W" || sym === "U" || sym === "B" || sym === "R" || sym === "G") {
      r[sym]++; r.cmc++;
    } else if (/^\d+$/.test(sym)) {
      r.generic += parseInt(sym, 10); r.cmc += parseInt(sym, 10);
    } else if (sym === "C") {
      // Explicit colorless pip – only payable with colorless mana (Eldrazi etc.)
      r.colorless++; r.cmc++;
    } else if (sym === "X" || sym === "Y" || sym === "Z") {
      // Variable mana – 0 CMC by MtG rules
    } else if (sym.includes("/")) {
      // Hybrid or Phyrexian: e.g. {2/W}, {W/B}, {W/P}
      const parts = sym.split("/");
      if (parts[1] === "P") {
        r.cmc++;
        const col = parts[0];
        if (col === "W" || col === "U" || col === "B" || col === "R" || col === "G") r[col]++;
      } else {
        const n = parseInt(parts[0], 10);
        const cmcVal = isNaN(n) ? 1 : Math.max(n, 1);
        r.cmc += cmcVal;
        for (const p of parts) {
          if (p === "W" || p === "U" || p === "B" || p === "R" || p === "G") r[p]++;
        }
      }
    }
  }
  return r;
}

function sumMana(cards: Deck["cards"]): ManaCounts {
  const total: ManaCounts = { W: 0, U: 0, B: 0, R: 0, G: 0, colorless: 0, generic: 0, cmc: 0 };
  for (const c of cards) {
    if (isLand(c)) continue;
    if (c.mana_cost) {
      const m = parseMana(c.mana_cost);
      total.W         += m.W         * c.count;
      total.U         += m.U         * c.count;
      total.B         += m.B         * c.count;
      total.R         += m.R         * c.count;
      total.G         += m.G         * c.count;
      total.colorless += m.colorless * c.count;
      total.generic   += m.generic   * c.count;
      const cardCmc = c.cmc !== undefined ? c.cmc : m.cmc;
      total.cmc += cardCmc * c.count;
    } else if (c.cmc !== undefined && c.cmc > 0) {
      total.generic += c.cmc * c.count;
      total.cmc     += c.cmc * c.count;
    }
  }
  return total;
}

// ─── Deck-Analyse Hilfsfunktionen ────────────────────────────────────────────

type SpeedResult = { labelDe: string; labelEn: string; color: string; desc: string; descEn: string; detail: string; detailEn: string; tips: string[]; tipsEn: string[] };

function classifySpeed(cards: DeckCard[]): SpeedResult | null {
  const nonLands = cards.filter((c) => !isLand(c));
  const counted = nonLands.filter((c) => c.cmc !== undefined || c.mana_cost);
  if (counted.length === 0) return null;
  const totalCmc = counted.reduce((a, c) => {
    const cmc = c.cmc !== undefined ? c.cmc : parseMana(c.mana_cost ?? "").cmc;
    return a + cmc * c.count;
  }, 0);
  const totalCount = counted.reduce((a, c) => a + c.count, 0);
  const avg = totalCmc / totalCount;
  if (avg < 2.0) return {
    labelDe: "Aggro", labelEn: "Aggro", color: "#d3202a",
    desc: "Sehr schnelles Deck mit niedrigen Manakosten", descEn: "Very fast deck with low mana costs",
    detail: "Aggro-Decks gewinnen in den ersten 3–5 Runden durch günstigen, konstanten Druck. Jede Karte sollte sofort Wirkung zeigen.",
    detailEn: "Aggro decks win in turns 3–5 with cheap, relentless pressure. Every card should have immediate impact.",
    tips: ["Halte die Kurve flach (≤ 2 Mana)", "Priorisiere 1- und 2-Mana-Kreaturen", "Haste und Eile sind wertvoll"],
    tipsEn: ["Keep the curve low (≤ 2 mana)", "Prioritize 1- and 2-drop creatures", "Haste and evasion are key"],
  };
  if (avg < 2.8) return {
    labelDe: "Aggro-Midrange", labelEn: "Aggro-Midrange", color: "#e67e22",
    desc: "Schnell mit mittleren Kurven-Spells", descEn: "Fast with some mid-range spells",
    detail: "Du startest früh mit Druck und hast starke 3–4-Mana-Bedrohungen als Rückhalt. Flexibel gegen Aggro und Control.",
    detailEn: "You apply early pressure backed up by powerful 3–4 mana threats. Flexible against aggro and control.",
    tips: ["Gute 1–2 Drops als Fundament", "3–4 Mana Threats als Finisher", "Removal für kritische Gegner-Kreaturen"],
    tipsEn: ["Solid 1–2 drops as foundation", "3–4 mana threats as finishers", "Removal for key opposing creatures"],
  };
  if (avg < 3.6) return {
    labelDe: "Midrange", labelEn: "Midrange", color: "#f59e0b",
    desc: "Ausgeglichene Kurve zwischen früh und spät", descEn: "Balanced curve between early and late game",
    detail: "Midrange spielt die stärksten Karten je nach Situation — flexibel gegen alle Spielstile. Du musst weder schnell noch langsam spielen.",
    detailEn: "Midrange plays the best card for each situation — flexible against all archetypes.",
    tips: ["Starke 3–5 Mana-Allrounder bevorzugen", "Gutes Verhältnis Removal/Threats", "Card Draw für späte Spielphasen"],
    tipsEn: ["Prefer strong 3–5 mana value cards", "Balance removal and threats", "Card draw for late-game staying power"],
  };
  if (avg < 4.5) return {
    labelDe: "Control", labelEn: "Control", color: "#0e68ab",
    desc: "Kontrollorientiert mit hohen Manakosten", descEn: "Control-oriented with higher mana costs",
    detail: "Control verzögert das Spiel mit Counterzaubern, Removal und Wrath-Effekten und gewinnt dann mit mächtigen späten Karten.",
    detailEn: "Control slows the game with counterspells, removal, and wraths — then wins with powerful late-game cards.",
    tips: ["Mehr Removal und Counterspells", "Wrath-Effekte für Boardclears", "Wenige aber starke Win-Conditions"],
    tipsEn: ["More removal and counterspells", "Wrath effects for board clears", "Few but powerful win conditions"],
  };
  return {
    labelDe: "Big Mana / Combo", labelEn: "Big Mana / Combo", color: "#7c3aed",
    desc: "Sehr hohe Kurve — Ramp oder Combo nötig", descEn: "Very high curve — needs ramp or combo",
    detail: "Mit so hohen Manakosten brauchst du zwingend viel Ramp. Alternativ: Spielst du auf einen Combo-Sieg ab?",
    detailEn: "With such high costs you absolutely need ramp. Alternatively — are you aiming for a combo win?",
    tips: ["Ramp stark erhöhen (Signets, Mana-Fels, Elfen)", "Frühe Schutzmaßnahmen einbauen", "Kombo-Linien klar definieren"],
    tipsEn: ["Increase ramp significantly (Signets, Sol Ring, dorks)", "Add early protection pieces", "Define clear combo lines"],
  };
}

function detectCardDraw(cards: DeckCard[]): { count: number; names: string[] } {
  const DRAW_RE = /\bdraw(?:s)?\s+(?:a|\d+|two|three|four|five|x)\s+card/i;
  const KEYWORD_DRAW = /\bcycling\b|\bscry\b|\bdraw\b/i;
  const matched: string[] = [];
  for (const c of cards) {
    if (isLand(c)) continue;
    const text = c.oracle_text ?? "";
    const kw   = (c.keywords ?? []).join(" ");
    if (DRAW_RE.test(text) || KEYWORD_DRAW.test(kw)) {
      for (let i = 0; i < c.count; i++) matched.push(c.name);
    }
  }
  const unique = [...new Set(matched)];
  return { count: unique.length, names: unique.slice(0, 5) };
}

function detectRemoval(cards: DeckCard[]): { count: number; names: string[] } {
  const DESTROY_RE  = /destroy\s+target|exile\s+target/i;
  const DAMAGE_RE   = /deals?\s+\d+\s+damage\s+to\s+(?:any\s+target|target\s+(?:creature|player|planeswalker))/i;
  const MINUS_RE    = /gets?\s+[−\-]\d+\/[−\-]\d+/i;
  const BOUNCE_RE   = /return\s+target\s+(?:creature|artifact|enchantment|permanent).*to\s+(?:its|their)\s+owner/i;
  const matched: string[] = [];
  for (const c of cards) {
    if (isLand(c)) continue;
    const text = c.oracle_text ?? "";
    if (DESTROY_RE.test(text) || DAMAGE_RE.test(text) || MINUS_RE.test(text) || BOUNCE_RE.test(text)) {
      for (let i = 0; i < c.count; i++) matched.push(c.name);
    }
  }
  const unique = [...new Set(matched)];
  return { count: unique.length, names: unique.slice(0, 5) };
}

function detectRamp(cards: DeckCard[]): { count: number; names: string[] } {
  const LAND_SEARCH_RE = /search\s+your\s+library\s+for\s+(?:a|an|up\s+to\s+\d+)\s+(?:\w+\s+)*land/i;
  const MANA_ADD_RE    = /add\s+(?:\{|\d|one|two|three|four|five)/i;
  const matched: string[] = [];
  for (const c of cards) {
    if (isLand(c)) continue;
    const text = c.oracle_text ?? "";
    if (LAND_SEARCH_RE.test(text) || MANA_ADD_RE.test(text)) {
      for (let i = 0; i < c.count; i++) matched.push(c.name);
    }
  }
  const unique = [...new Set(matched)];
  return { count: unique.length, names: unique.slice(0, 5) };
}

// ─── Deck-Synergie-Erkennung ─────────────────────────────────────────────────

type SynergyGroup = {
  key: string;
  labelDe: string;
  labelEn: string;
  icon: string;
  color: string;
  descDe: string;
  descEn: string;
  roleLabelDe: string;
  roleLabelEn: string;
  synLabelDe: string;
  synLabelEn: string;
  cards: string[];
  coreCards: DeckCard[];
  synergyCards: DeckCard[];
};

// Deduplicate DeckCard[] by name, preserving first occurrence
function dedupByName(cs: DeckCard[]): DeckCard[] {
  const seen = new Set<string>();
  return cs.filter((c) => { if (seen.has(c.name)) return false; seen.add(c.name); return true; });
}

function detectDeckSynergies(cards: DeckCard[]): SynergyGroup[] {
  const nonLands = cards.filter((c) => !isLand(c));
  const getText  = (c: DeckCard) => (c.oracle_text ?? "").toLowerCase();
  const getType  = (c: DeckCard) => (c.type_line ?? "").toLowerCase();
  const getKw    = (c: DeckCard) => (c.keywords ?? []).join(" ").toLowerCase();
  const allNames = (core: DeckCard[], syn: DeckCard[]) =>
    [...new Set([...core, ...syn].map((c) => c.name))];

  const groups: SynergyGroup[] = [];

  // ── Tribal ──────────────────────────────────────────────────────────────────
  const TRIBES: Array<{ key: string; labelDe: string; labelEn: string; icon: string; color: string }> = [
    { key: "zombie",    labelDe: "Zombie-Stamm",    labelEn: "Zombie Tribal",    icon: "skull-outline",         color: "#7c3aed" },
    { key: "vampire",   labelDe: "Vampir-Stamm",    labelEn: "Vampire Tribal",   icon: "moon-outline",          color: "#d3202a" },
    { key: "dragon",    labelDe: "Drachen-Stamm",   labelEn: "Dragon Tribal",    icon: "flame-outline",         color: "#e67e22" },
    { key: "elf",       labelDe: "Elfen-Stamm",     labelEn: "Elf Tribal",       icon: "leaf-outline",          color: "#16a34a" },
    { key: "goblin",    labelDe: "Goblin-Stamm",    labelEn: "Goblin Tribal",    icon: "bug-outline",           color: "#ef4444" },
    { key: "human",     labelDe: "Mensch-Stamm",    labelEn: "Human Tribal",     icon: "person-outline",        color: "#f59e0b" },
    { key: "spirit",    labelDe: "Geist-Stamm",     labelEn: "Spirit Tribal",    icon: "eye-outline",           color: "#06b6d4" },
    { key: "angel",     labelDe: "Engel-Stamm",     labelEn: "Angel Tribal",     icon: "star-outline",          color: "#f59e0b" },
    { key: "merfolk",   labelDe: "Meerfolk-Stamm",  labelEn: "Merfolk Tribal",   icon: "water-outline",         color: "#0e68ab" },
    { key: "knight",    labelDe: "Ritter-Stamm",    labelEn: "Knight Tribal",    icon: "shield-outline",        color: "#e67e22" },
    { key: "wizard",    labelDe: "Zauberer-Stamm",  labelEn: "Wizard Tribal",    icon: "sparkles-outline",      color: "#7c3aed" },
    { key: "warrior",   labelDe: "Krieger-Stamm",   labelEn: "Warrior Tribal",   icon: "fitness-outline",       color: "#d3202a" },
    { key: "soldier",   labelDe: "Soldat-Stamm",    labelEn: "Soldier Tribal",   icon: "shield-checkmark-outline", color: "#0e68ab" },
    { key: "rogue",     labelDe: "Schurken-Stamm",  labelEn: "Rogue Tribal",     icon: "glasses-outline",       color: "#718096" },
    { key: "cleric",    labelDe: "Kleriker-Stamm",  labelEn: "Cleric Tribal",    icon: "heart-circle-outline",  color: "#16a34a" },
    { key: "shaman",    labelDe: "Schamanen-Stamm", labelEn: "Shaman Tribal",    icon: "bonfire-outline",       color: "#e67e22" },
    { key: "demon",     labelDe: "Dämon-Stamm",     labelEn: "Demon Tribal",     icon: "skull",                 color: "#7c3aed" },
    { key: "beast",     labelDe: "Bestien-Stamm",   labelEn: "Beast Tribal",     icon: "paw-outline",           color: "#16a34a" },
  ];

  for (const tribe of TRIBES) {
    const coreCards = dedupByName(cards.filter((c) => getType(c).includes(tribe.key)));
    const synCards  = dedupByName(nonLands.filter((c) =>
      !getType(c).includes(tribe.key) && getText(c).includes(tribe.key)
    ));
    if (coreCards.length + synCards.length < 2) continue;
    groups.push({
      ...tribe,
      roleLabelDe: "Stammesmitglieder", roleLabelEn: "Tribe Members",
      synLabelDe: "Verstärker & Lords",  synLabelEn: "Amplifiers & Lords",
      descDe: `${coreCards.length} ${tribe.labelDe.split("-")[0]}${coreCards.length !== 1 ? "s" : ""} im Deck, ${synCards.length} Karte${synCards.length !== 1 ? "n" : ""} als Unterstützung.`,
      descEn: `${coreCards.length} ${tribe.key}${coreCards.length !== 1 ? "s" : ""} in the deck, ${synCards.length} card${synCards.length !== 1 ? "s" : ""} supporting them.`,
      cards: allNames(coreCards, synCards),
      coreCards, synergyCards: synCards,
    });
  }

  // ── Mechanische Synergien ────────────────────────────────────────────────────

  function mechGroup(params: {
    key: string; labelDe: string; labelEn: string; icon: string; color: string;
    descDe: string; descEn: string;
    roleLabelDe: string; roleLabelEn: string; synLabelDe: string; synLabelEn: string;
    coreRe: RegExp; synRe: RegExp; pool?: DeckCard[]; minTotal?: number;
  }) {
    const pool = params.pool ?? nonLands;
    const coreCards = dedupByName(pool.filter((c) => params.coreRe.test(getText(c) + getKw(c))));
    const synCards  = dedupByName(pool.filter((c) =>
      !params.coreRe.test(getText(c) + getKw(c)) && params.synRe.test(getText(c) + getKw(c))
    ));
    const min = params.minTotal ?? 2;
    if (coreCards.length + synCards.length < min) return;
    groups.push({
      key: params.key, labelDe: params.labelDe, labelEn: params.labelEn,
      icon: params.icon, color: params.color,
      descDe: params.descDe, descEn: params.descEn,
      roleLabelDe: params.roleLabelDe, roleLabelEn: params.roleLabelEn,
      synLabelDe: params.synLabelDe, synLabelEn: params.synLabelEn,
      cards: allNames(coreCards, synCards),
      coreCards, synergyCards: synCards,
    });
  }

  mechGroup({
    key: "graveyard", labelDe: "Friedhof-Synergien", labelEn: "Graveyard Synergy",
    icon: "cloudy-night-outline", color: "#718096",
    descDe: "Quellen (sterben/ablegen) und Nutzer (aus dem Friedhof wirken/zurückholen) arbeiten zusammen.",
    descEn: "Sources (dies/mill) and consumers (cast/return from graveyard) work together.",
    roleLabelDe: "Friedhof-Quellen", roleLabelEn: "Graveyard Sources",
    synLabelDe: "Friedhof-Nutzer", synLabelEn: "Graveyard Consumers",
    coreRe: /\bdies\b|put.*into.*graveyard|mill/i,
    synRe:  /from your graveyard|return.*from.*graveyard|cast.*from.*graveyard/i,
  });

  mechGroup({
    key: "sacrifice", labelDe: "Opfer-Synergien", labelEn: "Sacrifice Synergy",
    icon: "flash-outline", color: "#d3202a",
    descDe: "Opfer-Outlets erzeugen Mana/Effekte; Sterbe-Trigger kassieren den Bonus.",
    descEn: "Sacrifice outlets generate mana/effects; death triggers collect the bonus.",
    roleLabelDe: "Opfer-Outlets", roleLabelEn: "Sacrifice Outlets",
    synLabelDe: "Sterbe-Trigger", synLabelEn: "Death Triggers",
    coreRe: /sacrifice a|sacrifice another|sacrifice target/i,
    synRe:  /whenever.*sacrifice|whenever.*creature dies|whenever a creature you control dies/i,
  });

  mechGroup({
    key: "counters", labelDe: "+1/+1-Zähler", labelEn: "+1/+1 Counters",
    icon: "trending-up-outline", color: "#16a34a",
    descDe: "Verteiler legen Zähler ab; Proliferate-Karten und Profiteure multiplizieren sie.",
    descEn: "Distributors put counters; proliferate cards and payoffs multiply them.",
    roleLabelDe: "Zähler-Verteiler", roleLabelEn: "Counter Distributors",
    synLabelDe: "Proliferate & Nutzer", synLabelEn: "Proliferate & Payoffs",
    coreRe: /put.*\+1\/\+1 counter|enters.*\+1\/\+1/i,
    synRe:  /proliferate|for each counter|for each \+1\/\+1/i,
  });

  mechGroup({
    key: "tokens", labelDe: "Token-Synergien", labelEn: "Token Synergy",
    icon: "copy-outline", color: "#f59e0b",
    descDe: "Token-Generatoren schaffen Kreaturen; Token-Nutzer profitieren von der Masse.",
    descEn: "Token generators create creatures; token payoffs benefit from the crowd.",
    roleLabelDe: "Token-Generatoren", roleLabelEn: "Token Generators",
    synLabelDe: "Token-Nutzer", synLabelEn: "Token Payoffs",
    coreRe: /create.*token|create a.*token/i,
    synRe:  /for each creature|whenever.*creature enters|whenever a token|number of creatures/i,
  });

  mechGroup({
    key: "etb", labelDe: "ETB-Trigger", labelEn: "ETB Triggers",
    icon: "enter-outline", color: "#06b6d4",
    descDe: "ETB-Trigger-Karten + Blinker/Kopierer die diese Trigger mehrfach auslösen.",
    descEn: "ETB-trigger cards + blink/copy effects that re-trigger them repeatedly.",
    roleLabelDe: "ETB-Quellen", roleLabelEn: "ETB Sources",
    synLabelDe: "Blinker & Kopierer", synLabelEn: "Blink & Copy",
    coreRe: /when.*enters the battlefield|whenever.*enters the battlefield/i,
    synRe:  /blink|flicker|exile.*return.*owner|copy.*permanent|copy.*creature/i,
    minTotal: 3,
  });

  mechGroup({
    key: "lifegain", labelDe: "Lebensgewinn-Synergie", labelEn: "Lifegain Synergy",
    icon: "heart-outline", color: "#ef4444",
    descDe: "Lebensgewinn-Quellen und Karten die auslösen wenn du Leben gewinnst.",
    descEn: "Life gain sources and cards that trigger when you gain life.",
    roleLabelDe: "Lebensgewinn", roleLabelEn: "Life Gain",
    synLabelDe: "Lebensgewinn-Trigger", synLabelEn: "Lifegain Triggers",
    coreRe: /lifelink|you gain.*life|gains? \d+ life/i,
    synRe:  /whenever you gain life|each time you gain life/i,
  });

  mechGroup({
    key: "landfall", labelDe: "Landfall-Synergie", labelEn: "Landfall Synergy",
    icon: "earth-outline", color: "#16a34a",
    descDe: "Landfall-Trigger und Karten die mehr Länder ins Spiel bringen.",
    descEn: "Landfall triggers and cards that accelerate land drops.",
    roleLabelDe: "Landfall-Trigger", roleLabelEn: "Landfall Triggers",
    synLabelDe: "Mana-Rampe", synLabelEn: "Ramp",
    coreRe: /landfall|whenever.*land.*enters the battlefield/i,
    synRe:  /search.*land|put.*land.*into play|additional land/i,
    pool: nonLands,
  });

  mechGroup({
    key: "spells", labelDe: "Zauber-Synergie", labelEn: "Spells Matter",
    icon: "sparkles-outline", color: "#7c3aed",
    descDe: "Sprüche stärken Prowess/Magecraft-Karten; alle profitieren voneinander.",
    descEn: "Spells power up Prowess/Magecraft cards; they all benefit from each other.",
    roleLabelDe: "Prowess & Magecraft", roleLabelEn: "Prowess & Magecraft",
    synLabelDe: "Zauber-Quellen", synLabelEn: "Spell Sources",
    coreRe: /prowess|magecraft|whenever you cast.*spell|whenever.*cast.*instant|whenever.*cast.*sorcery/i,
    synRe:  /\binstant\b|\bsorcery\b/i,
    pool: nonLands,
  });

  mechGroup({
    key: "discard", labelDe: "Abwurf-Synergie", labelEn: "Discard Synergy",
    icon: "hand-left-outline", color: "#718096",
    descDe: "Abwurf-Outlets ermöglichen Madness und andere Abwurf-Payoffs.",
    descEn: "Discard outlets enable Madness and other discard payoffs.",
    roleLabelDe: "Abwurf-Outlets", roleLabelEn: "Discard Outlets",
    synLabelDe: "Madness & Nutzer", synLabelEn: "Madness & Payoffs",
    coreRe: /discard a card|you may discard/i,
    synRe:  /madness|whenever.*discard|hellbent/i,
  });

  // Sort by total card count desc, limit to top 8
  groups.sort((a, b) => b.cards.length - a.cards.length);
  return groups.slice(0, 8);
}

type TypeGroup = { key: string; labelDe: string; labelEn: string; color: string; count: number };

function getTypeBreakdown(cards: DeckCard[]): TypeGroup[] {
  const groups: Array<{ key: string; labelDe: string; labelEn: string; color: string; match: string }> = [
    { key: "creature",     labelDe: "Kreaturen",    labelEn: "Creatures",    color: "#d3202a", match: "creature" },
    { key: "instant",      labelDe: "Spontan",      labelEn: "Instants",     color: "#0e68ab", match: "instant" },
    { key: "sorcery",      labelDe: "Hexerei",      labelEn: "Sorceries",    color: "#7c3aed", match: "sorcery" },
    { key: "enchantment",  labelDe: "Verzauberung", labelEn: "Enchantments", color: "#16a34a", match: "enchantment" },
    { key: "artifact",     labelDe: "Artefakt",     labelEn: "Artifacts",    color: "#9e9e9e", match: "artifact" },
    { key: "planeswalker", labelDe: "Planeswalker", labelEn: "Planeswalkers",color: "#f59e0b", match: "planeswalker" },
    { key: "land",         labelDe: "Länder",       labelEn: "Lands",        color: "#00733e", match: "land" },
  ];
  return groups.map((g) => ({
    ...g,
    count: cards
      .filter((c) => (c.type_line ?? "").toLowerCase().includes(g.match))
      .reduce((a, c) => a + c.count, 0),
  })).filter((g) => g.count > 0);
}

type DuplicateCard = { name: string; count: number };
const BASIC_LANDS = new Set(["Plains", "Island", "Swamp", "Mountain", "Forest", "Wastes", "Snow-Covered Plains", "Snow-Covered Island", "Snow-Covered Swamp", "Snow-Covered Mountain", "Snow-Covered Forest"]);

function getSingletonViolations(cards: DeckCard[]): DuplicateCard[] {
  return cards
    .filter((c) => c.count > 1 && !BASIC_LANDS.has(c.name))
    .map((c) => ({ name: c.name, count: c.count }))
    .sort((a, b) => b.count - a.count);
}

function getDeckPrice(cards: DeckCard[]): { totalEur: number | null; totalUsd: number | null; hasData: boolean } {
  let totalEur = 0; let eurCards = 0;
  let totalUsd = 0; let usdCards = 0;
  for (const c of cards) {
    if (c.priceEur !== undefined) { totalEur += c.priceEur * c.count; eurCards++; }
    if (c.priceUsd !== undefined) { totalUsd += c.priceUsd * c.count; usdCards++; }
  }
  return {
    totalEur: eurCards > 0 ? totalEur : null,
    totalUsd: usdCards > 0 ? totalUsd : null,
    hasData: eurCards > 0 || usdCards > 0,
  };
}

// ─── Synergy Rich Descriptions ───────────────────────────────────────────────

const SYNERGY_DETAIL_DE: Record<string, string> = {
  zombie:
    "Zombie-Stammes-Decks funktionieren durch die einzigartige Eigenschaft von Zombies: viele kehren aus dem Friedhof zurück oder bringen andere zurück. 'Anführer' wie Herr der Untoten geben allen Zombies +1/+1. 'Fabrikanten' erschaffen stetig neue Zombie-Token wenn Kreaturen sterben. Das Kernprinzip: Je mehr Zombies im Friedhof, desto einfacher ist es sie zurückzuholen. Massenentfernung des Gegners füttert nur den eigenen Friedhof für die nächste Welle. Mit Phyrexianische Arena und anderen Kartenzieheffekten bleibt die Hand immer voll.",
  vampire:
    "Vampir-Stammes-Decks kombinieren Aggression mit Lebensentzug. 'Anführer' wie Herr der Nosferatu geben Vampiren Lifelink und Erstschlag. Fast jeder Vampir verfügt über Lifelink, was Aggression überlebensfähig macht: Angreifen heilt das Deck. 'Blutdiener-Synergien' belohnen dich wenn Vampire Schaden verursachen: Karten ziehen, Token erschaffen, Zähler legen. Das Deck gewinnt oft durch schieren Zermürbungsangriff — der Gegner verliert Leben während man selbst immer mehr gewinnt.",
  dragon:
    "Drachen-Stammes-Decks setzen auf wenige extrem starke Kreaturen statt viele kleine. Drachen sind teuer aber haben fliegenden Angriff und vernichtende Fähigkeiten. 'Rampe' ist entscheidend: Karteneffekte die Mana erzeugen bringen Drachen 2-3 Runden früher. 'Verstärker' wie Schrein des Sturmdrachen oder Gestalt des Drachen geben allen Drachen Boni. Sobald die ersten 1-2 Drachen im Spiel sind, kontrolliert man den Himmel vollständig. Ein typischer Zug: Drachen wirken seinen Atem-Angriff, tötet Blocker, greift direkt an.",
  elf:
    "Elfen-Stammes-Decks sind das schnellste Stammes-Deck — sie können in Runde 4-5 gewinnen. 'Mana-Elfen' wie Llanowar-Elfen und Grüner Sonnenaufgang produzieren extra Mana und ermöglichen riesige Züge früh. 'Zieher' wie Wirkstoffe des Hains ziehen Karten für jede gespielte Kreatur. Das Combo-Potential: Mit genug Mana-Elfen kann man das gesamte Deck in einer Runde auspielen. 'Anführer' verdoppeln Mana aller Elfen oder geben allen Trampeln. Elfendecks wachsen exponentiell: Jede neue Elfe produziert Mana für die nächste.",
  goblin:
    "Goblin-Stammes-Decks gewinnen durch Geschwindigkeit und Synergie. Goblins kosten 1-2 Mana, greifen in Runde 1-2 an. 'Anführer' wie Goblin-Anführer geben Hastigkeit und +1/+1 an alle Goblins. 'Massenangriff' ist das Ziel: 5-8 Goblins angreifen bevor der Gegner eine Verteidigung aufbauen kann. 'Combo-Goblins' wie Goblin-Leihhammer oder Goblin-Häuptling erzeugen unendliche Kämpfer oder Schaden. Das Deck ist aggressiv aber fragil — starke Massenentfernung stoppt es, weshalb schnelle Spiele gewonnen werden müssen.",
  graveyard:
    "Friedhof-Decks nutzen den Friedhof als zweite Hand. 'Quellen' füllen ihn: Kreaturen die sterben, Karten die mühlen lassen oder Karten die du ablegen musst. 'Nutzer' greifen darauf zu: sie beschwören Karten aus dem Friedhof neu, kehren Kreaturen zurück oder lösen Effekte aus wenn Karten abgelegt werden. Das Schlüsselkonzept: Was für andere Decks ein Verlust ist, ist für dieses Deck Vorbereitung. Je mehr im Friedhof, desto stärker das Deck.",
  sacrifice:
    "Opfer-Decks verwandeln den Tod eigener Kreaturen in Vorteile. 'Outlets' sind Fähigkeiten die 'Opfere eine Kreatur' verlangen — dafür bekommen sie Mana, Schaden oder andere Effekte. 'Sterbe-Trigger' sind Kreaturen die etwas tun wenn sie (oder andere) sterben: Leben gewinnen, Schaden verursachen, Karten ziehen. Die Stärke liegt im Recycling: Eine Kreatur stirbt und löst dabei 2-3 Effekte aus. Mit günstigen Kreaturen die immer wiederkommen entsteht eine unendliche Schleife.",
  counters:
    "+1/+1-Zähler-Decks nutzen exponentielles Wachstum. 'Verteiler' legen Zähler ab: ETB-Fähigkeiten, Tapping-Effekte, Sprüche. 'Proliferate' ist die Schlüsselmechanik: sie verdoppelt alle Zähler auf allen Permanenten. Wenn 3 Kreaturen je 3 Zähler haben und Proliferate auslöst, haben sie je 4 Zähler. 'Nutzer' profitieren: Kreaturen werden zu Monstern, Artefakte laden sich auf. Der Trick ist Synergie: jeder Zähler-Platzierungseffekt löst mehrere andere aus.",
  tokens:
    "Token-Decks gewinnen durch Masse statt Qualität. 'Generatoren' erschaffen Token-Kreaturen: Sprüche, Planeswalker, ETB-Fähigkeiten. 'Nutzer' profitieren von der Masse: Karten die +X/+X für jede Kreatur geben, Karten die Mana pro Kreatur erzeugen, Karten die von vielen Kreaturen beim Angriff profitieren. Das Deck ist resilient: einzelne Entfernung hilft dem Gegner nicht, nur Massenentfernung kann die Horde stoppen.",
  etb:
    "ETB-Trigger (Enters The Battlefield) sind Fähigkeiten die beim Betreten des Schlachtfelds ausgelöst werden. 'Quellen' sind Kreaturen mit wertvollen ETB-Fähigkeiten: Karten ziehen, Permanente entfernen, Token erschaffen. 'Blinker und Kopierer' lösen diese Trigger mehrfach aus: sie exilieren und zurückbringen eine Kreatur oder kopieren den ETB-Effekt. Der Schlüssel: eine Kreatur die 1 Karte zieht wird mit Blinker zu einer die 2, 4, 8 Karten zieht.",
  lifegain:
    "Lebensgewinn-Decks nutzen Lebenspunkte als Ressource und Auslöser. 'Quellen' gewinnen Lebenspunkte: Lifelink-Kreaturen, Heilungszauber, ETB-Heilung. 'Trigger' sind Karten die reagieren wenn du Leben gewinnst: Kreaturen bekommen Zähler, Token werden erschaffen, Karten werden gezogen. Das Deck ist sehr resilient gegen Aggression: Angreifer schenken dem Deck Lebenspunkte. Mit genug Triggers macht jeder Lebensgewinn-Effekt das Deck stärker.",
  landfall:
    "Landfall-Trigger lösen aus wenn du ein Land spielst. 'Trigger' sind Karten mit Landfall: sie erzeugen Token, fügen Zähler hinzu oder verursachen Schaden. 'Rampe' ist genauso wichtig: Karten die dir erlauben mehrere Länder pro Runde zu spielen, doppeln die Landfall-Trigger. Das Deck ist sehr konsistent: Länder sind unverzichtbar also löst man fast jede Runde die Trigger aus. Mit genug Rampe kann man 3-4 Landfall-Trigger pro Runde auslösen.",
  spells:
    "Spruch-Synergien (Prowess/Magecraft) funktionieren durch schiere Anzahl von Zaubern. 'Prowess und Magecraft' sind Karten die bei jedem Spruch einen Bonus bekommen: temporäre Stärkung, Zähler, Karten ziehen. 'Spruch-Quellen' sind Blitzzauber und Hexerei-Karten die schnell und günstig sind. Das Deck kann in einer Runde 4-6 Sprüche wirken, dabei wachsen die Prowess-Kreaturen zu riesigen Drohungen und der Gegner kann nicht mehr blocken.",
  discard:
    "Abwurf-Synergien nutzen das Ablegen von Karten als Ressource statt als Verlust. 'Outlets' sind Karten die dich Karten ablegen lassen — gegen Mana, als Kosten oder als Effekt. 'Nutzer' sind Karten mit 'Wahnsinn' (werden beim Ablegen für weniger Mana gewirkt) oder Karten die Vorteile geben wenn du Karten ablegst: Kreaturen die stärker werden, Karten die aus dem Friedhof zurückkehren. Das Deck ist wie ein Puzzle: alle Teile passen zusammen.",
};

const SYNERGY_DETAIL_EN: Record<string, string> = {
  zombie:
    "Zombie tribal decks exploit zombies' unique ability to return from the graveyard or bring others back. 'Lords' like Lord of the Undead give all zombies +1/+1. 'Factories' constantly create new zombie tokens as creatures die. Core principle: the more zombies in the graveyard, the easier it is to retrieve them. The opponent's board wipes only feed your graveyard for the next wave. With Phyrexian Arena and other draw effects, the hand stays full for relentless pressure.",
  vampire:
    "Vampire tribal decks combine aggression with life drain. 'Lords' like Lord of the Vampires grant lifelink and first strike to all vampires. Nearly every vampire has lifelink, making aggression self-sustaining: attacking heals the deck. 'Blood servant synergies' reward you when vampires deal damage: draw cards, create tokens, place counters. The deck wins through sheer attrition — the opponent loses life while you continuously gain more.",
  dragon:
    "Dragon tribal decks rely on a few extremely powerful creatures rather than many small ones. Dragons are expensive but have flying attacks and devastating abilities. 'Ramp' is crucial: mana-producing effects bring dragons 2-3 turns earlier. 'Amplifiers' like Dragon Shrine or Dragon Form give all dragons bonuses. Once 1-2 dragons hit the field, you completely control the skies. A typical turn: dragon uses its breath attack, kills blockers, attacks directly.",
  elf:
    "Elf tribal decks are the fastest tribal deck — capable of winning by turn 4-5. 'Mana elves' like Llanowar Elves and Elvish Archdruid produce extra mana and enable huge plays early. 'Drawers' like Glimpse of Nature draw cards for each creature played. The combo potential: with enough mana elves, you can play your entire deck in one turn. 'Lords' double all elves' mana output or give everyone trample. Elf decks grow exponentially: every new elf produces mana for the next one.",
  goblin:
    "Goblin tribal decks win through speed and synergy. Goblins cost 1-2 mana and attack in turns 1-2. 'Lords' like Goblin Chieftain grant haste and +1/+1 to all goblins. 'Mass attack' is the goal: 5-8 goblins attacking before the opponent can build defenses. 'Combo goblins' like Goblin Recruiter or Goblin Ringleader create infinite fighters or damage. The deck is aggressive but fragile — strong board wipes stop it, so games must be won quickly.",
  graveyard:
    "Graveyard decks use the graveyard as a second hand. 'Sources' fill it: creatures that die, cards that mill, or cards you must discard. 'Consumers' access it: recasting cards, returning creatures, or triggering effects when cards hit the graveyard. Key concept: what's a loss for other decks is preparation for this one. The more in the graveyard, the stronger the deck.",
  sacrifice:
    "Sacrifice decks turn their own creatures' deaths into advantages. 'Outlets' require 'sacrifice a creature' — in return they grant mana, damage, or other effects. 'Death triggers' are creatures that do something when they (or others) die: gain life, deal damage, draw cards. The power is in recycling: one creature dies and triggers 2-3 effects. With cheap creatures that return repeatedly, an infinite loop emerges.",
  counters:
    "+1/+1 counter decks use exponential growth. 'Distributors' place counters: ETB abilities, tapping effects, spells. 'Proliferate' is the key mechanic: it adds one more of every counter to every permanent. If 3 creatures have 3 counters each and Proliferate triggers, each now has 4. 'Payoffs' benefit: creatures grow into monsters, artifacts charge up. The trick is synergy: each counter placement triggers several others.",
  tokens:
    "Token decks win through quantity over quality. 'Generators' create token creatures: spells, planeswalkers, ETB abilities. 'Payoffs' benefit from the mass: cards giving +X/+X per creature, cards generating mana per creature, cards that profit from many attackers. The deck is resilient: single removal barely helps the opponent — only mass removal can stop the horde.",
  etb:
    "ETB triggers (Enters The Battlefield) fire when a permanent enters the battlefield. 'Sources' are creatures with valuable ETB abilities: draw cards, remove permanents, create tokens. 'Blink and copy' effects re-trigger these: exile and return a creature or copy its ETB. Key insight: a creature that draws 1 card with blink becomes one that draws 2, 4, 8 cards.",
  lifegain:
    "Lifegain decks use life points as a resource and trigger. 'Sources' gain life: lifelink creatures, healing spells, ETB healing. 'Triggers' are cards that react when you gain life: creatures get counters, tokens are created, cards are drawn. The deck is very resilient against aggression: attackers actually gift the deck more life. With enough triggers, every life gain effect makes the deck stronger.",
  landfall:
    "Landfall triggers fire whenever you play a land. 'Triggers' are Landfall cards: they create tokens, add counters, or deal damage. 'Ramp' is equally important: cards allowing you to play multiple lands per turn double your Landfall triggers. The deck is consistent: lands are necessary so you fire triggers almost every turn. With enough ramp you can trigger Landfall 3-4 times per turn.",
  spells:
    "Spell synergies (Prowess/Magecraft) work through sheer spell count. 'Prowess and Magecraft' cards get a bonus for each spell: temporary boost, counters, card draw. 'Spell sources' are instants and sorceries that are fast and cheap. The deck can cast 4-6 spells in one turn, growing Prowess creatures into huge threats the opponent can't block.",
  discard:
    "Discard synergies use discarding cards as a resource rather than a loss. 'Outlets' let you discard — for mana, as a cost, or as an effect. 'Payoffs' are cards with Madness (cast when discarded for less mana) or cards that benefit when you discard: creatures that grow, cards that return from the graveyard. The deck is like a puzzle: all pieces fit together.",
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManapoolScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();
  const { decks, createDeck, updateDeck, deleteDeck, removeCardFromDeck, adjustCardCount, importDeck } = useDecks();
  const { isSignedIn } = useAccount();

  const router = useRouter();
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [deckCombos, setDeckCombos] = useState<ComboData[]>([]);
  const [deckComboLoading, setDeckComboLoading] = useState(false);
  const [deckComboChecked, setDeckComboChecked] = useState(false);
  const [showDeckCombosModal, setShowDeckCombosModal] = useState(false);
  const [expandedDeckComboId, setExpandedDeckComboId] = useState<string | null>(null);
  const [expandedSynergyKey, setExpandedSynergyKey] = useState<string | null>(null);
  const [selectedSynergy, setSelectedSynergy] = useState<SynergyGroup | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  const activeDeck = decks.find((d) => d.id === activeDeckId) ?? null;

  const CARD_CATEGORIES = [
    { key: "creature",     labelDe: "Kreaturen",    labelEn: "Creatures",     color: "#d3202a", match: "creature" },
    { key: "instant",      labelDe: "Spontanzauber",labelEn: "Instants",      color: "#0e68ab", match: "instant" },
    { key: "sorcery",      labelDe: "Hexereien",    labelEn: "Sorceries",     color: "#7c3aed", match: "sorcery" },
    { key: "enchantment",  labelDe: "Verzauberungen",labelEn: "Enchantments", color: "#16a34a", match: "enchantment" },
    { key: "artifact",     labelDe: "Artefakte",    labelEn: "Artifacts",     color: "#9e9e9e", match: "artifact" },
    { key: "planeswalker", labelDe: "Planeswalker", labelEn: "Planeswalkers", color: "#f59e0b", match: "planeswalker" },
    { key: "land",         labelDe: "Länder",       labelEn: "Lands",         color: "#00733e", match: "land" },
    { key: "other",        labelDe: "Sonstiges",    labelEn: "Other",         color: "#718096", match: "" },
  ] as const;

  const groupedCards = useMemo(() => {
    if (!activeDeck) return [];
    const matched = new Set<string>();
    const result = CARD_CATEGORIES.slice(0, 7).map((cat) => {
      const cards = activeDeck.cards.filter((c) => {
        const tl = (c.type_line ?? "").toLowerCase();
        if (tl.includes(cat.match)) { matched.add(c.id); return true; }
        return false;
      });
      return { ...cat, cards };
    });
    const other = activeDeck.cards.filter((c) => !matched.has(c.id));
    result.push({ ...CARD_CATEGORIES[7], cards: other });
    return result.filter((g) => g.cards.length > 0);
  }, [activeDeck]);

  function toggleCategory(key: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function openDeck(deck: Deck) {
    setActiveDeckId(deck.id);
    setEditName(deck.name);
    setDeckCombos([]);
    setDeckComboChecked(false);
    setExpandedDeckComboId(null);
    setExpandedCategories(new Set());
    setExpandedCardId(null);
  }

  function closeDeck() {
    setActiveDeckId(null);
    setEditName("");
    setDeckCombos([]);
    setDeckComboChecked(false);
    setExpandedCardId(null);
    setExpandedCategories(new Set());
  }

  async function handleCheckDeckCombos() {
    if (!activeDeck || deckComboLoading) return;
    const cardNames = activeDeck.cards.map((c) => c.name);
    setDeckComboLoading(true);
    setDeckComboChecked(false);
    setDeckCombos([]);
    const results = await fetchDeckCombos(cardNames);
    setDeckCombos(results);
    setDeckComboChecked(true);
    setDeckComboLoading(false);
    setShowDeckCombosModal(true);
  }

  function handleCreateDeck() {
    const name = newDeckName.trim();
    const deck = createDeck(name || (showEnglish ? "My Deck" : "Mein Deck"));
    setNewDeckName("");
    setShowNewDeckModal(false);
    openDeck(deck);
  }

  function saveName() {
    if (!activeDeck || !editName.trim()) return;
    updateDeck({ ...activeDeck, name: editName.trim() });
  }

  // ─── Export deck ───────────────────────────────────────────────────────────
  async function handleExportDeck(deck: Deck) {
    const json = JSON.stringify(deck, null, 2);
    const fileName = `${deck.name.replace(/[^a-zA-Z0-9_\-]/g, "_")}.json`;
    if (Platform.OS === "web") {
      const blob = new Blob([json], { type: "application/json" });
      // Use File System Access API for folder picker (Chrome/Edge)
      if (typeof (window as any).showSaveFilePicker === "function") {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          setExportFeedback(showEnglish ? `Saved: ${fileName}` : `Gespeichert: ${fileName}`);
        } catch (err: any) {
          if (err?.name !== "AbortError") {
            // Fallback if picker fails
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = fileName; a.click();
            URL.revokeObjectURL(url);
            setExportFeedback(showEnglish ? `Downloaded: ${fileName}` : `Heruntergeladen: ${fileName}`);
          }
          return;
        }
      } else {
        // Fallback: direct download (Firefox, Safari)
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
        setExportFeedback(showEnglish ? `Downloaded: ${fileName}` : `Heruntergeladen: ${fileName}`);
      }
    } else {
      await Clipboard.setStringAsync(json);
      setExportFeedback(showEnglish ? "Copied to clipboard" : "In Zwischenablage kopiert");
    }
    setTimeout(() => setExportFeedback(null), 6000);
  }

  // ─── Export deck as Manabox TXT ────────────────────────────────────────────
  async function handleExportManabox(deck: Deck) {
    // Manabox format: "<count> <english card name>" per line
    const lines = deck.cards.map((c) => `${c.count} ${c.name}`);
    const txt = lines.join("\n");
    const fileName = `${deck.name.replace(/[^a-zA-Z0-9_\-]/g, "_")}_manabox.txt`;

    if (Platform.OS === "web") {
      const blob = new Blob([txt], { type: "text/plain" });
      if (typeof (window as any).showSaveFilePicker === "function") {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: fileName,
            types: [{ description: "Text", accept: { "text/plain": [".txt"] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          setExportFeedback(showEnglish ? `Saved: ${fileName}` : `Gespeichert: ${fileName}`);
        } catch (err: any) {
          if (err?.name !== "AbortError") {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = fileName; a.click();
            URL.revokeObjectURL(url);
            setExportFeedback(showEnglish ? `Downloaded: ${fileName}` : `Heruntergeladen: ${fileName}`);
          }
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
        setExportFeedback(showEnglish ? `Downloaded: ${fileName}` : `Heruntergeladen: ${fileName}`);
      }
    } else {
      // On mobile: open native share sheet so user can send to Manabox, Files, etc.
      try {
        await Share.share({ message: txt, title: fileName });
      } catch {
        // Fallback: copy to clipboard
        await Clipboard.setStringAsync(txt);
        setExportFeedback(showEnglish ? "Copied to clipboard" : "In Zwischenablage kopiert");
      }
    }
    setTimeout(() => setExportFeedback(null), 6000);
  }

  // ─── Import deck ───────────────────────────────────────────────────────────
  async function handleOpenImport() {
    setImportJson("");
    setImportError(null);
    if (Platform.OS !== "web") {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim().startsWith("{")) setImportJson(text);
    }
    setShowImportModal(true);
  }

  function handleImportDeck() {
    try {
      const data = JSON.parse(importJson);
      if (!data.name || !Array.isArray(data.cards)) {
        setImportError(showEnglish ? "Invalid deck format" : "Ungültiges Deck-Format");
        return;
      }
      importDeck(data as Deck);
      setShowImportModal(false);
      setImportJson("");
      setImportError(null);
    } catch {
      setImportError(showEnglish ? "Could not read JSON" : "JSON konnte nicht gelesen werden");
    }
  }

  // ─── Saved-at label ────────────────────────────────────────────────────────
  function formatSavedAt(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 10) return showEnglish ? "Just saved" : "Gerade gespeichert";
    if (diff < 60) return showEnglish ? `Saved ${diff}s ago` : `Vor ${diff}s gespeichert`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return showEnglish ? `Saved ${mins}m ago` : `Vor ${mins}m gespeichert`;
    const hrs = Math.floor(mins / 60);
    return showEnglish ? `Saved ${hrs}h ago` : `Vor ${hrs}h gespeichert`;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.headerLeft} onPress={activeDeck ? closeDeck : undefined}>
            {activeDeck && <Ionicons name="chevron-back" size={22} color={colors.primary} />}
            <Text style={[styles.title, { color: colors.foreground }]}>
              {activeDeck ? editName || activeDeck.name : (showEnglish ? "Deck Builder" : "Deck-Builder")}
            </Text>
          </TouchableOpacity>
          <LanguageToggle showEnglish={showEnglish} onToggle={() => setShowEnglish(!showEnglish)} />
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {activeDeck
            ? (showEnglish ? "Edit deck · tap back to see all decks" : "Deck bearbeiten · zurück für alle Decks")
            : (showEnglish ? "Create and manage your decks" : "Decks anlegen und verwalten")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══ DECK LIST VIEW ══ */}
        {!activeDeck && (
          <>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[styles.newDeckBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => setShowNewDeckModal(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.newDeckBtnText}>
                  {showEnglish ? "New Deck" : "Neues Deck"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.newDeckBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                onPress={handleOpenImport}
              >
                <Ionicons name="download-outline" size={20} color={colors.primary} />
                <Text style={[styles.newDeckBtnText, { color: colors.primary }]}>
                  {showEnglish ? "Import" : "Import"}
                </Text>
              </TouchableOpacity>
            </View>

            {decks.length === 0 ? (
              <View style={styles.emptyHint}>
                <Ionicons name="albums-outline" size={44} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {showEnglish ? "No decks yet" : "Noch keine Decks"}
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {showEnglish
                    ? "Create a deck here, then add cards from the card search tab."
                    : "Deck hier anlegen, dann Karten über die Kartensuche hinzufügen."}
                </Text>
              </View>
            ) : (
              decks.map((deck) => {
                const totalCards = deck.cards.reduce((a, c) => a + c.count, 0);
                const identity = deckColorIdentity(deck.cards);
                return (
                  <TouchableOpacity
                    key={deck.id}
                    style={[styles.deckCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => openDeck(deck)}
                  >
                    <View style={styles.deckCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.deckCardName, { color: colors.foreground }]}>{deck.name}</Text>
                        <Text style={[styles.deckCardMeta, { color: colors.mutedForeground }]}>
                          {totalCards} {showEnglish ? "cards" : "Karten"}
                          {"  ·  "}
                          <Text style={{ fontSize: 11 }}>{formatSavedAt(deck.savedAt)}</Text>
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={(e) => { e.stopPropagation?.(); handleExportDeck(deck); }}
                        style={{ padding: 6, marginRight: 4 }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Ionicons name="share-outline" size={18} color={colors.mutedForeground} />
                      </TouchableOpacity>
                      <View style={styles.identityDots}>
                        {identity.length === 0 ? (
                          <View style={[styles.identityDot, { backgroundColor: colors.secondary }]}>
                            <Text style={[styles.identityDotText, { color: colors.mutedForeground }]}>—</Text>
                          </View>
                        ) : (
                          identity.map((k) => (
                            <View key={k} style={[styles.identityDot, { backgroundColor: COLOR_HEX[k] }]}>
                              <Text style={[styles.identityDotText, { color: COLOR_TEXT[k] }]}>{k}</Text>
                            </View>
                          ))
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} style={{ marginLeft: 8 }} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}

        {/* ══ DECK DETAIL VIEW ══ */}
        {activeDeck && (
          <>
            {/* ── Deck Name ── */}
            <View style={[styles.nameBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="create-outline" size={17} color={colors.mutedForeground} />
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder={showEnglish ? "Deck name…" : "Deckname…"}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.nameInput, { color: colors.foreground }]}
                autoCorrect={false}
                onBlur={saveName}
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
            </View>

            {/* ── Karten ── */}
            <View style={styles.cardListHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {showEnglish
                  ? `Cards (${activeDeck.cards.reduce((a,c)=>a+c.count,0)})`
                  : `Karten (${activeDeck.cards.reduce((a,c)=>a+c.count,0)})`}
              </Text>
            </View>

            {activeDeck.cards.length === 0 ? (
              <View style={[styles.emptyCards, { borderColor: colors.border }]}>
                <Ionicons name="card-outline" size={28} color={colors.mutedForeground} />
                <Text style={[styles.emptyCardsText, { color: colors.mutedForeground }]}>
                  {showEnglish
                    ? "No cards yet · search cards in the 'Card Search' tab and add them here"
                    : "Noch keine Karten · Karten im Tab 'Karte suchen' suchen und hier hinzufügen"}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 6 }}>
                {groupedCards.map((group) => {
                  const isOpen = expandedCategories.has(group.key);
                  const totalCount = group.cards.reduce((a, c) => a + c.count, 0);
                  return (
                    <View key={group.key} style={[styles.categorySection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      {/* Category header */}
                      <TouchableOpacity
                        style={styles.categoryHeader}
                        activeOpacity={0.75}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); toggleCategory(group.key); }}
                      >
                        <View style={[styles.categoryColorBar, { backgroundColor: group.color }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.categoryTitle, { color: colors.foreground }]}>
                            {showEnglish ? group.labelEn : group.labelDe}
                          </Text>
                          <Text style={[styles.categorySubtitle, { color: colors.mutedForeground }]}>
                            {group.cards.length} {showEnglish ? "type(s)" : "Typ(en)"} · {totalCount} {showEnglish ? "card(s)" : "Karte(n)"}
                          </Text>
                        </View>
                        <View style={[styles.categoryCountBadge, { backgroundColor: group.color + "33", borderColor: group.color + "88" }]}>
                          <Text style={[styles.categoryCountText, { color: group.color }]}>{totalCount}</Text>
                        </View>
                        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} style={{ marginLeft: 6 }} />
                      </TouchableOpacity>

                      {/* Cards in this category */}
                      {isOpen && (
                        <View style={{ borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, overflow: "hidden" }}>
                          {group.cards.map((c, i) => {
                  const land = isLand(c);
                  const mana = c.mana_cost ? parseMana(c.mana_cost) : null;
                  const cols = mana ? COLORS.filter((k) => mana[k] > 0) : [];
                  const lCols = land ? landColors(c) : [];
                  const isExpanded = expandedCardId === c.id;
                  const notLast = i < group.cards.length - 1;
                  return (
                    <View key={c.id}>
                      {/* ── Collapsed row (always visible) ── */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setExpandedCardId(isExpanded ? null : c.id)}
                        style={[styles.cardRow,
                          notLast && !isExpanded && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                      >
                        {/* Thumbnail → navigates to card */}
                        <TouchableOpacity
                          style={styles.cardThumbWrap}
                          onPress={() => router.push({ pathname: "/(tabs)/scan", params: { q: c.name } })}>
                          {c.imageUri ? (
                            <Image source={{ uri: c.imageUri }} style={styles.cardThumb} resizeMode="cover" />
                          ) : (
                            <View style={[styles.cardThumbPlaceholder, { backgroundColor: colors.secondary }]}>
                              <Ionicons name="card-outline" size={14} color={colors.mutedForeground} />
                            </View>
                          )}
                        </TouchableOpacity>
                        {/* Name + Meta */}
                        <View style={styles.cardRowLeft}>
                          <Text style={[styles.cardRowName, { color: colors.foreground }]} numberOfLines={1}>
                            {c.printed_name ?? c.name}
                          </Text>
                          <View style={styles.cardRowMeta}>
                            {land ? (
                              <>
                                <Text style={[styles.cardRowMana, { color: colors.mutedForeground }]}>Land</Text>
                                {lCols.length <= 1 ? (
                                  lCols.map((cl) => (
                                    <View key={cl} style={[styles.colorDotTiny, { backgroundColor: COLOR_HEX[cl] }]}>
                                      <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT[cl] }]}>{cl}</Text>
                                    </View>
                                  ))
                                ) : (
                                  <View style={[styles.dualLandBadge, { borderColor: colors.border }]}>
                                    {lCols.map((cl, idx) => (
                                      <React.Fragment key={cl}>
                                        {idx > 0 && <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>/</Text>}
                                        <View style={[styles.dualLandDot, { backgroundColor: COLOR_HEX[cl] }]}>
                                          <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT[cl] }]}>{cl}</Text>
                                        </View>
                                      </React.Fragment>
                                    ))}
                                  </View>
                                )}
                              </>
                            ) : (
                              <>
                                {mana && mana.generic > 0 && (
                                  <View style={styles.genericBadge}>
                                    <Text style={styles.genericBadgeText}>{mana.generic}</Text>
                                  </View>
                                )}
                                {c.mana_cost && /\{X\}/i.test(c.mana_cost) && (
                                  <View style={styles.genericBadge}>
                                    <Text style={styles.genericBadgeText}>X</Text>
                                  </View>
                                )}
                                {cols.map((cl) => (
                                  <View key={cl} style={[styles.colorDotTiny, { backgroundColor: COLOR_HEX[cl] }]}>
                                    <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT[cl] }]}>{cl}</Text>
                                  </View>
                                ))}
                                {mana && mana.colorless > 0 && (
                                  <View style={[styles.colorDotTiny, { backgroundColor: COLOR_HEX["C"] }]}>
                                    <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT["C"] }]}>C</Text>
                                  </View>
                                )}
                                {!mana && !c.mana_cost && (
                                  <Text style={[styles.cardRowMana, { color: colors.mutedForeground }]}>—</Text>
                                )}
                              </>
                            )}
                          </View>
                        </View>
                        {/* Count badge + expand indicator */}
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <View style={[styles.cardCountBadge, { backgroundColor: colors.primary + "33" }]}>
                            <Text style={[styles.cardCountBadgeText, { color: colors.primary }]}>{c.count}×</Text>
                          </View>
                          <Ionicons
                            name={isExpanded ? "chevron-up" : "create-outline"}
                            size={15}
                            color={isExpanded ? colors.primary : colors.mutedForeground}
                          />
                        </View>
                      </TouchableOpacity>

                      {/* ── Expanded controls ── */}
                      {isExpanded && (
                        <View style={[styles.cardExpandedRow, {
                          backgroundColor: colors.primary + "11",
                          borderBottomColor: colors.border,
                          borderBottomWidth: notLast ? StyleSheet.hairlineWidth : 0,
                        }]}>
                          <TouchableOpacity
                            style={[styles.stepBtnSm, { backgroundColor: colors.secondary, borderColor: colors.border, width: 36, height: 36 }]}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); adjustCardCount(activeDeck.id, c.id, -1); }}
                          >
                            <Ionicons name="remove" size={16} color={colors.foreground} />
                          </TouchableOpacity>
                          <Text style={[styles.stepValSm, { color: colors.foreground, fontSize: 17, width: 40 }]}>{c.count}×</Text>
                          <TouchableOpacity
                            style={[styles.stepBtnSm, { backgroundColor: colors.secondary, borderColor: colors.border, width: 36, height: 36 }]}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); adjustCardCount(activeDeck.id, c.id, 1); }}
                          >
                            <Ionicons name="add" size={16} color={colors.foreground} />
                          </TouchableOpacity>
                          <View style={{ flex: 1 }} />
                          <TouchableOpacity
                            style={[styles.cardDeleteBtn, { borderColor: colors.destructive + "99" }]}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
                              removeCardFromDeck(activeDeck.id, c.id);
                              setExpandedCardId(null);
                            }}
                          >
                            <Ionicons name="trash-outline" size={15} color={colors.destructive} />
                            <Text style={{ fontSize: 13, color: colors.destructive, fontFamily: "Inter_500Medium" }}>
                              {showEnglish ? "Remove" : "Entfernen"}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* ── Typen-Übersicht ── */}
            {activeDeck.cards.length > 0 && (() => {
              const groups = getTypeBreakdown(activeDeck.cards);
              const total  = groups.reduce((a, g) => a + g.count, 0);
              if (total === 0) return null;
              return (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Card Types" : "Kartentypen"}
                  </Text>
                  <View style={[styles.analysisBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.typeBar}>
                      {groups.map((g) => (
                        <View key={g.key} style={[styles.typeBarSeg, { backgroundColor: g.color, flex: g.count }]} />
                      ))}
                    </View>
                    <View style={styles.typeChips}>
                      {groups.map((g) => (
                        <View key={g.key} style={[styles.typeChip, { backgroundColor: g.color + "22", borderColor: g.color + "66" }]}>
                          <View style={[styles.typeChipDot, { backgroundColor: g.color }]} />
                          <Text style={[styles.typeChipText, { color: colors.foreground }]}>
                            {g.count} {showEnglish ? g.labelEn : g.labelDe}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </>
              );
            })()}

            {/* ── Deck-Wert ── */}
            {activeDeck.cards.length > 0 && (() => {
              const price = getDeckPrice(activeDeck.cards);
              if (!price.hasData) return null;
              const totalCards = activeDeck.cards.reduce((a, c) => a + c.count, 0);
              return (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Deck Value" : "Deck-Wert"}
                  </Text>
                  <View style={[styles.analysisBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {price.totalEur !== null && (
                      <View style={styles.analysisRow}>
                        <Ionicons name="pricetag-outline" size={15} color="#16a34a" />
                        <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                          {showEnglish ? "Total (EUR)" : "Gesamt (EUR)"}
                        </Text>
                        <Text style={[styles.analysisValue, { color: "#16a34a" }]}>€ {price.totalEur.toFixed(2)}</Text>
                      </View>
                    )}
                    {price.totalUsd !== null && price.totalEur === null && (
                      <View style={styles.analysisRow}>
                        <Ionicons name="pricetag-outline" size={15} color="#16a34a" />
                        <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                          {showEnglish ? "Total (USD)" : "Gesamt (USD)"}
                        </Text>
                        <Text style={[styles.analysisValue, { color: "#16a34a" }]}>$ {price.totalUsd?.toFixed(2)}</Text>
                      </View>
                    )}
                    {(price.totalEur !== null || price.totalUsd !== null) && (
                      <>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.analysisRow}>
                          <Ionicons name="stats-chart-outline" size={15} color={colors.mutedForeground} />
                          <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                            {showEnglish ? "Avg. per card" : "Ø pro Karte"}
                          </Text>
                          <Text style={[styles.analysisStat, { color: colors.mutedForeground }]}>
                            {price.totalEur !== null
                              ? `€ ${(price.totalEur / totalCards).toFixed(2)}`
                              : `$ ${((price.totalUsd ?? 0) / totalCards).toFixed(2)}`}
                          </Text>
                        </View>
                        <Text style={[styles.analysisHint, { color: colors.mutedForeground }]}>
                          {showEnglish
                            ? "Based on cards added after this update. Re-add older cards to include them."
                            : "Basiert auf Karten die nach diesem Update hinzugefügt wurden."}
                        </Text>
                      </>
                    )}
                  </View>
                </>
              );
            })()}

            {/* ── Singleton-Check (Commander) ── */}
            {activeDeck.cards.length > 0 && (() => {
              const violations = getSingletonViolations(activeDeck.cards);
              if (violations.length === 0) return null;
              return (
                <View style={[styles.singletonWarning, { backgroundColor: "#f59e0b11", borderColor: "#f59e0b" }]}>
                  <View style={styles.singletonHeader}>
                    <Ionicons name="warning-outline" size={16} color="#f59e0b" />
                    <Text style={[styles.singletonTitle, { color: "#f59e0b" }]}>
                      {showEnglish
                        ? `${violations.length} card${violations.length !== 1 ? "s" : ""} exceed the 1-copy rule`
                        : `${violations.length} Karte${violations.length !== 1 ? "n" : ""} überschreiten die Singleton-Regel`}
                    </Text>
                  </View>
                  <Text style={[styles.singletonSub, { color: colors.mutedForeground }]}>
                    {violations.slice(0, 4).map((v) => `${v.name} (${v.count}×)`).join(" · ")}
                    {violations.length > 4 ? ` +${violations.length - 4}` : ""}
                  </Text>
                </View>
              );
            })()}

            {/* ── Manapool-Analyse ── */}
            {(() => {
              const availMana = computeLandMana(activeDeck.cards);
              const landTotal = activeDeck.cards.filter(isLand).reduce((a, c) => a + c.count, 0);
              // Colorless-only lands: can pay for generic {N} but not for any WUBRG color
              const colorlessLandCount = activeDeck.cards
                .filter((c) => isLand(c) && !COLORS.some((col) => landColors(c).includes(col)))
                .reduce((a, c) => a + c.count, 0);
              // Effective lands available for colored mana duties
              const effectiveColoredLands = Math.max(0, landTotal - colorlessLandCount);
              const required = sumMana(activeDeck.cards);
              if (landTotal === 0 && required.cmc === 0) return null;
              // hasColors = any land produces mana (WUBRG or C)
              const hasColors = [...COLORS, "C"].some((k) => (availMana[k] ?? 0) > 0);
              return (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Mana Analysis" : "Manapool-Analyse"}
                  </Text>
                  <View style={[styles.analysisBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {/* Available */}
                    <View style={styles.analysisRow}>
                      <Ionicons name="water" size={15} color={colors.primary} />
                      <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                        {showEnglish ? "Lands" : "Länder"}
                      </Text>
                      <Text style={[styles.analysisValue, { color: colors.primary }]}>{landTotal}</Text>
                    </View>
                    {hasColors && (
                      <>
                        <View style={styles.colorBar}>
                          {[...COLORS, "C"].filter((k) => (availMana[k] ?? 0) > 0).map((k) => (
                            <View key={k} style={[styles.colorBarSeg, { backgroundColor: COLOR_HEX[k], flex: availMana[k] }]} />
                          ))}
                        </View>
                        <View style={styles.colorChips}>
                          {[...COLORS, "C"].filter((k) => (availMana[k] ?? 0) > 0).map((k) => (
                            <View key={k} style={[styles.colorChipSm, { backgroundColor: COLOR_HEX[k] }]}>
                              <Text style={[styles.colorChipSmText, { color: COLOR_TEXT[k] }]}>{availMana[k]}{k}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    )}

                    {required.cmc > 0 && (() => {
                      const nonLandCount = activeDeck.cards
                        .filter((c) => !isLand(c) && (c.mana_cost || c.cmc !== undefined))
                        .reduce((a, c) => a + c.count, 0);
                      const avgCMC = nonLandCount > 0 ? required.cmc / nonLandCount : 0;

                      // Total = all pips including generic (for realistic distribution)
                      const requiredC = required.colorless;
                      const totalAllPips = COLORS.reduce((a, k) => a + (required[k] ?? 0), 0)
                        + requiredC + required.generic;
                      // Colored-only total for recommended-source ratios (generic needs no specific source)
                      const totalColoredPips = totalAllPips - required.generic;

                      const colorPct: Partial<Record<string, number>> = {};
                      COLORS.forEach((k) => {
                        if (required[k] > 0 && totalAllPips > 0)
                          colorPct[k] = Math.round((required[k] / totalAllPips) * 100);
                      });
                      if (requiredC > 0 && totalAllPips > 0)
                        colorPct["C"] = Math.round((requiredC / totalAllPips) * 100);
                      // Generic mana shown as neutral "N" segment
                      const genericPct = totalAllPips > 0 ? Math.round((required.generic / totalAllPips) * 100) : 0;

                      // Recommendations: colorless lands handle generic {N}, so only
                      // effectiveColoredLands (non-colorless) need to produce WUBRG/C.
                      const recommended: Partial<Record<string, number>> = {};
                      const recBase = effectiveColoredLands > 0 ? effectiveColoredLands : landTotal;
                      COLORS.forEach((k) => {
                        if (required[k] > 0 && totalColoredPips > 0)
                          recommended[k] = Math.max(1, Math.round((required[k] / totalColoredPips) * recBase));
                      });
                      if (requiredC > 0 && totalColoredPips > 0)
                        recommended["C"] = Math.max(1, Math.round((requiredC / totalColoredPips) * recBase));

                      const ALL_PIPS = [...COLORS, "C"] as const;
                      const coloredColors = ALL_PIPS.filter((k) => (colorPct[k] ?? 0) > 0);

                      return (
                        <>
                          <View style={[styles.divider, { backgroundColor: colors.border }]} />

                          {/* Ø Manakosten */}
                          <View style={styles.analysisRow}>
                            <Ionicons name="flash" size={15} color="#f59e0b" />
                            <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                              {showEnglish ? "Avg. Mana Cost" : "Ø Manakosten"}
                            </Text>
                            <Text style={[styles.analysisValue, { color: "#f59e0b" }]}>{avgCMC.toFixed(1)}</Text>
                          </View>

                          {/* Pip-Verteilung (WUBRG + C + generisch) */}
                          {totalAllPips > 0 && (
                            <>
                              <View style={styles.colorBar}>
                                {/* Generisches Mana zuerst — neutrales Grau */}
                                {required.generic > 0 && (
                                  <View style={[styles.colorBarSeg, { backgroundColor: "#9e9e9e", flex: required.generic }]} />
                                )}
                                {coloredColors.map((k) => (
                                  <View key={k} style={[styles.colorBarSeg, { backgroundColor: COLOR_HEX[k], flex: k === "C" ? requiredC : (required[k as keyof ManaCounts] as number) }]} />
                                ))}
                              </View>
                              <View style={styles.colorChips}>
                                {/* Generisches Mana-Chip */}
                                {genericPct > 0 && (
                                  <View style={[styles.colorChipSm, { backgroundColor: "#9e9e9e" }]}>
                                    <Text style={[styles.colorChipSmText, { color: "#1a1a1a" }]}>{genericPct}% N</Text>
                                  </View>
                                )}
                                {coloredColors.map((k) => (
                                  <View key={k} style={[styles.colorChipSm, { backgroundColor: COLOR_HEX[k] }]}>
                                    <Text style={[styles.colorChipSmText, { color: COLOR_TEXT[k] }]}>{colorPct[k]}% {k}</Text>
                                  </View>
                                ))}
                              </View>
                            </>
                          )}

                          {/* Empfohlene Quellen */}
                          {hasColors && totalColoredPips > 0 && coloredColors.length > 0 && (
                            <>
                              <View style={[styles.divider, { backgroundColor: colors.border }]} />
                              <View style={styles.analysisRow}>
                                <Ionicons name="color-filter" size={15} color={colors.mutedForeground} />
                                <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                                  {showEnglish ? "Recommended Sources" : "Empfohlene Quellen"}
                                </Text>
                              </View>
                              <View style={styles.colorChips}>
                                {coloredColors.map((k) => (
                                  <View key={k} style={[styles.colorChipSm, { backgroundColor: COLOR_HEX[k] }]}>
                                    <Text style={[styles.colorChipSmText, { color: COLOR_TEXT[k] }]}>~{recommended[k]} {k}</Text>
                                  </View>
                                ))}
                              </View>

                              {/* Coverage bars */}
                              {(() => {
                                // Colorless lands cover the generic {N} portion of spells.
                                // Their proportional contribution per color K:
                                //   colorlessContrib[K] = colorlessLandCount × (generic/total) × (pipK/totalColored)
                                const genericFrac = required.generic / Math.max(1, totalAllPips);
                                return coloredColors.map((k) => {
                                  const haveColored = availMana[k] ?? 0;
                                  const pipK = k === "C" ? requiredC : (required[k as keyof ManaCounts] as number ?? 0);
                                  const colorlessContrib = colorlessLandCount > 0 && totalColoredPips > 0
                                    ? Math.round(colorlessLandCount * genericFrac * pipK / totalColoredPips)
                                    : 0;
                                  const haveTotal = haveColored + colorlessContrib;
                                  const need = recommended[k] ?? 0;
                                  if (need === 0) return null;
                                  const ok = haveTotal >= need;
                                  return (
                                    <View key={k} style={styles.coverageRow}>
                                      <View style={[styles.colorDotTiny, { backgroundColor: COLOR_HEX[k] }]}>
                                        <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT[k] }]}>{k}</Text>
                                      </View>
                                      <View style={styles.coverageBar}>
                                        {/* Actual colored sources */}
                                        {haveColored > 0 && (
                                          <View style={[styles.coverageFill, {
                                            backgroundColor: ok ? "#16a34a" : COLOR_HEX[k],
                                            flex: Math.min(haveColored, need),
                                          }]} />
                                        )}
                                        {/* Colorless contribution (grey) */}
                                        {colorlessContrib > 0 && (
                                          <View style={[styles.coverageFill, {
                                            backgroundColor: "#9e9e9e",
                                            flex: Math.min(colorlessContrib, Math.max(0, need - haveColored)),
                                          }]} />
                                        )}
                                        {!ok && <View style={[styles.coverageMissing, { flex: need - haveTotal }]} />}
                                      </View>
                                      <Text style={[styles.coverageText, { color: ok ? "#16a34a" : "#e67e22" }]}>
                                        {haveColored}{colorlessContrib > 0 ? `+${colorlessContrib}` : ""}/{need}{" "}
                                        {ok ? "✓" : `−${need - haveTotal}`}
                                      </Text>
                                    </View>
                                  );
                                });
                              })()}

                              {/* Colorless coverage legend — only when contributing */}
                              {colorlessLandCount > 0 && required.generic > 0 && (
                                <View style={[styles.coverageRow, { marginTop: 4 }]}>
                                  <View style={[styles.colorDotTiny, { backgroundColor: "#9e9e9e" }]}>
                                    <Text style={[styles.colorDotTinyText, { color: "#fff" }]}>N</Text>
                                  </View>
                                  <Text style={[styles.coverageText, { color: "#9e9e9e", flex: 1, marginLeft: 4, fontSize: 11 }]}>
                                    {colorlessLandCount}× {showEnglish ? "colorless → covers {N} portion of colored spells" : "farblos → deckt {N}-Anteil farbiger Zauber"}
                                  </Text>
                                </View>
                              )}

                              {/* Verdict */}
                              {(() => {
                                const genericFrac2 = required.generic / Math.max(1, totalAllPips);
                                const lacking = coloredColors.filter((k) => {
                                  const pipK = k === "C" ? requiredC : (required[k as keyof ManaCounts] as number ?? 0);
                                  const contrib = colorlessLandCount > 0 && totalColoredPips > 0
                                    ? Math.round(colorlessLandCount * genericFrac2 * pipK / totalColoredPips)
                                    : 0;
                                  return (recommended[k] ?? 0) > 0 && ((availMana[k] ?? 0) + contrib) < (recommended[k] ?? 0);
                                });
                                if (lacking.length === 0) {
                                  return (
                                    <View style={[styles.verdict, { backgroundColor: "#16a34a22", borderColor: "#16a34a" }]}>
                                      <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                                      <Text style={[styles.verdictText, { color: "#16a34a" }]}>
                                        {showEnglish ? "Mana base covers all mana types!" : "Manabase deckt alle Manatypen!"}
                                      </Text>
                                    </View>
                                  );
                                }
                                return (
                                  <View style={[styles.verdict, { backgroundColor: "#dc262622", borderColor: "#dc2626" }]}>
                                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                                    <Text style={[styles.verdictText, { color: "#dc2626" }]}>
                                      {showEnglish ? `Add more ${lacking.join("/")} sources` : `Mehr ${lacking.join("/")} Quellen hinzufügen`}
                                    </Text>
                                  </View>
                                );
                              })()}
                            </>
                          )}
                          {/* Mana curve */}
                          {(() => {
                            const curve: Record<number, number> = {};
                            for (const c of activeDeck.cards) {
                              if (isLand(c)) continue;
                              // Prefer Scryfall's authoritative cmc; fall back to parseMana
                              const cmc = c.cmc !== undefined
                                ? Math.round(c.cmc)
                                : c.mana_cost
                                  ? parseMana(c.mana_cost).cmc
                                  : 0;
                              curve[cmc] = (curve[cmc] ?? 0) + c.count;
                            }
                            const maxCmc = Math.max(...Object.keys(curve).map(Number), 0);
                            if (maxCmc === 0) return null;
                            const maxCount = Math.max(...Object.values(curve));
                            return (
                              <>
                                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                                <Text style={[styles.curveTitle, { color: colors.mutedForeground }]}>
                                  {showEnglish ? "Mana Curve" : "Manakurve"}
                                </Text>
                                <View style={styles.curveChart}>
                                  {Array.from({ length: Math.min(maxCmc + 1, 9) }, (_, i) => {
                                    const count = curve[i] ?? 0;
                                    const height = maxCount > 0 ? (count / maxCount) * 56 : 0;
                                    return (
                                      <View key={i} style={styles.curveCol}>
                                        {count > 0 && <Text style={[styles.curveCount, { color: colors.primary }]}>{count}</Text>}
                                        <View style={styles.curveBarCont}>
                                          <View style={[styles.curveBar, { height, backgroundColor: count > 0 ? colors.primary : "transparent" }]} />
                                        </View>
                                        <Text style={[styles.curveCmc, { color: colors.mutedForeground }]}>{i === 8 ? "8+" : String(i)}</Text>
                                      </View>
                                    );
                                  })}
                                </View>
                              </>
                            );
                          })()}
                        </>
                      );
                    })()}
                  </View>
                </>
              );
            })()}

            {/* ── Deck-Analyse: Geschwindigkeit, Card Draw, Removal, Ramp ── */}
            {(() => {
              const speed   = classifySpeed(activeDeck.cards);
              const draw    = detectCardDraw(activeDeck.cards);
              const removal = detectRemoval(activeDeck.cards);
              const ramp    = detectRamp(activeDeck.cards);
              const totalNonLand = activeDeck.cards.filter((c) => !isLand(c)).reduce((a, c) => a + c.count, 0);
              const hasOracleText = activeDeck.cards.some((c) => c.oracle_text);
              if (!speed && !hasOracleText) return null;

              // Recommended values (rough rule of thumb for 60-card / commander decks)
              const isCommander = activeDeck.cards.reduce((a, c) => a + c.count, 0) >= 90;
              const drawTarget    = isCommander ? 12 : 8;
              const removalTarget = isCommander ? 10 : 6;
              const rampTarget    = isCommander ? 10 : 4;

              function RatioBar({ have, need, color }: { have: number; need: number; color: string }) {
                const pct = need > 0 ? Math.min(1, have / need) : 1;
                const ok  = have >= need;
                return (
                  <View style={styles.ratioBar}>
                    <View style={[styles.ratioFill, { flex: pct, backgroundColor: ok ? "#16a34a" : color }]} />
                    <View style={[styles.ratioEmpty, { flex: Math.max(0, 1 - pct) }]} />
                  </View>
                );
              }

              return (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Deck Analysis" : "Deck-Analyse"}
                  </Text>
                  <View style={[styles.analysisBox, { backgroundColor: colors.card, borderColor: colors.border }]}>

                    {/* Geschwindigkeit */}
                    {speed && (
                      <View style={styles.analysisBig}>
                        <View style={styles.analysisRow}>
                          <Ionicons name="speedometer-outline" size={15} color={speed.color} />
                          <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                            {showEnglish ? "Style" : "Spielstil"}
                          </Text>
                          <View style={[styles.speedBadge, { backgroundColor: speed.color + "22", borderColor: speed.color }]}>
                            <Text style={[styles.speedBadgeText, { color: speed.color }]}>
                              {showEnglish ? speed.labelEn : speed.labelDe}
                            </Text>
                          </View>
                        </View>
                        <Text style={[styles.analysisHint, { color: colors.mutedForeground }]}>
                          {showEnglish ? speed.descEn : speed.desc}
                        </Text>
                        <Text style={[styles.analysisDetail, { color: colors.mutedForeground }]}>
                          {showEnglish ? speed.detailEn : speed.detail}
                        </Text>
                        <View style={styles.tipsList}>
                          {(showEnglish ? speed.tipsEn : speed.tips).map((tip, i) => (
                            <View key={i} style={styles.tipRow}>
                              <View style={[styles.tipDot, { backgroundColor: speed.color }]} />
                              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}

                    {hasOracleText && (
                      <>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                        {/* Card Draw */}
                        <View style={styles.analysisGroup}>
                          <View style={styles.analysisRow}>
                            <Ionicons name="book-outline" size={15} color="#0e68ab" />
                            <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                              {showEnglish ? "Card Draw" : "Karten ziehen"}
                            </Text>
                            <Text style={[styles.analysisStat, { color: draw.count >= drawTarget ? "#16a34a" : "#f59e0b" }]}>
                              {draw.count} / ~{drawTarget}
                            </Text>
                          </View>
                          <RatioBar have={draw.count} need={drawTarget} color="#0e68ab" />
                          {draw.names.length > 0 && (
                            <Text style={[styles.analysisHint, { color: colors.mutedForeground }]} numberOfLines={1}>
                              {draw.names.join(" · ")}
                            </Text>
                          )}
                          <Text style={[styles.analysisDetail, { color: colors.mutedForeground }]}>
                            {showEnglish
                              ? `Card advantage is crucial — you run out of gas without draw. Cycling, Scry and draw spells count. Target: ~${drawTarget} for ${isCommander ? "Commander" : "60-card"} decks.`
                              : `Kartenvorteil ist entscheidend — ohne Nachziehen läufst du leer. Cycling, Scry und Zieh-Sprüche zählen. Ziel: ~${drawTarget} für ${isCommander ? "Commander" : "60-Karten"}-Decks.`}
                          </Text>
                        </View>

                        {/* Removal */}
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.analysisGroup}>
                          <View style={styles.analysisRow}>
                            <Ionicons name="skull-outline" size={15} color="#d3202a" />
                            <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                              {showEnglish ? "Removal" : "Removal"}
                            </Text>
                            <Text style={[styles.analysisStat, { color: removal.count >= removalTarget ? "#16a34a" : "#f59e0b" }]}>
                              {removal.count} / ~{removalTarget}
                            </Text>
                          </View>
                          <RatioBar have={removal.count} need={removalTarget} color="#d3202a" />
                          {removal.names.length > 0 && (
                            <Text style={[styles.analysisHint, { color: colors.mutedForeground }]} numberOfLines={1}>
                              {removal.names.join(" · ")}
                            </Text>
                          )}
                          <Text style={[styles.analysisDetail, { color: colors.mutedForeground }]}>
                            {showEnglish
                              ? `Removal eliminates opposing threats: destroy, exile, bounce or -X/-X effects. ${isCommander ? "In Commander you face 3 opponents — more removal is vital." : "Instant-speed removal is especially flexible."}`
                              : `Removal eliminiert gegnerische Bedrohungen: Zerstören, Verbannen, Prellen oder -X/-X. ${isCommander ? "Im Commander spielst du gegen 3 Gegner — mehr Removal ist wichtiger." : "Spontanzauber-Removal ist besonders flexibel."}`}
                          </Text>
                        </View>

                        {/* Ramp */}
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.analysisGroup}>
                          <View style={styles.analysisRow}>
                            <Ionicons name="trending-up-outline" size={15} color="#16a34a" />
                            <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                              {showEnglish ? "Ramp / Mana acceleration" : "Ramp / Manabeschleunigung"}
                            </Text>
                            <Text style={[styles.analysisStat, { color: ramp.count >= rampTarget ? "#16a34a" : "#f59e0b" }]}>
                              {ramp.count} / ~{rampTarget}
                            </Text>
                          </View>
                          <RatioBar have={ramp.count} need={rampTarget} color="#16a34a" />
                          {ramp.names.length > 0 && (
                            <Text style={[styles.analysisHint, { color: colors.mutedForeground }]} numberOfLines={1}>
                              {ramp.names.join(" · ")}
                            </Text>
                          )}
                          <Text style={[styles.analysisDetail, { color: colors.mutedForeground }]}>
                            {showEnglish
                              ? `Ramp lets you cast expensive spells earlier. Signets, mana dorks, Sol Ring and land-fetch spells all count. ${isCommander ? "Commander decks need ~10 ramp pieces for consistency." : "Even 60-card decks benefit from 3–4 ramp sources."}`
                              : `Ramp lässt dich teure Karten früher spielen. Signets, Mana-Elfen, Sol Ring und Land-Suche zählen. ${isCommander ? "Commander-Decks brauchen ~10 Ramp-Karten für Konstanz." : "Auch 60-Karten-Decks profitieren von 3–4 Ramp-Quellen."}`}
                          </Text>
                        </View>

                        {!hasOracleText && totalNonLand > 0 && (
                          <Text style={[styles.analysisHint, { color: colors.mutedForeground, marginTop: 4 }]}>
                            {showEnglish
                              ? "Add cards via search to enable draw/removal/ramp detection."
                              : "Füge Karten über die Suche hinzu für vollständige Analyse."}
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                </>
              );
            })()}

            {/* ── Synergie-Gruppen ── */}
            {(() => {
              const synergies = detectDeckSynergies(activeDeck.cards);
              if (synergies.length === 0) return null;
              return (
                <>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Synergy Groups" : "Synergie-Gruppen"}
                  </Text>
                  <View style={[styles.analysisBox, { backgroundColor: colors.card, borderColor: colors.border, gap: 0, padding: 0, overflow: "hidden" }]}>
                    {synergies.map((group, idx) => {
                      const isExp = expandedSynergyKey === group.key;
                      return (
                        <View key={group.key}>
                          {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                          <TouchableOpacity
                            style={styles.synergyHeader}
                            onPress={() => {
                              setExpandedSynergyKey(isExp ? null : group.key);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.synergyColorBar, { backgroundColor: group.color }]} />
                            <Ionicons name={group.icon as any} size={15} color={group.color} />
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.synergyTitle, { color: colors.foreground }]}>
                                {showEnglish ? group.labelEn : group.labelDe}
                              </Text>
                            </View>
                            <View style={[styles.synergyCountBadge, { backgroundColor: group.color + "22", borderColor: group.color + "55" }]}>
                              <Text style={[styles.synergyCountText, { color: group.color }]}>{group.cards.length}</Text>
                            </View>
                            <Ionicons
                              name={isExp ? "chevron-up" : "chevron-down"}
                              size={14}
                              color={colors.mutedForeground}
                            />
                          </TouchableOpacity>
                          {isExp && (
                            <View style={[styles.synergyBody, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                              <Text style={[styles.analysisDetail, { color: colors.mutedForeground, marginBottom: 8 }]}>
                                {showEnglish ? group.descEn : group.descDe}
                              </Text>
                              <TouchableOpacity
                                style={[styles.synergyDetailBtn, { backgroundColor: group.color + "18", borderColor: group.color + "55" }]}
                                onPress={() => setSelectedSynergy(group)}
                              >
                                <Ionicons name="information-circle-outline" size={15} color={group.color} />
                                <Text style={[styles.synergyDetailBtnText, { color: group.color }]}>
                                  {showEnglish ? "Full explanation & card details" : "Vollständige Erklärung & Kartendetails"}
                                </Text>
                                <Ionicons name="chevron-forward" size={13} color={group.color} />
                              </TouchableOpacity>
                              {/* ─ Card images with arrow ─ */}
                              <View style={styles.synergyImgRow}>
                                {/* Left group: core cards */}
                                <View style={styles.synergyImgGroup}>
                                  {group.coreCards.length > 0 && (
                                    <Text style={[styles.synergyRoleLabel, { color: group.color }]}>
                                      {showEnglish ? group.roleLabelEn : group.roleLabelDe}
                                    </Text>
                                  )}
                                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.synergyImgScroll}>
                                    {(group.coreCards.length > 0 ? group.coreCards : group.synergyCards).map((card) => (
                                      <View key={card.name} style={styles.synergyCardThumb}>
                                        {card.imageUri ? (
                                          <Image
                                            source={{ uri: card.imageUri }}
                                            style={styles.synergyCardImg}
                                            resizeMode="cover"
                                          />
                                        ) : (
                                          <View style={[styles.synergyCardImgPlaceholder, { backgroundColor: group.color + "33" }]}>
                                            <Text style={[styles.synergyCardImgInitial, { color: group.color }]}>
                                              {card.name.charAt(0)}
                                            </Text>
                                          </View>
                                        )}
                                        <Text style={[styles.synergyCardThumbName, { color: colors.mutedForeground }]} numberOfLines={1}>
                                          {card.name}
                                        </Text>
                                      </View>
                                    ))}
                                  </ScrollView>
                                </View>

                                {/* Arrow + right group: synergy cards */}
                                {group.coreCards.length > 0 && group.synergyCards.length > 0 && (
                                  <>
                                    <View style={styles.synergyArrowCol}>
                                      <View style={[styles.synergyArrowCircle, { backgroundColor: group.color + "22", borderColor: group.color + "55" }]}>
                                        <Ionicons name="arrow-forward" size={16} color={group.color} />
                                      </View>
                                    </View>
                                    <View style={styles.synergyImgGroup}>
                                      <Text style={[styles.synergyRoleLabel, { color: group.color }]}>
                                        {showEnglish ? group.synLabelEn : group.synLabelDe}
                                      </Text>
                                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.synergyImgScroll}>
                                        {group.synergyCards.map((card) => (
                                          <View key={card.name} style={styles.synergyCardThumb}>
                                            {card.imageUri ? (
                                              <Image
                                                source={{ uri: card.imageUri }}
                                                style={styles.synergyCardImg}
                                                resizeMode="cover"
                                              />
                                            ) : (
                                              <View style={[styles.synergyCardImgPlaceholder, { backgroundColor: group.color + "33" }]}>
                                                <Text style={[styles.synergyCardImgInitial, { color: group.color }]}>
                                                  {card.name.charAt(0)}
                                                </Text>
                                              </View>
                                            )}
                                            <Text style={[styles.synergyCardThumbName, { color: colors.mutedForeground }]} numberOfLines={1}>
                                              {card.name}
                                            </Text>
                                          </View>
                                        ))}
                                      </ScrollView>
                                    </View>
                                  </>
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </>
              );
            })()}

            {/* ── Kombos suchen ── */}
            {activeDeck.cards.length > 0 && (
              <TouchableOpacity
                style={[styles.comboCheckBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}
                onPress={handleCheckDeckCombos}
                disabled={deckComboLoading}
              >
                {deckComboLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
                )}
                <Text style={[styles.comboCheckBtnText, { color: colors.primary }]}>
                  {deckComboLoading
                    ? (showEnglish ? "Searching combos…" : "Suche Kombos…")
                    : deckComboChecked
                      ? (showEnglish ? `${deckCombos.length} Combo${deckCombos.length !== 1 ? "s" : ""} found` : `${deckCombos.length} Kombo${deckCombos.length !== 1 ? "s" : ""} gefunden`)
                      : (showEnglish ? "Check for combos" : "Kombos im Deck prüfen")}
                </Text>
                {deckComboChecked && deckCombos.length > 0 && (
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                )}
              </TouchableOpacity>
            )}

            {/* ── Speichern & Exportieren ── */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 4 }]}>
              {showEnglish ? "Save & Export" : "Speichern & Exportieren"}
            </Text>

            {/* Status */}
            <View style={[styles.savedStatusBox, { backgroundColor: "#22c55e18", borderColor: "#22c55e55" }]}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              {exportFeedback ? (
                <Text style={[styles.savedStatusText, { color: "#22c55e", flex: 1 }]}>{exportFeedback}</Text>
              ) : (
                <View style={{ flex: 1 }}>
                  <Text style={[styles.savedStatusText, { color: colors.foreground }]}>
                    {showEnglish ? "Auto-saved" : "Automatisch gespeichert"}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>
                    {formatSavedAt(activeDeck.savedAt)}
                    {"  ·  "}
                    {isSignedIn
                      ? (showEnglish ? "Local + Cloud" : "Lokal + Cloud")
                      : (showEnglish ? "Local (log in for cloud backup)" : "Lokal (anmelden für Cloud-Backup)")}
                  </Text>
                </View>
              )}
            </View>

            {/* Buttons row 1: Save + Import */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={[styles.deckActionBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => handleExportDeck(activeDeck)}
              >
                <Ionicons name="save-outline" size={17} color="#fff" />
                <Text style={[styles.deckActionBtnText, { color: "#fff" }]}>
                  {showEnglish ? "Save as file" : "Als Datei speichern"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deckActionBtn, { backgroundColor: colors.card, borderColor: colors.primary, borderWidth: 1.5 }]}
                onPress={handleOpenImport}
              >
                <Ionicons name="download-outline" size={17} color={colors.primary} />
                <Text style={[styles.deckActionBtnText, { color: colors.primary }]}>
                  {showEnglish ? "Import" : "Importieren"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Button row 2: Manabox export */}
            <TouchableOpacity
              style={[styles.deckActionBtn, { backgroundColor: "#1a2a1a", borderColor: "#4ade80", borderWidth: 1.5, marginTop: 2 }]}
              onPress={() => handleExportManabox(activeDeck)}
            >
              <Ionicons name="grid-outline" size={17} color="#4ade80" />
              <Text style={[styles.deckActionBtnText, { color: "#4ade80" }]}>
                {showEnglish ? "Export for Manabox (.txt)" : "Für Manabox exportieren (.txt)"}
              </Text>
            </TouchableOpacity>

            {/* ── Delete Deck ── */}
            <TouchableOpacity style={[styles.deleteDeckBtn, { borderColor: colors.destructive }]}
              onPress={() => {
                const doDelete = () => { deleteDeck(activeDeck.id); closeDeck(); };
                if (Platform.OS === "web") {
                  if (window.confirm(`${showEnglish ? "Delete deck?" : "Deck löschen?"} "${activeDeck.name}"`)) doDelete();
                } else {
                  Alert.alert(
                    showEnglish ? "Delete deck?" : "Deck löschen?",
                    `"${activeDeck.name}"`,
                    [
                      { text: showEnglish ? "Cancel" : "Abbrechen", style: "cancel" },
                      { text: showEnglish ? "Delete" : "Löschen", style: "destructive", onPress: doDelete },
                    ]
                  );
                }
              }}>
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
              <Text style={[styles.deleteDeckText, { color: colors.destructive }]}>
                {showEnglish ? "Delete Deck" : "Deck löschen"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* ── Deck Combos Modal ── */}
      <Modal visible={showDeckCombosModal} transparent animationType="slide">
        <View style={styles.comboModalOverlay}>
          <View style={[styles.comboModalSheet, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={styles.comboModalHeader}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
              <Text style={[styles.comboModalTitle, { color: colors.foreground }]}>
                {showEnglish ? "Deck Combos" : "Deck-Kombos"}
              </Text>
              <TouchableOpacity onPress={() => setShowDeckCombosModal(false)} style={styles.comboModalClose}>
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {deckCombos.length === 0 ? (
              <View style={styles.comboEmpty}>
                <Ionicons name="search-outline" size={40} color={colors.mutedForeground} />
                <Text style={[styles.comboEmptyTitle, { color: colors.foreground }]}>
                  {showEnglish ? "No combos found" : "Keine Kombos gefunden"}
                </Text>
                <Text style={[styles.comboEmptyText, { color: colors.mutedForeground }]}>
                  {showEnglish
                    ? "No known combos between cards in this deck were found."
                    : "Zwischen den Karten in diesem Deck wurden keine bekannten Kombos gefunden."}
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={styles.comboModalScroll}>
                <Text style={[styles.comboModalSub, { color: colors.mutedForeground }]}>
                  {showEnglish
                    ? `${deckCombos.length} combo${deckCombos.length !== 1 ? "s" : ""} possible with cards in this deck`
                    : `${deckCombos.length} Kombo${deckCombos.length !== 1 ? "s" : ""} mit Karten dieses Decks möglich`}
                </Text>
                {deckCombos.map((combo) => {
                  const isExpanded = expandedDeckComboId === combo.id;
                  return (
                    <TouchableOpacity
                      key={combo.id}
                      style={[styles.deckComboCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                      activeOpacity={0.8}
                      onPress={() => setExpandedDeckComboId(isExpanded ? null : combo.id)}
                    >
                      {/* Card images row */}
                      <View style={styles.deckComboImages}>
                        {combo.cards.slice(0, 5).map((c, i) => (
                          <View key={`${combo.id}-${i}`} style={[styles.deckComboImageWrap, { marginLeft: i > 0 ? -14 : 0, zIndex: combo.cards.length - i }]}>
                            {c.imageSmall ? (
                              <Image source={{ uri: c.imageSmall }} style={styles.deckComboImage} resizeMode="cover" />
                            ) : (
                              <View style={[styles.deckComboImagePlaceholder, { backgroundColor: colors.secondary }]}>
                                <Ionicons name="card-outline" size={12} color={colors.mutedForeground} />
                              </View>
                            )}
                          </View>
                        ))}
                        {combo.cards.length > 5 && (
                          <View style={[styles.deckComboImageMore, { backgroundColor: colors.secondary, marginLeft: -14 }]}>
                            <Text style={[styles.deckComboImageMoreText, { color: colors.mutedForeground }]}>+{combo.cards.length - 5}</Text>
                          </View>
                        )}
                      </View>

                      {/* Effects */}
                      <View style={styles.deckComboEffects}>
                        {combo.produces.slice(0, 3).map((effect, i) => (
                          <View key={i} style={[styles.deckComboEffectTag, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                            <Text style={[styles.deckComboEffectText, { color: colors.primary }]} numberOfLines={1}>
                              {showEnglish ? effect : translateComboEffect(effect)}
                            </Text>
                          </View>
                        ))}
                        <Ionicons
                          name={isExpanded ? "chevron-up" : "chevron-down"}
                          size={14}
                          color={colors.mutedForeground}
                          style={{ marginLeft: "auto" }}
                        />
                      </View>

                      {/* Expanded: card names + description */}
                      {isExpanded && (
                        <View style={[styles.deckComboDesc, { borderTopColor: colors.border }]}>
                          <Text style={[styles.deckComboCardNames, { color: colors.mutedForeground }]}>
                            {combo.cards.map((c) => c.name).join(" · ")}
                          </Text>
                          {combo.description ? (
                            <Text style={[styles.deckComboDescText, { color: colors.foreground }]}>
                              {combo.description}
                            </Text>
                          ) : null}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── New Deck Modal ── */}
      <Modal visible={showNewDeckModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNewDeckModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {showEnglish ? "New Deck" : "Neues Deck"}
            </Text>
            <TextInput
              value={newDeckName}
              onChangeText={setNewDeckName}
              placeholder={showEnglish ? "Deck name…" : "Deckname…"}
              placeholderTextColor={colors.mutedForeground}
              style={[styles.modalInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]}
              autoFocus autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleCreateDeck}
            />
            <TouchableOpacity style={[styles.modalCreateBtn, { backgroundColor: colors.primary }]} onPress={handleCreateDeck}>
              <Text style={styles.modalCreateBtnText}>{showEnglish ? "Create" : "Erstellen"}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Synergy Detail Modal ── */}
      <Modal visible={!!selectedSynergy} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: "#00000088", justifyContent: "flex-end" }]}>
          <View style={[styles.synergyDetailModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Header */}
            {selectedSynergy && (
              <>
                <View style={[styles.synergyDetailModalHeader, { borderBottomColor: colors.border }]}>
                  <View style={[styles.synergyDetailIconWrap, { backgroundColor: selectedSynergy.color + "22" }]}>
                    <Ionicons name={selectedSynergy.icon as any} size={22} color={selectedSynergy.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.synergyDetailModalTitle, { color: colors.foreground }]}>
                      {showEnglish ? selectedSynergy.labelEn : selectedSynergy.labelDe}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                      {selectedSynergy.cards.length} {showEnglish ? "cards in this deck" : "Karten in diesem Deck"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedSynergy(null)}>
                    <Ionicons name="close" size={22} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16 }} showsVerticalScrollIndicator={false}>
                  {/* Rich description */}
                  <View style={[styles.synergyDetailSection, { backgroundColor: selectedSynergy.color + "12", borderColor: selectedSynergy.color + "44" }]}>
                    <View style={styles.synergyDetailSectionHeader}>
                      <Ionicons name="bulb-outline" size={15} color={selectedSynergy.color} />
                      <Text style={[styles.synergyDetailSectionTitle, { color: selectedSynergy.color }]}>
                        {showEnglish ? "How this synergy works" : "Wie diese Synergie funktioniert"}
                      </Text>
                    </View>
                    <Text style={[styles.synergyDetailRichText, { color: colors.foreground }]}>
                      {showEnglish
                        ? (SYNERGY_DETAIL_EN[selectedSynergy.key] ?? selectedSynergy.descEn)
                        : (SYNERGY_DETAIL_DE[selectedSynergy.key] ?? selectedSynergy.descDe)}
                    </Text>
                  </View>

                  {/* Core cards */}
                  {selectedSynergy.coreCards.length > 0 && (
                    <View style={[styles.synergyDetailSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.synergyDetailSectionHeader}>
                        <Ionicons name="star-outline" size={15} color={selectedSynergy.color} />
                        <Text style={[styles.synergyDetailSectionTitle, { color: selectedSynergy.color }]}>
                          {showEnglish ? selectedSynergy.roleLabelEn : selectedSynergy.roleLabelDe}
                        </Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {selectedSynergy.coreCards.map((card) => (
                          <View key={card.name} style={[styles.synergyDetailCardCol, { marginRight: 10 }]}>
                            {card.imageUri ? (
                              <Image source={{ uri: card.imageUri }} style={styles.synergyDetailCardImg} resizeMode="cover" />
                            ) : (
                              <View style={[styles.synergyDetailCardImgEmpty, { backgroundColor: selectedSynergy.color + "33" }]}>
                                <Ionicons name="card-outline" size={20} color={selectedSynergy.color} />
                              </View>
                            )}
                            <Text style={[styles.synergyDetailCardName, { color: colors.foreground }]} numberOfLines={2}>
                              {card.name}
                            </Text>
                            {card.oracle_text ? (
                              <Text style={[styles.synergyDetailCardOracle, { color: colors.mutedForeground }]} numberOfLines={3}>
                                {card.oracle_text}
                              </Text>
                            ) : null}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Synergy cards */}
                  {selectedSynergy.synergyCards.length > 0 && (
                    <View style={[styles.synergyDetailSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.synergyDetailSectionHeader}>
                        <Ionicons name="arrow-forward-circle-outline" size={15} color={selectedSynergy.color} />
                        <Text style={[styles.synergyDetailSectionTitle, { color: selectedSynergy.color }]}>
                          {showEnglish ? selectedSynergy.synLabelEn : selectedSynergy.synLabelDe}
                        </Text>
                      </View>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                        {selectedSynergy.synergyCards.map((card) => (
                          <View key={card.name} style={[styles.synergyDetailCardCol, { marginRight: 10 }]}>
                            {card.imageUri ? (
                              <Image source={{ uri: card.imageUri }} style={styles.synergyDetailCardImg} resizeMode="cover" />
                            ) : (
                              <View style={[styles.synergyDetailCardImgEmpty, { backgroundColor: selectedSynergy.color + "33" }]}>
                                <Ionicons name="card-outline" size={20} color={selectedSynergy.color} />
                              </View>
                            )}
                            <Text style={[styles.synergyDetailCardName, { color: colors.foreground }]} numberOfLines={2}>
                              {card.name}
                            </Text>
                            {card.oracle_text ? (
                              <Text style={[styles.synergyDetailCardOracle, { color: colors.mutedForeground }]} numberOfLines={3}>
                                {card.oracle_text}
                              </Text>
                            ) : null}
                          </View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  <View style={{ height: 20 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Import Modal ── */}
      <Modal visible={showImportModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowImportModal(false)}>
          <View style={[styles.modalSheet, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {showEnglish ? "Import Deck" : "Deck importieren"}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, lineHeight: 18 }}>
              {showEnglish
                ? "Paste a previously exported deck JSON below."
                : "Hier das zuvor exportierte Deck-JSON einfügen."}
            </Text>
            <TextInput
              value={importJson}
              onChangeText={(t) => { setImportJson(t); setImportError(null); }}
              placeholder={showEnglish ? "Paste JSON here…" : "JSON hier einfügen…"}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={8}
              style={[
                styles.modalInput,
                {
                  color: colors.foreground,
                  borderColor: importError ? "#dc2626" : colors.border,
                  backgroundColor: colors.background,
                  minHeight: 120,
                  textAlignVertical: "top",
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                }
              ]}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {importError && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
                <Text style={{ fontSize: 13, color: "#dc2626" }}>{importError}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.modalCreateBtn, { backgroundColor: importJson.trim() ? colors.primary : colors.secondary }]}
              onPress={handleImportDeck}
              disabled={!importJson.trim()}
            >
              <Text style={styles.modalCreateBtnText}>
                {showEnglish ? "Import" : "Importieren"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", flexShrink: 1 },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  scroll: { padding: 16, flexGrow: 1, gap: 14 },
  newDeckBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14 },
  newDeckBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  deckCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  deckCardHeader: { flexDirection: "row", alignItems: "center" },
  deckCardName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  deckCardMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  miniBar: { height: 8, borderRadius: 4, flexDirection: "row", overflow: "hidden" },
  miniBarSeg: {},
  colorChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  colorChipSm: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  colorChipSmText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  identityDots: { flexDirection: "row", gap: 5, alignItems: "center" },
  identityDot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  identityDotText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  emptyHint: { alignItems: "center", paddingTop: 40, gap: 14, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  nameBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  nameInput: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", padding: 0 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 5 },
  stepBtnSm: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepValSm: { fontSize: 14, fontFamily: "Inter_600SemiBold", width: 28, textAlign: "center" },
  emptyCards: { borderRadius: 12, borderWidth: 1, borderStyle: "dashed", padding: 20, alignItems: "center", gap: 8 },
  emptyCardsText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  cardListHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  categorySection: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  categoryHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 14, gap: 10 },
  categoryColorBar: { width: 4, height: 36, borderRadius: 2 },
  categoryTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  categorySubtitle: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  categoryCountBadge: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 3, minWidth: 30, alignItems: "center" },
  categoryCountText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  cardList: { overflow: "hidden" },
  cardRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8, gap: 8 },
  cardExpandedRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  cardCountBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  cardCountBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  cardDeleteBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  dualLandBadge: { flexDirection: "row", alignItems: "center", gap: 2, borderRadius: 8, borderWidth: 1, paddingHorizontal: 4, paddingVertical: 1 },
  dualLandDot: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  cardRowLeft: { flex: 1 },
  cardThumbWrap: { borderRadius: 5, overflow: "hidden" },
  cardThumb: { width: 34, height: 48, borderRadius: 4 },
  cardThumbPlaceholder: { width: 34, height: 48, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  cardRowName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  cardRowMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardRowMana: { fontSize: 11, fontFamily: "Inter_400Regular" },
  colorDotTiny: { width: 17, height: 17, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  colorDotTinyText: { fontSize: 8, fontFamily: "Inter_700Bold" },
  genericBadge: { width: 17, height: 17, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#9e9e9e" },
  genericBadgeText: { fontSize: 8, fontFamily: "Inter_700Bold", color: "#1a1a1a" },
  analysisBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  analysisRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  analysisLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  analysisValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  colorBar: { height: 14, borderRadius: 7, flexDirection: "row", overflow: "hidden" },
  colorBarSeg: {},
  divider: { height: StyleSheet.hairlineWidth },
  coverageRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  coverageBar: { flex: 1, height: 10, borderRadius: 5, flexDirection: "row", overflow: "hidden", backgroundColor: "#33333344" },
  coverageFill: { borderRadius: 5 },
  coverageMissing: { backgroundColor: "#dc262644" },
  coverageText: { fontSize: 12, fontFamily: "Inter_600SemiBold", width: 48, textAlign: "right" },
  verdict: { borderRadius: 10, borderWidth: 1, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  verdictText: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  curveTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  curveChart: { flexDirection: "row", alignItems: "flex-end", height: 82, gap: 4 },
  curveCol: { flex: 1, alignItems: "center" },
  curveCount: { fontSize: 9, fontFamily: "Inter_700Bold", marginBottom: 2 },
  curveBarCont: { height: 56, justifyContent: "flex-end", width: "100%" },
  curveBar: { borderRadius: 4, width: "100%" },
  curveCmc: { fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 2 },
  deleteDeckBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  deleteDeckText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  deckActionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  deckActionBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  savedStatusBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 10 },
  savedStatusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "#00000080", justifyContent: "center", alignItems: "center", padding: 24 },
  modalSheet: { borderRadius: 16, padding: 20, width: "100%", gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, fontFamily: "Inter_400Regular" },
  modalCreateBtn: { borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  modalCreateBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  // Typen-Übersicht
  typeBar: { height: 14, borderRadius: 7, flexDirection: "row", overflow: "hidden" },
  typeBarSeg: {},
  typeChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typeChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  typeChipDot: { width: 7, height: 7, borderRadius: 4 },
  typeChipText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  // Singleton warning
  singletonWarning: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  singletonHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  singletonTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  singletonSub: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  // Deck-Analyse
  analysisBig: { gap: 6 },
  analysisGroup: { gap: 6 },
  analysisStat: { fontSize: 14, fontFamily: "Inter_700Bold" },
  analysisHint: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  analysisDetail: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17, opacity: 0.75, marginTop: 2 },
  tipsList: { gap: 4, marginTop: 4 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipDot: { width: 5, height: 5, borderRadius: 3 },
  tipText: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, flex: 1 },
  speedBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  speedBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  // Synergy groups
  synergyHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 11, paddingHorizontal: 12, gap: 9 },
  synergyColorBar: { width: 3, height: 28, borderRadius: 2 },
  synergyTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  synergyCountBadge: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2, minWidth: 26, alignItems: "center" },
  synergyCountText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  synergyBody: { paddingHorizontal: 12, paddingVertical: 12, borderTopWidth: 1 },
  synergyCardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  synergyCardChip: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4, maxWidth: 200 },
  synergyCardChipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  // Synergy image row layout
  synergyImgRow: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  synergyImgGroup: { flex: 1, minWidth: 0 },
  synergyImgScroll: { flexGrow: 0 },
  synergyRoleLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 6 },
  synergyCardThumb: { width: 56, marginRight: 6, alignItems: "center" },
  synergyCardImg: { width: 56, height: 78, borderRadius: 4, backgroundColor: "#1a1a2e" },
  synergyCardImgPlaceholder: { width: 56, height: 78, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  synergyCardImgInitial: { fontSize: 22, fontFamily: "Inter_700Bold" },
  synergyCardThumbName: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 3, lineHeight: 12 },
  synergyArrowCol: { width: 32, alignItems: "center", justifyContent: "center", paddingTop: 24, flexShrink: 0 },
  synergyArrowCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  ratioBar: { height: 8, borderRadius: 4, flexDirection: "row", overflow: "hidden", backgroundColor: "#33333344" },
  ratioFill: { borderRadius: 4 },
  ratioEmpty: {},
  // Combo check button
  comboCheckBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 14 },
  comboCheckBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  // Combo modal
  comboModalOverlay: { flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" },
  comboModalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "85%", gap: 0 },
  comboModalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  comboModalTitle: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1 },
  comboModalClose: { padding: 4 },
  comboModalSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 14 },
  comboModalScroll: { flexGrow: 0 },
  comboEmpty: { alignItems: "center", paddingVertical: 36, gap: 12 },
  comboEmptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  comboEmptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  // Combo cards
  deckComboCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8, marginBottom: 8 },
  deckComboImages: { flexDirection: "row", alignItems: "center" },
  deckComboImageWrap: { borderRadius: 6, overflow: "hidden", borderWidth: 1.5, borderColor: "#ffffff30" },
  deckComboImage: { width: 36, height: 50, borderRadius: 4 },
  deckComboImagePlaceholder: { width: 36, height: 50, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  deckComboImageMore: { width: 36, height: 50, borderRadius: 6, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#ffffff30" },
  deckComboImageMoreText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  deckComboEffects: { flexDirection: "row", flexWrap: "wrap", gap: 5, alignItems: "center" },
  deckComboEffectTag: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  deckComboEffectText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  deckComboDesc: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 6 },
  deckComboCardNames: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  deckComboDescText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  // Synergy detail button
  synergyDetailBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 7, marginBottom: 10, alignSelf: "flex-start",
  },
  synergyDetailBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  // Synergy detail modal
  synergyDetailModal: {
    height: "85%", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0,
  },
  synergyDetailModalHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderBottomWidth: 1,
  },
  synergyDetailIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  synergyDetailModalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  synergyDetailSection: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  synergyDetailSectionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  synergyDetailSectionTitle: { fontSize: 13, fontFamily: "Inter_700Bold" },
  synergyDetailRichText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 22 },
  synergyDetailCardCol: { width: 90, alignItems: "center" },
  synergyDetailCardImg: { width: 90, height: 125, borderRadius: 6, backgroundColor: "#1a1a2e" },
  synergyDetailCardImgEmpty: { width: 90, height: 125, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  synergyDetailCardName: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center", marginTop: 5, lineHeight: 14 },
  synergyDetailCardOracle: { fontSize: 9, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 13, marginTop: 3 },
});
