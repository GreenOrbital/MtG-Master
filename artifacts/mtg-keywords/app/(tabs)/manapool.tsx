import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";

// ─── Types ──────────────────────────────────────────────────────────────────

type LandCounts = { W: number; U: number; B: number; R: number; G: number };

type DeckCard = {
  id: string;
  name: string;
  printed_name?: string;
  mana_cost?: string;
  count: number;
};

type DeckPreset = {
  id: string;
  name: string;
  lands: LandCounts;
  cards: DeckCard[];
  savedAt: number;
};

type Suggestion = { display: string; id: string; mana_cost?: string; printed_name?: string };

type ManaCounts = { W: number; U: number; B: number; R: number; G: number; generic: number; cmc: number };

// ─── Constants ───────────────────────────────────────────────────────────────

const LAND_CONFIG = [
  { key: "W" as const, nameDe: "Ebene",  nameEn: "Plains",   hex: "#f5f0dc", text: "#1a1a1a", symbol: "W" },
  { key: "U" as const, nameDe: "Insel",  nameEn: "Island",   hex: "#0e68ab", text: "#ffffff", symbol: "U" },
  { key: "B" as const, nameDe: "Sumpf",  nameEn: "Swamp",    hex: "#2c2c2c", text: "#e0e0e0", symbol: "B" },
  { key: "R" as const, nameDe: "Berg",   nameEn: "Mountain", hex: "#d3202a", text: "#ffffff", symbol: "R" },
  { key: "G" as const, nameDe: "Wald",   nameEn: "Forest",   hex: "#00733e", text: "#ffffff", symbol: "G" },
];

const COLOR_HEX: Record<string, string> = { W: "#f5f0dc", U: "#0e68ab", B: "#2c2c2c", R: "#d3202a", G: "#00733e" };
const COLOR_TEXT: Record<string, string> = { W: "#1a1a1a", U: "#fff", B: "#e0e0e0", R: "#fff", G: "#fff" };

const STORAGE_KEY = "mtg_deck_presets_v2";
const EMPTY_LANDS: LandCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };
const HEADERS = { "User-Agent": "MtGKeywordsApp/1.0" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseMana(manaCost: string): ManaCounts {
  const r: ManaCounts = { W: 0, U: 0, B: 0, R: 0, G: 0, generic: 0, cmc: 0 };
  const matches = manaCost.match(/\{([^}]+)\}/g) ?? [];
  for (const m of matches) {
    const sym = m.replace(/[{}]/g, "").toUpperCase();
    if (sym === "W" || sym === "U" || sym === "B" || sym === "R" || sym === "G") {
      r[sym]++; r.cmc++;
    } else if (/^\d+$/.test(sym)) {
      r.generic += parseInt(sym, 10); r.cmc += parseInt(sym, 10);
    }
  }
  return r;
}

function sumMana(cards: DeckCard[]): ManaCounts {
  const total: ManaCounts = { W: 0, U: 0, B: 0, R: 0, G: 0, generic: 0, cmc: 0 };
  for (const c of cards) {
    if (!c.mana_cost) continue;
    const m = parseMana(c.mana_cost);
    total.W += m.W * c.count;
    total.U += m.U * c.count;
    total.B += m.B * c.count;
    total.R += m.R * c.count;
    total.G += m.G * c.count;
    total.generic += m.generic * c.count;
    total.cmc += m.cmc * c.count;
  }
  return total;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManapoolScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();

  // Deck state
  const [lands, setLands] = useState<LandCounts>({ ...EMPTY_LANDS });
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [deckName, setDeckName] = useState("");
  const [presets, setPresets] = useState<DeckPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Card search state
  const [cardQuery, setCardQuery] = useState("");
  const [cardSuggestions, setCardSuggestions] = useState<Suggestion[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v) setPresets(JSON.parse(v));
    });
  }, []);

  // Card search autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = cardQuery.trim();
    if (q.length < 2) { setCardSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        const [enRes, deRes] = await Promise.all([
          fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(q)}&include_extras=false`, { headers: HEADERS }),
          fetch(`https://api.scryfall.com/cards/search?q=lang%3Ade+${encodeURIComponent(q)}&order=name&unique=names`, { headers: HEADERS }),
        ]);
        const results: Suggestion[] = [];
        const seen = new Set<string>();
        if (deRes.ok) {
          const deData = (await deRes.json()) as { data: Array<{ id: string; name: string; printed_name?: string; mana_cost?: string }> };
          for (const c of deData.data.slice(0, 6)) {
            if (c.printed_name && !seen.has(c.printed_name.toLowerCase())) {
              seen.add(c.printed_name.toLowerCase());
              results.push({ display: c.printed_name, id: c.id, mana_cost: c.mana_cost, printed_name: c.printed_name });
            }
          }
        }
        if (enRes.ok) {
          const enData = (await enRes.json()) as { data: string[] };
          for (const name of enData.data.slice(0, 6)) {
            if (!seen.has(name.toLowerCase())) {
              seen.add(name.toLowerCase());
              results.push({ display: name, id: `name:${name}` });
            }
          }
        }
        setCardSuggestions(results.slice(0, 10));
      } catch { setCardSuggestions([]); }
      setLoadingSearch(false);
    }, 300);
  }, [cardQuery]);

  async function addCardToDecks(s: Suggestion) {
    setCardQuery(""); setCardSuggestions([]); setSearchFocused(false);
    let mana_cost = s.mana_cost;
    let name = s.display;
    let printed_name = s.printed_name;
    let id = s.id;

    if (s.id.startsWith("name:")) {
      try {
        const r = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(s.display)}`, { headers: HEADERS });
        if (r.ok) {
          const data = (await r.json()) as { id: string; name: string; printed_name?: string; mana_cost?: string };
          id = data.id; mana_cost = data.mana_cost; name = data.name; printed_name = data.printed_name;
        }
      } catch {}
    }

    setDeckCards((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (existing) return prev.map((c) => c.id === id ? { ...c, count: Math.min(4, c.count + 1) } : c);
      return [...prev, { id, name, printed_name, mana_cost, count: 1 }];
    });
    setActivePresetId(null);
  }

  function adjustLand(key: keyof LandCounts, delta: number) {
    setLands((prev) => ({ ...prev, [key]: Math.max(0, Math.min(40, prev[key] + delta)) }));
    setActivePresetId(null);
  }

  function setLandDirect(key: keyof LandCounts, val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n)) setLands((prev) => ({ ...prev, [key]: Math.max(0, Math.min(40, n)) }));
    setActivePresetId(null);
  }

  function adjustCardCount(id: string, delta: number) {
    setDeckCards((prev) => prev.map((c) => c.id === id ? { ...c, count: Math.max(1, Math.min(4, c.count + delta)) } : c));
    setActivePresetId(null);
  }

  function removeCard(id: string) {
    setDeckCards((prev) => prev.filter((c) => c.id !== id));
    setActivePresetId(null);
  }

  function savePresetsToStorage(p: DeckPreset[]) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  }

  function savePreset() {
    const name = deckName.trim() || (showEnglish ? "My Deck" : "Mein Deck");
    const preset: DeckPreset = { id: Date.now().toString(), name, lands: { ...lands }, cards: [...deckCards], savedAt: Date.now() };
    const next = [preset, ...presets];
    setPresets(next); savePresetsToStorage(next);
    setActivePresetId(preset.id); setDeckName("");
  }

  function loadPreset(p: DeckPreset) {
    setLands({ ...p.lands }); setDeckCards([...(p.cards ?? [])]);
    setDeckName(p.name); setActivePresetId(p.id);
  }

  function deletePreset(id: string) {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next); savePresetsToStorage(next);
    if (activePresetId === id) setActivePresetId(null);
  }

  function clearAll() {
    setLands({ ...EMPTY_LANDS }); setDeckCards([]); setDeckName(""); setActivePresetId(null);
  }

  const landTotal = Object.values(lands).reduce((a, b) => a + b, 0);
  const cardTotal = deckCards.reduce((a, c) => a + c.count, 0);
  const hasContent = landTotal > 0 || deckCards.length > 0;

  const required = sumMana(deckCards);
  const showDropdown = searchFocused && cardSuggestions.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Backdrop ── */}
      {showDropdown && (
        <TouchableOpacity style={[StyleSheet.absoluteFillObject, { zIndex: 9 }]} activeOpacity={1}
          onPress={() => setSearchFocused(false)} />
      )}

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topPad + 12, zIndex: 10 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {showEnglish ? "Deck Builder" : "Deck-Builder"}
          </Text>
          <LanguageToggle showEnglish={showEnglish} onToggle={() => setShowEnglish(!showEnglish)} />
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {showEnglish ? "Lands + cards → mana pool analysis" : "Länder + Karten → Manapool-Analyse"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Deck Name ── */}
        <View style={[styles.nameBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="albums-outline" size={17} color={colors.mutedForeground} />
          <TextInput value={deckName} onChangeText={setDeckName}
            placeholder={showEnglish ? "Deck name (optional)…" : "Deckname (optional)…"}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.nameInput, { color: colors.foreground }]} autoCorrect={false} />
          {deckName.length > 0 && (
            <TouchableOpacity onPress={() => setDeckName("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* ══ SECTION: LÄNDER ══ */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {showEnglish ? "Lands" : "Länder"}
          </Text>
          {landTotal > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countBadgeText}>{landTotal}</Text>
            </View>
          )}
        </View>
        <View style={[styles.landBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {LAND_CONFIG.map((lc, i) => (
            <View key={lc.key} style={[styles.landRow,
              i < LAND_CONFIG.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
              <View style={[styles.colorDot, { backgroundColor: lc.hex }]}>
                <Text style={[styles.colorDotText, { color: lc.text }]}>{lc.symbol}</Text>
              </View>
              <View style={styles.landNameCol}>
                <Text style={[styles.landName, { color: colors.foreground }]}>{showEnglish ? lc.nameEn : lc.nameDe}</Text>
                <Text style={[styles.landSub, { color: colors.mutedForeground }]}>{showEnglish ? lc.nameDe : lc.nameEn}</Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity style={[styles.stepBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={() => adjustLand(lc.key, -1)}>
                  <Ionicons name="remove" size={18} color={colors.foreground} />
                </TouchableOpacity>
                <TextInput style={[styles.stepValue, { color: colors.foreground, borderColor: colors.border }]}
                  value={String(lands[lc.key])} onChangeText={(v) => setLandDirect(lc.key, v)}
                  keyboardType="number-pad" selectTextOnFocus />
                <TouchableOpacity style={[styles.stepBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={() => adjustLand(lc.key, 1)}>
                  <Ionicons name="add" size={18} color={colors.foreground} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ══ SECTION: KARTEN ══ */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {showEnglish ? "Cards" : "Karten"}
          </Text>
          {cardTotal > 0 && (
            <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.countBadgeText}>{cardTotal}</Text>
            </View>
          )}
        </View>

        {/* Card search with dropdown */}
        <View style={{ zIndex: 20 }}>
          <View style={[styles.cardSearchBox, { backgroundColor: colors.card, borderColor: showDropdown ? colors.primary : colors.border }]}>
            <Ionicons name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={cardQuery}
              onChangeText={setCardQuery}
              placeholder={showEnglish ? "Add card by name…" : "Karte nach Name hinzufügen…"}
              placeholderTextColor={colors.mutedForeground}
              style={[styles.cardSearchInput, { color: colors.foreground }]}
              autoCorrect={false} autoCapitalize="words"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
            />
            {loadingSearch && <ActivityIndicator size="small" color={colors.primary} />}
            {cardQuery.length > 0 && !loadingSearch && (
              <TouchableOpacity onPress={() => { setCardQuery(""); setCardSuggestions([]); }}>
                <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          {showDropdown && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.primary }]}>
              {cardSuggestions.map((s, i) => (
                <TouchableOpacity key={`${s.id}-${i}`}
                  style={[styles.dropdownItem,
                    i < cardSuggestions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                  onPress={() => addCardToDecks(s)}>
                  <View style={styles.dropdownLeft}>
                    <Ionicons name="add-circle-outline" size={16} color={colors.primary} />
                    <Text style={[styles.dropdownText, { color: colors.foreground }]} numberOfLines={1}>{s.display}</Text>
                  </View>
                  {s.mana_cost ? (
                    <Text style={[styles.dropdownMana, { color: colors.mutedForeground }]}>{s.mana_cost}</Text>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Card list */}
        {deckCards.length > 0 && (
          <View style={[styles.cardList, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {deckCards.map((c, i) => {
              const mana = c.mana_cost ? parseMana(c.mana_cost) : null;
              const colors2 = mana ? (["W","U","B","R","G"] as const).filter((k) => mana[k] > 0) : [];
              return (
                <View key={c.id} style={[styles.cardRow,
                  i < deckCards.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                  <View style={styles.cardRowLeft}>
                    <Text style={[styles.cardRowName, { color: colors.foreground }]} numberOfLines={1}>
                      {c.printed_name ?? c.name}
                    </Text>
                    <View style={styles.cardRowMeta}>
                      {c.mana_cost ? (
                        <Text style={[styles.cardRowMana, { color: colors.mutedForeground }]}>{c.mana_cost}</Text>
                      ) : null}
                      {colors2.map((cl) => (
                        <View key={cl} style={[styles.colorDotTiny, { backgroundColor: COLOR_HEX[cl] }]}>
                          <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT[cl] }]}>{cl}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.stepper}>
                    <TouchableOpacity style={[styles.stepBtnSm, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                      onPress={() => adjustCardCount(c.id, -1)}>
                      <Ionicons name="remove" size={14} color={colors.foreground} />
                    </TouchableOpacity>
                    <Text style={[styles.stepValueSm, { color: colors.foreground }]}>{c.count}×</Text>
                    <TouchableOpacity style={[styles.stepBtnSm, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                      onPress={() => adjustCardCount(c.id, 1)}>
                      <Ionicons name="add" size={14} color={colors.foreground} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => removeCard(c.id)} style={{ marginLeft: 4 }}>
                      <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {deckCards.length === 0 && (
          <View style={[styles.emptyCards, { borderColor: colors.border }]}>
            <Text style={[styles.emptyCardsText, { color: colors.mutedForeground }]}>
              {showEnglish ? "Search and add cards above" : "Karten oben suchen und hinzufügen"}
            </Text>
          </View>
        )}

        {/* ══ SECTION: MANAPOOL-ANALYSE ══ */}
        {hasContent && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                {showEnglish ? "Mana Pool Analysis" : "Manapool-Analyse"}
              </Text>
            </View>

            <View style={[styles.analysisBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Available Mana */}
              <View style={styles.analysisRow}>
                <Ionicons name="water" size={16} color={colors.primary} />
                <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                  {showEnglish ? "Available (from lands)" : "Verfügbar (aus Ländern)"}
                </Text>
                <Text style={[styles.analysisValue, { color: colors.primary }]}>{landTotal}</Text>
              </View>

              {landTotal > 0 && (
                <View style={styles.colorBarRow}>
                  <View style={styles.colorBar}>
                    {LAND_CONFIG.filter((lc) => lands[lc.key] > 0).map((lc) => (
                      <View key={lc.key} style={[styles.colorBarSeg, { backgroundColor: lc.hex, flex: lands[lc.key] }]} />
                    ))}
                  </View>
                  <View style={styles.colorChips}>
                    {LAND_CONFIG.filter((lc) => lands[lc.key] > 0).map((lc) => (
                      <View key={lc.key} style={[styles.colorChipSmall, { backgroundColor: lc.hex }]}>
                        <Text style={[styles.colorChipSmallText, { color: lc.text }]}>{lands[lc.key]}{lc.symbol}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Required Mana */}
              {deckCards.length > 0 && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.analysisRow}>
                    <Ionicons name="flash" size={16} color="#f59e0b" />
                    <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                      {showEnglish ? "Required (card costs)" : "Benötigt (Kartenkosten)"}
                    </Text>
                    <Text style={[styles.analysisValue, { color: "#f59e0b" }]}>{required.cmc}</Text>
                  </View>

                  {required.cmc > 0 && (
                    <View style={styles.colorChips}>
                      {(["W","U","B","R","G"] as const).filter((k) => required[k] > 0).map((k) => (
                        <View key={k} style={[styles.colorChipSmall, { backgroundColor: COLOR_HEX[k] }]}>
                          <Text style={[styles.colorChipSmallText, { color: COLOR_TEXT[k] }]}>{required[k]}{k}</Text>
                        </View>
                      ))}
                      {required.generic > 0 && (
                        <View style={[styles.colorChipSmall, { backgroundColor: colors.secondary }]}>
                          <Text style={[styles.colorChipSmallText, { color: colors.secondaryForeground }]}>{required.generic} gem.</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Coverage indicator */}
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  {(["W","U","B","R","G"] as const).map((k) => {
                    const have = lands[k];
                    const need = required[k];
                    if (need === 0) return null;
                    const ok = have >= need;
                    return (
                      <View key={k} style={styles.coverageRow}>
                        <View style={[styles.colorDotTiny, { backgroundColor: COLOR_HEX[k] }]}>
                          <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT[k] }]}>{k}</Text>
                        </View>
                        <View style={styles.coverageBar}>
                          <View style={[styles.coverageBarFill, {
                            backgroundColor: ok ? "#16a34a" : "#dc2626",
                            flex: Math.min(have, need),
                          }]} />
                          {!ok && <View style={[styles.coverageBarMissing, { flex: need - have }]} />}
                        </View>
                        <Text style={[styles.coverageText, { color: ok ? "#16a34a" : "#dc2626" }]}>
                          {have}/{need} {ok ? "✓" : `−${need - have}`}
                        </Text>
                      </View>
                    );
                  })}

                  {/* Overall verdict */}
                  {(() => {
                    const lacking = (["W","U","B","R","G"] as const).filter((k) => required[k] > 0 && lands[k] < required[k]);
                    if (lacking.length === 0 && landTotal >= required.cmc) {
                      return (
                        <View style={[styles.verdictBox, { backgroundColor: "#16a34a22", borderColor: "#16a34a" }]}>
                          <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                          <Text style={[styles.verdictText, { color: "#16a34a" }]}>
                            {showEnglish ? "Mana pool covers all card costs!" : "Manapool deckt alle Kartenkosten!"}
                          </Text>
                        </View>
                      );
                    }
                    return (
                      <View style={[styles.verdictBox, { backgroundColor: "#dc262622", borderColor: "#dc2626" }]}>
                        <Ionicons name="alert-circle" size={16} color="#dc2626" />
                        <Text style={[styles.verdictText, { color: "#dc2626" }]}>
                          {showEnglish
                            ? `Need more ${lacking.join(", ")} mana sources`
                            : `Mehr ${lacking.join("/")} Mana-Quellen nötig`}
                        </Text>
                      </View>
                    );
                  })()}
                </>
              )}

              {/* Mana curve */}
              {deckCards.length > 0 && (() => {
                const curve: Record<number, number> = {};
                for (const c of deckCards) {
                  if (!c.mana_cost) continue;
                  const cmc = parseMana(c.mana_cost).cmc;
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
                        const height = maxCount > 0 ? (count / maxCount) * 60 : 0;
                        return (
                          <View key={i} style={styles.curveCol}>
                            {count > 0 && <Text style={[styles.curveCount, { color: colors.primary }]}>{count}</Text>}
                            <View style={styles.curveBarContainer}>
                              <View style={[styles.curveBar, { height, backgroundColor: count > 0 ? colors.primary : "transparent" }]} />
                            </View>
                            <Text style={[styles.curveCmc, { color: colors.mutedForeground }]}>
                              {i === 8 ? "8+" : String(i)}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </>
                );
              })()}

              {/* Tip */}
              <View style={[styles.tipRow, { borderTopColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={13} color={colors.mutedForeground} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                  {showEnglish
                    ? `${landTotal} lands, ${cardTotal} cards. Each land = 1 mana/turn.`
                    : `${landTotal} Länder, ${cardTotal} Karten. Jedes Land = 1 Mana/Runde.`}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* ── Save Buttons ── */}
        <View style={styles.saveRow}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: hasContent ? 1 : 0.5 }]}
            onPress={savePreset} disabled={!hasContent}>
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>{showEnglish ? "Save Deck" : "Deck speichern"}</Text>
          </TouchableOpacity>
          {hasContent && (
            <TouchableOpacity style={[styles.clearBtn, { borderColor: colors.border }]} onPress={clearAll}>
              <Text style={[styles.clearBtnText, { color: colors.mutedForeground }]}>{showEnglish ? "Reset" : "Zurücksetzen"}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Saved Presets ── */}
        {presets.length > 0 && (
          <View style={styles.presetsSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {showEnglish ? "Saved Decks" : "Gespeicherte Decks"}
            </Text>
            {presets.map((p) => {
              const pLandTotal = Object.values(p.lands).reduce((a, b) => a + b, 0);
              const pCardTotal = (p.cards ?? []).reduce((a, c) => a + c.count, 0);
              const isActive = p.id === activePresetId;
              return (
                <View key={p.id} style={[styles.presetCard, {
                  backgroundColor: isActive ? colors.primary + "18" : colors.card,
                  borderColor: isActive ? colors.primary : colors.border,
                }]}>
                  <TouchableOpacity style={styles.presetMain} onPress={() => loadPreset(p)}>
                    <View style={styles.presetHeader}>
                      <Text style={[styles.presetName, { color: colors.foreground }]}>{p.name}</Text>
                      <Text style={[styles.presetMeta, { color: colors.mutedForeground }]}>
                        {pLandTotal}L · {pCardTotal}K
                      </Text>
                    </View>
                    {pLandTotal > 0 && (
                      <View style={styles.miniBar}>
                        {LAND_CONFIG.filter((lc) => p.lands[lc.key] > 0).map((lc) => (
                          <View key={lc.key} style={[styles.miniBarSeg, { backgroundColor: lc.hex, flex: p.lands[lc.key] }]} />
                        ))}
                      </View>
                    )}
                    <View style={styles.presetCounts}>
                      {LAND_CONFIG.filter((lc) => p.lands[lc.key] > 0).map((lc) => (
                        <View key={lc.key} style={[styles.presetBadge, { backgroundColor: lc.hex }]}>
                          <Text style={[styles.presetBadgeText, { color: lc.text }]}>{p.lands[lc.key]}{lc.symbol}</Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() =>
                    Alert.alert(
                      showEnglish ? "Delete?" : "Löschen?",
                      `"${p.name}"`,
                      [{ text: showEnglish ? "Cancel" : "Abbrechen", style: "cancel" },
                       { text: showEnglish ? "Delete" : "Löschen", style: "destructive", onPress: () => deletePreset(p.id) }]
                    )}>
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {!hasContent && presets.length === 0 && (
          <View style={styles.emptyHint}>
            <Ionicons name="water-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {showEnglish ? "Build your deck" : "Deck zusammenstellen"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {showEnglish
                ? "Enter your lands and add cards to see if your mana pool covers all card costs."
                : "Länder eingeben und Karten hinzufügen, um zu prüfen ob dein Manapool alle Kartenkosten abdeckt."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  scroll: { padding: 16, flexGrow: 1, gap: 14 },
  nameBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  nameInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1 },
  countBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 2 },
  countBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  landBox: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  landRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 12 },
  colorDot: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  colorDotText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  landNameCol: { flex: 1 },
  landName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  landSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 5 },
  stepBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepBtnSm: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  stepValue: { width: 38, height: 34, borderRadius: 8, borderWidth: 1, textAlign: "center", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  stepValueSm: { fontSize: 14, fontFamily: "Inter_600SemiBold", width: 28, textAlign: "center" },
  cardSearchBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  cardSearchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", padding: 0 },
  dropdown: {
    borderRadius: 12, borderWidth: 1.5, overflow: "hidden", marginTop: 4,
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 }, android: { elevation: 8 } }),
  },
  dropdownItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 11, justifyContent: "space-between" },
  dropdownLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  dropdownText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  dropdownMana: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  cardRowLeft: { flex: 1 },
  cardRowName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  cardRowMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardRowMana: { fontSize: 12, fontFamily: "Inter_400Regular" },
  colorDotTiny: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  colorDotTinyText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  emptyCards: { borderRadius: 12, borderWidth: 1, borderStyle: "dashed", padding: 16, alignItems: "center" },
  emptyCardsText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  analysisBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  analysisRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  analysisLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  analysisValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  colorBarRow: { gap: 6 },
  colorBar: { height: 16, borderRadius: 8, flexDirection: "row", overflow: "hidden" },
  colorBarSeg: {},
  colorChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  colorChipSmall: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  colorChipSmallText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  divider: { height: StyleSheet.hairlineWidth },
  coverageRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  coverageBar: { flex: 1, height: 10, borderRadius: 5, flexDirection: "row", overflow: "hidden", backgroundColor: "#33333366" },
  coverageBarFill: { borderRadius: 5 },
  coverageBarMissing: { backgroundColor: "#dc262644" },
  coverageText: { fontSize: 12, fontFamily: "Inter_600SemiBold", width: 46, textAlign: "right" },
  verdictBox: { borderRadius: 10, borderWidth: 1, padding: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  verdictText: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  curveTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  curveChart: { flexDirection: "row", alignItems: "flex-end", height: 86, gap: 4 },
  curveCol: { flex: 1, alignItems: "center" },
  curveCount: { fontSize: 10, fontFamily: "Inter_700Bold", marginBottom: 2 },
  curveBarContainer: { height: 60, justifyContent: "flex-end", width: "100%" },
  curveBar: { borderRadius: 4, width: "100%" },
  curveCmc: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2 },
  tipRow: { borderTopWidth: 1, paddingTop: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  tipText: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 },
  saveRow: { flexDirection: "row", gap: 10 },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 13 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  clearBtn: { paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, justifyContent: "center" },
  clearBtnText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  presetsSection: { gap: 10 },
  presetCard: { borderRadius: 14, borderWidth: 1, flexDirection: "row", overflow: "hidden" },
  presetMain: { flex: 1, padding: 12, gap: 7 },
  presetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  presetName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  presetMeta: { fontSize: 13, fontFamily: "Inter_400Regular" },
  miniBar: { height: 8, borderRadius: 4, flexDirection: "row", overflow: "hidden" },
  miniBarSeg: {},
  presetCounts: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  presetBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  presetBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  deleteBtn: { padding: 14, justifyContent: "center" },
  emptyHint: { alignItems: "center", paddingTop: 30, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
