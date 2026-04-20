import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import { type Deck, type DeckCard, useDecks } from "@/context/DeckContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";

// ─── Scryfall ────────────────────────────────────────────────────────────────

const HEADERS = { Accept: "application/json;q=0.9,*/*;q=0.8" };

type Suggestion = { display: string; englishName: string };

type ScryfallCard = {
  id: string;
  name: string;
  printed_name?: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  oracle_text?: string;
  keywords?: string[];
  image_uris?: { normal?: string; small?: string };
  card_faces?: Array<{ image_uris?: { normal?: string; small?: string } }>;
  prices?: { eur?: string | null; usd?: string | null };
};

async function fetchSuggestions(query: string): Promise<Suggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  try {
    const [enRes, deRes] = await Promise.all([
      fetch(`https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(trimmed)}&include_extras=false`, { headers: HEADERS }),
      fetch(`https://api.scryfall.com/cards/search?q=lang%3Ade+${encodeURIComponent(trimmed)}&order=name&unique=names`, { headers: HEADERS }),
    ]);
    const suggestions: Suggestion[] = [];
    const seen = new Set<string>();
    if (deRes.ok) {
      const data = (await deRes.json()) as { data: { name: string; printed_name?: string }[] };
      for (const c of data.data ?? []) {
        if (!c.printed_name) continue;
        const key = c.printed_name.toLowerCase();
        if (!seen.has(key)) { seen.add(key); suggestions.push({ display: c.printed_name, englishName: c.name }); }
        if (suggestions.length >= 6) break;
      }
    }
    if (enRes.ok) {
      const data = (await enRes.json()) as { data: string[] };
      for (const name of data.data ?? []) {
        const key = name.toLowerCase();
        if (!seen.has(key)) { seen.add(key); suggestions.push({ display: name, englishName: name }); }
        if (suggestions.length >= 10) break;
      }
    }
    return suggestions.slice(0, 10);
  } catch { return []; }
}

async function fetchCardByName(name: string): Promise<ScryfallCard | null> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`,
      { headers: HEADERS }
    );
    return res.ok ? ((await res.json()) as ScryfallCard) : null;
  } catch { return null; }
}

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = { visible: boolean; onClose: () => void };

// ─── Component ───────────────────────────────────────────────────────────────

export function CardSearchModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();
  const { decks, freeCards, addCardToDeck, addToFreeCards } = useDecks();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState<string | null>(null);
  const [fetchedCard, setFetchedCard] = useState<ScryfallCard | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery(""); setSuggestions([]); setSearched(null);
      setFetchedCard(null); setLoading(false); setFeedback(null);
      setShowDeckPicker(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setLoading(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(query);
      setSuggestions(results);
      setLoading(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function search(englishName: string, displayName: string) {
    setSuggestions([]);
    setInputFocused(false);
    setQuery(displayName);
    setSearched(englishName.toLowerCase());
    setFetchedCard(null);
    const card = await fetchCardByName(englishName);
    setFetchedCard(card);
  }

  function handleSubmit() {
    if (suggestions.length > 0) search(suggestions[0].englishName, suggestions[0].display);
    else if (query.trim()) search(query.trim(), query.trim());
  }

  function showFeedback(msg: string) {
    setFeedback(msg);
    if (feedbackRef.current) clearTimeout(feedbackRef.current);
    feedbackRef.current = setTimeout(() => setFeedback(null), 2500);
  }

  function toDeckCard(): Omit<DeckCard, "count"> | null {
    if (!fetchedCard) return null;
    return {
      id: fetchedCard.id,
      name: fetchedCard.name,
      printed_name: fetchedCard.printed_name,
      mana_cost: fetchedCard.mana_cost,
      cmc: fetchedCard.cmc,
      type_line: fetchedCard.type_line,
      oracle_text: fetchedCard.oracle_text,
      keywords: fetchedCard.keywords,
      imageUri: fetchedCard.image_uris?.normal ?? fetchedCard.card_faces?.[0]?.image_uris?.normal,
    };
  }

  function handleAddToDeck(deck: Deck) {
    const card = toDeckCard();
    if (!card) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    addCardToDeck(deck.id, card, 1);
    setShowDeckPicker(false);
    showFeedback(showEnglish ? `Added to "${deck.name}"` : `Zu „${deck.name}" hinzugefügt`);
  }

  function handleAddToFreeCards() {
    const card = toDeckCard();
    if (!card) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addToFreeCards({ ...card, count: 1 });
    showFeedback(showEnglish ? "Added to Free Cards Pool" : "Zu Freie Karten hinzugefügt");
  }

  // Deck inventory
  const results = searched
    ? decks.map((deck) => {
        const entry = deck.cards.find(
          (c) => c.name.toLowerCase() === searched || (c.printed_name ?? "").toLowerCase() === searched
        );
        return entry ? { deckName: deck.name, count: entry.count, deckId: deck.id } : null;
      }).filter(Boolean) as { deckName: string; count: number; deckId: string }[]
    : [];

  const freeEntry = searched
    ? freeCards.find((c) => c.name.toLowerCase() === searched || (c.printed_name ?? "").toLowerCase() === searched)
    : null;

  const totalCount = results.reduce((a, r) => a + r.count, 0) + (freeEntry?.count ?? 0);
  const showDropdown = inputFocused && suggestions.length > 0;
  const topPad = Platform.OS === "web" ? 12 : insets.top;
  const canAdd = !!fetchedCard;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: colors.background }]}>

        {showDropdown && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { setInputFocused(false); setSuggestions([]); }}
            style={[StyleSheet.absoluteFillObject, { zIndex: 9 }]}
          />
        )}

        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border, backgroundColor: colors.background, zIndex: 10 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {showEnglish ? "Check Collection" : "Bestand prüfen"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={{ position: "relative", zIndex: 100 }}>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.primary + "80" }]}>
              <Ionicons name="search" size={18} color={colors.primary} />
              <TextInput
                value={query}
                onChangeText={(t) => { setQuery(t); setSearched(null); setFetchedCard(null); }}
                placeholder={showEnglish ? "Card name (DE or EN)…" : "Kartenname (DE oder EN)…"}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                autoCorrect={false} autoCapitalize="words"
                returnKeyType="search"
                onSubmitEditing={handleSubmit}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setTimeout(() => setInputFocused(false), 200)}
                autoFocus
              />
              {loading && <ActivityIndicator size="small" color={colors.primary} />}
              {query.length > 0 && !loading && (
                <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); setSearched(null); setFetchedCard(null); }}>
                  <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {showDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={`${s.display}-${i}`}
                    style={[styles.suggRow, i < suggestions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                    onPress={() => search(s.englishName, s.display)}
                  >
                    <Ionicons name="card-outline" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.suggText, { color: colors.foreground }]} numberOfLines={1}>{s.display}</Text>
                    {s.englishName !== s.display && (
                      <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginLeft: "auto", flexShrink: 1 }} numberOfLines={1}>
                        {s.englishName}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: (Platform.OS === "web" ? 84 : insets.bottom) + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Empty state */}
          {!searched && (
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {showEnglish ? "Search your collection" : "Bestand prüfen"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? "Type a card name to check your decks and add it anywhere."
                  : "Kartennamen eingeben um deinen Bestand zu prüfen und die Karte hinzuzufügen."}
              </Text>
            </View>
          )}

          {searched && (
            <View style={{ gap: 10 }}>

              {/* Summary banner */}
              {totalCount > 0 ? (
                <View style={[styles.banner, { backgroundColor: "#16a34a15", borderColor: "#16a34a55" }]}>
                  <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#16a34a" }}>
                      {showEnglish ? `${totalCount}× in your collection` : `${totalCount}× in deiner Sammlung`}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "#16a34a", marginTop: 2 }}>
                      {showEnglish
                        ? `${results.length} deck${results.length !== 1 ? "s" : ""}${freeEntry ? " + free pool" : ""}`
                        : `${results.length} Deck${results.length !== 1 ? "s" : ""}${freeEntry ? " + Freie Karten" : ""}`}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="close-circle-outline" size={22} color={colors.mutedForeground} />
                  <Text style={[styles.bannerText, { color: colors.mutedForeground }]}>
                    {showEnglish ? "Not in any of your decks." : "Nicht in deinen Decks vorhanden."}
                  </Text>
                </View>
              )}

              {/* Per-deck breakdown */}
              {results.length > 0 && (
                <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.listLabel, { color: colors.mutedForeground }]}>
                    {showEnglish ? "In your decks:" : "In deinen Decks:"}
                  </Text>
                  {results.map((r, i) => (
                    <View
                      key={r.deckId}
                      style={[styles.deckRow, i < results.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                    >
                      <Ionicons name="albums-outline" size={16} color={colors.primary} />
                      <Text style={[styles.deckName, { color: colors.foreground }]} numberOfLines={1}>{r.deckName}</Text>
                      <View style={[styles.countBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                        <Text style={[styles.countText, { color: colors.primary }]}>{r.count}×</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Free cards pool */}
              {freeEntry && (
                <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.deckRow}>
                    <Ionicons name="layers-outline" size={16} color={colors.primary} />
                    <Text style={[styles.deckName, { color: colors.foreground }]}>
                      {showEnglish ? "Free Cards Pool" : "Freie Karten"}
                    </Text>
                    <View style={[styles.countBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                      <Text style={[styles.countText, { color: colors.primary }]}>{freeEntry.count}×</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* ── Add section ── */}
              <View style={[styles.addSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.listLabel, { color: colors.mutedForeground }]}>
                  {showEnglish ? "Add 1 copy to:" : "1 Kopie hinzufügen zu:"}
                </Text>

                {/* Add to deck button */}
                <TouchableOpacity
                  style={[styles.addBtn, { backgroundColor: canAdd ? colors.primary : colors.secondary, opacity: canAdd ? 1 : 0.5 }]}
                  onPress={() => setShowDeckPicker(true)}
                  disabled={!canAdd || decks.length === 0}
                  activeOpacity={0.8}
                >
                  {!canAdd && !fetchedCard && searched ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="albums-outline" size={17} color="#fff" />
                  )}
                  <Text style={styles.addBtnText}>
                    {showEnglish ? "Add to Deck…" : "Zu Deck hinzufügen…"}
                  </Text>
                </TouchableOpacity>

                {decks.length === 0 && (
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                    {showEnglish ? "Create a deck first in the deck builder." : "Zuerst ein Deck im Deck-Builder anlegen."}
                  </Text>
                )}

                {/* Divider */}
                <View style={[styles.divider, { borderColor: colors.border }]} />

                {/* Add to free cards */}
                <TouchableOpacity
                  style={[styles.addBtnSecondary, { borderColor: canAdd ? colors.primary + "66" : colors.border, opacity: canAdd ? 1 : 0.5 }]}
                  onPress={handleAddToFreeCards}
                  disabled={!canAdd}
                  activeOpacity={0.8}
                >
                  <Ionicons name="layers-outline" size={17} color={canAdd ? colors.primary : colors.mutedForeground} />
                  <Text style={[styles.addBtnSecondaryText, { color: canAdd ? colors.primary : colors.mutedForeground }]}>
                    {showEnglish ? "Add to Free Cards Pool" : "Zu Freie Karten hinzufügen"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Feedback */}
              {feedback && (
                <View style={[styles.banner, { backgroundColor: "#16a34a15", borderColor: "#16a34a55" }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />
                  <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: "#16a34a", flex: 1 }}>{feedback}</Text>
                </View>
              )}

            </View>
          )}
        </ScrollView>

        {/* ── Deck Picker Modal ── */}
        <Modal visible={showDeckPicker} transparent animationType="fade">
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowDeckPicker(false)}>
            <View style={[styles.pickerSheet, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
                {showEnglish ? "Choose a Deck" : "Deck auswählen"}
              </Text>
              <View style={{ gap: 8 }}>
                {decks.map((deck) => {
                  const existing = deck.cards.find(
                    (c) => c.id === fetchedCard?.id || c.name.toLowerCase() === (fetchedCard?.name ?? "").toLowerCase()
                  );
                  return (
                    <TouchableOpacity
                      key={deck.id}
                      onPress={() => handleAddToDeck(deck)}
                      style={[styles.pickerRow, { backgroundColor: colors.background, borderColor: existing ? colors.primary + "66" : colors.border }]}
                    >
                      <Ionicons name={existing ? "albums" : "albums-outline"} size={16} color={existing ? colors.primary : colors.mutedForeground} />
                      <Text style={{ flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{deck.name}</Text>
                      {existing && (
                        <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: colors.primary }}>{existing.count}×</Text>
                      )}
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                        {deck.cards.reduce((a, c) => a + c.count, 0)} {showEnglish ? "cards" : "Karten"}
                      </Text>
                      <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={() => setShowDeckPicker(false)} style={{ marginTop: 14, alignItems: "center" }}>
                <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                  {showEnglish ? "Cancel" : "Abbrechen"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

      </View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 18, fontFamily: "Inter_700Bold" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, borderRadius: 10, borderWidth: 1, overflow: "hidden", zIndex: 200, marginTop: 4 },
  suggRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  suggText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  scroll: { padding: 16, gap: 12 },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  banner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  bannerText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  listCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  listLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  deckRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  deckName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  countText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  addSection: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 10 },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, marginVertical: 2 },
  addBtnSecondary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  addBtnSecondaryText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pickerOverlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "center", alignItems: "center", padding: 24 },
  pickerSheet: { width: "100%", borderRadius: 16, padding: 20, gap: 4 },
  pickerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 12 },
  pickerRow: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, borderWidth: 1, gap: 10 },
});
