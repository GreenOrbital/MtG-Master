import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
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

type SpeedResult = { labelDe: string; labelEn: string; color: string; desc: string; descEn: string };

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
  if (avg < 2.0)  return { labelDe: "Aggro",   labelEn: "Aggro",   color: "#d3202a", desc: "Sehr schnelles Deck mit niedrigen Manakosten",  descEn: "Very fast deck with low mana costs" };
  if (avg < 2.8)  return { labelDe: "Aggro-Midrange", labelEn: "Aggro-Midrange", color: "#e67e22", desc: "Schnell mit mittleren Kurven-Spells", descEn: "Fast with some mid-range spells" };
  if (avg < 3.6)  return { labelDe: "Midrange", labelEn: "Midrange", color: "#f59e0b", desc: "Ausgeglichene Kurve zwischen früh und spät", descEn: "Balanced curve between early and late game" };
  if (avg < 4.5)  return { labelDe: "Control",  labelEn: "Control",  color: "#0e68ab", desc: "Kontrollorientiert mit hohen Manakosten",      descEn: "Control-oriented with higher mana costs" };
  return           { labelDe: "Big Mana / Combo", labelEn: "Big Mana / Combo", color: "#8b2fc9", desc: "Sehr hohe Kurve — Ramp oder Combo nötig", descEn: "Very high curve — needs ramp or combo" };
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

type TypeGroup = { key: string; labelDe: string; labelEn: string; color: string; count: number };

function getTypeBreakdown(cards: DeckCard[]): TypeGroup[] {
  const groups: Array<{ key: string; labelDe: string; labelEn: string; color: string; match: string }> = [
    { key: "creature",     labelDe: "Kreaturen",    labelEn: "Creatures",    color: "#d3202a", match: "creature" },
    { key: "instant",      labelDe: "Spontan",      labelEn: "Instants",     color: "#0e68ab", match: "instant" },
    { key: "sorcery",      labelDe: "Hexerei",      labelEn: "Sorceries",    color: "#8b2fc9", match: "sorcery" },
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
  const [cardFilter, setCardFilter] = useState<string>("all");
  const [deckCombos, setDeckCombos] = useState<ComboData[]>([]);
  const [deckComboLoading, setDeckComboLoading] = useState(false);
  const [deckComboChecked, setDeckComboChecked] = useState(false);
  const [showDeckCombosModal, setShowDeckCombosModal] = useState(false);
  const [expandedDeckComboId, setExpandedDeckComboId] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  const activeDeck = decks.find((d) => d.id === activeDeckId) ?? null;

  const filteredCards = useMemo(() => {
    if (!activeDeck) return [];
    if (cardFilter === "all") return activeDeck.cards;
    return activeDeck.cards.filter((c) =>
      (c.type_line ?? "").toLowerCase().includes(cardFilter)
    );
  }, [activeDeck, cardFilter]);

  function openDeck(deck: Deck) {
    setActiveDeckId(deck.id);
    setEditName(deck.name);
    setDeckCombos([]);
    setDeckComboChecked(false);
    setExpandedDeckComboId(null);
  }

  function closeDeck() {
    setActiveDeckId(null);
    setEditName("");
    setDeckCombos([]);
    setDeckComboChecked(false);
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

            {/* ── Speichern / Importieren Buttons ── */}
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
                style={[styles.deckActionBtn, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}
                onPress={handleOpenImport}
              >
                <Ionicons name="download-outline" size={17} color={colors.primary} />
                <Text style={[styles.deckActionBtnText, { color: colors.primary }]}>
                  {showEnglish ? "Import" : "Importieren"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Gespeichert-Status ── */}
            <View style={[styles.savedStatusBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {exportFeedback ? (
                <>
                  <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
                  <Text style={[styles.savedStatusText, { color: "#22c55e" }]}>{exportFeedback}</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={15} color="#22c55e" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.savedStatusText, { color: colors.foreground }]}>
                      {showEnglish ? "Auto-saved" : "Automatisch gespeichert"}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 1 }}>
                      {formatSavedAt(activeDeck.savedAt)}
                      {"  ·  "}
                      {isSignedIn
                        ? (showEnglish ? "Local + Cloud" : "Lokal + Cloud")
                        : (showEnglish ? "Local (sign in for cloud backup)" : "Lokal (anmelden für Cloud-Backup)")}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* ── Karten ── */}
            <View style={styles.cardListHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {showEnglish
                  ? `Cards (${activeDeck.cards.reduce((a,c)=>a+c.count,0)})`
                  : `Karten (${activeDeck.cards.reduce((a,c)=>a+c.count,0)})`}
              </Text>
            </View>

            {/* ── Filter-Leiste ── */}
            {activeDeck.cards.length > 0 && (() => {
              const filters: { key: string; de: string; en: string }[] = [
                { key: "all",         de: "Alle",           en: "All" },
                { key: "creature",    de: "Kreaturen",      en: "Creatures" },
                { key: "instant",     de: "Spontan",        en: "Instants" },
                { key: "sorcery",     de: "Hexerei",        en: "Sorceries" },
                { key: "enchantment", de: "Verzauberung",   en: "Enchant." },
                { key: "artifact",    de: "Artefakt",       en: "Artifacts" },
                { key: "planeswalker",de: "Planeswalker",   en: "PW" },
                { key: "land",        de: "Länder",         en: "Lands" },
              ];
              return (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}
                  contentContainerStyle={styles.filterRow}>
                  {filters.map((f) => {
                    const cnt = f.key === "all"
                      ? activeDeck.cards.reduce((a,c)=>a+c.count,0)
                      : activeDeck.cards.filter(c=>(c.type_line??"").toLowerCase().includes(f.key)).reduce((a,c)=>a+c.count,0);
                    if (f.key !== "all" && cnt === 0) return null;
                    const active = cardFilter === f.key;
                    return (
                      <TouchableOpacity key={f.key}
                        style={[styles.filterBtn,
                          active ? { backgroundColor: colors.primary, borderColor: colors.primary }
                                 : { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setCardFilter(f.key)}>
                        <Text style={[styles.filterBtnText, { color: active ? "#fff" : colors.mutedForeground }]}>
                          {showEnglish ? f.en : f.de}
                        </Text>
                        <Text style={[styles.filterBtnCount, { color: active ? "#ffffffaa" : colors.primary }]}>{cnt}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              );
            })()}

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
              <View style={[styles.cardList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {filteredCards.length === 0 ? (
                  <View style={styles.filterEmpty}>
                    <Text style={[styles.filterEmptyText, { color: colors.mutedForeground }]}>
                      {showEnglish ? "No cards in this category" : "Keine Karten in dieser Kategorie"}
                    </Text>
                  </View>
                ) : filteredCards.map((c, i) => {
                  const land = isLand(c);
                  const mana = c.mana_cost ? parseMana(c.mana_cost) : null;
                  const cols = mana ? COLORS.filter((k) => mana[k] > 0) : [];
                  const lCols = land ? landColors(c) : [];
                  return (
                    <View key={c.id} style={[styles.cardRow,
                      i < filteredCards.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                      {/* Thumbnail */}
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
                      <TouchableOpacity style={styles.cardRowLeft}
                        onPress={() => router.push({ pathname: "/(tabs)/scan", params: { q: c.name } })}>
                        <Text style={[styles.cardRowName, { color: colors.foreground }]} numberOfLines={1}>
                          {c.printed_name ?? c.name}
                        </Text>
                        <View style={styles.cardRowMeta}>
                          {land ? (
                            <>
                              <Text style={[styles.cardRowMana, { color: colors.mutedForeground }]}>Land</Text>
                              {lCols.map((cl) => (
                                <View key={cl} style={[styles.colorDotTiny, { backgroundColor: COLOR_HEX[cl] }]}>
                                  <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT[cl] }]}>{cl}</Text>
                                </View>
                              ))}
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
                      </TouchableOpacity>
                      {/* Stepper */}
                      <View style={styles.stepper}>
                        <TouchableOpacity style={[styles.stepBtnSm, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                          onPress={() => adjustCardCount(activeDeck.id, c.id, -1)}>
                          <Ionicons name="remove" size={13} color={colors.foreground} />
                        </TouchableOpacity>
                        <Text style={[styles.stepValSm, { color: colors.foreground }]}>{c.count}×</Text>
                        <TouchableOpacity style={[styles.stepBtnSm, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                          onPress={() => adjustCardCount(activeDeck.id, c.id, 1)}>
                          <Ionicons name="add" size={13} color={colors.foreground} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginLeft: 6 }} onPress={() => removeCardFromDeck(activeDeck.id, c.id)}>
                          <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                        </TouchableOpacity>
                      </View>
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

                      // Recommendations only based on colored/colorless pips
                      const recommended: Partial<Record<string, number>> = {};
                      COLORS.forEach((k) => {
                        if (required[k] > 0 && totalColoredPips > 0)
                          recommended[k] = Math.max(1, Math.round((required[k] / totalColoredPips) * landTotal));
                      });
                      if (requiredC > 0 && totalColoredPips > 0)
                        recommended["C"] = Math.max(1, Math.round((requiredC / totalColoredPips) * landTotal));

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
                              {coloredColors.map((k) => {
                                const have = availMana[k] ?? 0;
                                const need = recommended[k] ?? 0;
                                if (need === 0) return null;
                                const ok = have >= need;
                                return (
                                  <View key={k} style={styles.coverageRow}>
                                    <View style={[styles.colorDotTiny, { backgroundColor: COLOR_HEX[k] }]}>
                                      <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT[k] }]}>{k}</Text>
                                    </View>
                                    <View style={styles.coverageBar}>
                                      <View style={[styles.coverageFill, { backgroundColor: ok ? "#16a34a" : "#dc2626", flex: Math.min(have, need) }]} />
                                      {!ok && <View style={[styles.coverageMissing, { flex: need - have }]} />}
                                    </View>
                                    <Text style={[styles.coverageText, { color: ok ? "#16a34a" : "#dc2626" }]}>
                                      {have}/{need} {ok ? "✓" : `−${need - have}`}
                                    </Text>
                                  </View>
                                );
                              })}

                              {/* Verdict */}
                              {(() => {
                                const lacking = coloredColors.filter((k) => (recommended[k] ?? 0) > 0 && (availMana[k] ?? 0) < (recommended[k] ?? 0));
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
  filterScroll: { marginBottom: 8 },
  filterRow: { flexDirection: "row", gap: 7, paddingVertical: 4 },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  filterBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  filterBtnCount: { fontSize: 11, fontFamily: "Inter_700Bold" },
  filterEmpty: { padding: 20, alignItems: "center" },
  filterEmptyText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  cardList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 8, gap: 8 },
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
  speedBadge: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  speedBadgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
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
});
