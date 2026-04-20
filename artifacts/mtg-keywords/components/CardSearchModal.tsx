import { Ionicons } from "@expo/vector-icons";
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

import { useDecks } from "@/context/DeckContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";

// ─── Scryfall autocomplete ────────────────────────────────────────────────────

const HEADERS = { Accept: "application/json;q=0.9,*/*;q=0.8" };

type Suggestion = { display: string; englishName: string };

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

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = { visible: boolean; onClose: () => void };

// ─── Component ───────────────────────────────────────────────────────────────

export function CardSearchModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();
  const { decks, freeCards } = useDecks();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState<string | null>(null); // the card name we searched for
  const [inputFocused, setInputFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setSuggestions([]);
      setSearched(null);
      setLoading(false);
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

  function search(cardName: string, displayName: string) {
    setSuggestions([]);
    setInputFocused(false);
    setQuery(displayName);
    setSearched(cardName.toLowerCase());
  }

  function handleSubmit() {
    if (suggestions.length > 0) {
      search(suggestions[0].englishName, suggestions[0].display);
    } else if (query.trim()) {
      search(query.trim(), query.trim());
    }
  }

  // Find all decks that contain the searched card (match by name, case-insensitive)
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

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: colors.background }]}>

        {/* Backdrop */}
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

          {/* Search input + dropdown */}
          <View style={{ position: "relative", zIndex: 100 }}>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.primary + "80" }]}>
              <Ionicons name="search" size={18} color={colors.primary} />
              <TextInput
                value={query}
                onChangeText={(t) => { setQuery(t); setSearched(null); }}
                placeholder={showEnglish ? "Card name (DE or EN)…" : "Kartenname (DE oder EN)…"}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
                onSubmitEditing={handleSubmit}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setTimeout(() => setInputFocused(false), 200)}
                autoFocus
              />
              {loading && <ActivityIndicator size="small" color={colors.primary} />}
              {query.length > 0 && !loading && (
                <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); setSearched(null); }}>
                  <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* Dropdown suggestions */}
            {showDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={`${s.display}-${i}`}
                    style={[styles.suggestionRow, i < suggestions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                    onPress={() => search(s.englishName, s.display)}
                  >
                    <Ionicons name="card-outline" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.suggestionText, { color: colors.foreground }]} numberOfLines={1}>
                      {s.display}
                    </Text>
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

        {/* Results */}
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
                {showEnglish ? "Search for a card" : "Karte suchen"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? "Type a card name to see if it's in any of your decks and how many copies you have."
                  : "Kartennamen eingeben um zu sehen, in welchen Decks du sie hast und wie oft."}
              </Text>
            </View>
          )}

          {/* Search result */}
          {searched && (
            <View style={{ gap: 10 }}>

              {/* Summary banner */}
              {totalCount > 0 ? (
                <View style={[styles.banner, { backgroundColor: "#16a34a15", borderColor: "#16a34a55" }]}>
                  <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: "#16a34a" }}>
                      {showEnglish
                        ? `Found ${totalCount}× in your collection`
                        : `${totalCount}× in deiner Sammlung vorhanden`}
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
                    {showEnglish
                      ? "Not in any of your decks."
                      : "Nicht in deinen Decks vorhanden."}
                  </Text>
                </View>
              )}

              {/* Per-deck breakdown */}
              {results.length > 0 && (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                    {showEnglish ? "In your decks:" : "In deinen Decks:"}
                  </Text>
                  {results.map((r, i) => (
                    <View
                      key={r.deckId}
                      style={[
                        styles.deckRow,
                        i < results.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                      ]}
                    >
                      <Ionicons name="albums-outline" size={16} color={colors.primary} />
                      <Text style={[styles.deckName, { color: colors.foreground }]} numberOfLines={1}>
                        {r.deckName}
                      </Text>
                      <View style={[styles.countBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                        <Text style={[styles.countText, { color: colors.primary }]}>{r.count}×</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Free cards pool */}
              {freeEntry && (
                <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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

              {/* No results hint */}
              {totalCount === 0 && decks.length === 0 && (
                <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: "center", fontFamily: "Inter_400Regular" }}>
                  {showEnglish ? "You don't have any decks yet." : "Du hast noch keine Decks angelegt."}
                </Text>
              )}
            </View>
          )}
        </ScrollView>
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
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  suggestionText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  scroll: { padding: 16, gap: 12 },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  banner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  bannerText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  card: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6 },
  deckRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 13 },
  deckName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  countBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  countText: { fontSize: 13, fontFamily: "Inter_700Bold" },
});
