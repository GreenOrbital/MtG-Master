import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeywordCard } from "@/components/KeywordCard";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useSettings } from "@/context/SettingsContext";
import { MTG_KEYWORDS, type MtgKeyword } from "@/data/keywords";
import { useColors } from "@/hooks/useColors";

type CardData = {
  name: string;
  keywords: string[];
  oracle_text?: string;
  type_line?: string;
  mana_cost?: string;
  power?: string;
  toughness?: string;
  set_name?: string;
  image_uris?: { normal?: string; small?: string };
};

function matchLocalKeywords(scryfallKeywords: string[], oracleText: string): MtgKeyword[] {
  const found = new Map<string, MtgKeyword>();
  for (const kw of MTG_KEYWORDS) {
    const enLower = kw.nameEn.toLowerCase();
    const deLower = kw.name.toLowerCase();
    for (const sk of scryfallKeywords) {
      if (sk.toLowerCase() === enLower || sk.toLowerCase() === deLower) {
        found.set(kw.id, kw);
      }
    }
    const oracle = oracleText.toLowerCase();
    if (oracle.includes(enLower) || oracle.includes(deLower)) {
      found.set(kw.id, kw);
    }
  }
  return Array.from(found.values());
}

export default function CardSearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [card, setCard] = useState<CardData | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [matchedKeywords, setMatchedKeywords] = useState<MtgKeyword[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(trimmed)}&include_extras=false`,
          { headers: { "User-Agent": "MtGKeywordsApp/1.0" } }
        );
        if (res.ok) {
          const data = (await res.json()) as { data: string[] };
          setSuggestions(data.data.slice(0, 12));
          setShowSuggestions(true);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);
  }, [query]);

  async function selectCard(name: string) {
    setQuery(name);
    setSuggestions([]);
    setShowSuggestions(false);
    setCard(null);
    setMatchedKeywords([]);
    setExpandedId(null);
    setErrorMsg("");
    setLoadingCard(true);
    try {
      const res = await fetch(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
        { headers: { "User-Agent": "MtGKeywordsApp/1.0" } }
      );
      if (!res.ok) {
        setErrorMsg(
          showEnglish
            ? `Card "${name}" not found.`
            : `Karte "${name}" nicht gefunden.`
        );
        setLoadingCard(false);
        return;
      }
      const data = (await res.json()) as CardData;
      setCard(data);
      const matched = matchLocalKeywords(data.keywords ?? [], data.oracle_text ?? "");
      setMatchedKeywords(matched);
    } catch {
      setErrorMsg(
        showEnglish ? "Network error. Check your connection." : "Netzwerkfehler. Verbindung prüfen."
      );
    } finally {
      setLoadingCard(false);
    }
  }

  function clearAll() {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setCard(null);
    setMatchedKeywords([]);
    setExpandedId(null);
    setErrorMsg("");
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {showEnglish ? "Card Search" : "Karte suchen"}
          </Text>
          <LanguageToggle showEnglish={showEnglish} onToggle={() => setShowEnglish(!showEnglish)} />
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {showEnglish
            ? "Type a card name to look up its keywords"
            : "Kartennamen eingeben — Schlüsselwörter werden automatisch erklärt"}
        </Text>

        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              if (card) {
                setCard(null);
                setMatchedKeywords([]);
                setErrorMsg("");
              }
            }}
            placeholder={showEnglish ? "e.g. Lightning Bolt..." : "z.B. Blitzschlag..."}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={() => {
              if (suggestions.length > 0) selectCard(suggestions[0]);
              else if (query.trim().length > 1) selectCard(query.trim());
            }}
          />
          {loadingSuggestions && <ActivityIndicator size="small" color={colors.primary} />}
          {query.length > 0 && !loadingSuggestions && (
            <TouchableOpacity onPress={clearAll}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {suggestions.map((s, i) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.suggestion,
                  i < suggestions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
                onPress={() => selectCard(s)}
              >
                <Ionicons name="card-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.suggestionText, { color: colors.foreground }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loadingCard && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              {showEnglish ? "Loading card data..." : "Kartendaten werden geladen..."}
            </Text>
          </View>
        )}

        {errorMsg.length > 0 && !loadingCard && (
          <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={28} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
          </View>
        )}

        {card && !loadingCard && (
          <View style={styles.content}>
            <View style={[styles.cardInfoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardInfoTop}>
                <View style={styles.cardInfoLeft}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{card.name}</Text>
                  {card.type_line ? (
                    <Text style={[styles.cardType, { color: colors.mutedForeground }]}>{card.type_line}</Text>
                  ) : null}
                  <View style={styles.cardMeta}>
                    {card.mana_cost ? (
                      <View style={[styles.metaBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.metaBadgeText, { color: colors.secondaryForeground }]}>
                          {card.mana_cost}
                        </Text>
                      </View>
                    ) : null}
                    {card.power && card.toughness ? (
                      <View style={[styles.metaBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.metaBadgeText, { color: colors.secondaryForeground }]}>
                          {card.power}/{card.toughness}
                        </Text>
                      </View>
                    ) : null}
                    {card.set_name ? (
                      <View style={[styles.metaBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.metaBadgeText, { color: colors.secondaryForeground }]}>
                          {card.set_name}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                {card.image_uris?.normal && (
                  <Image
                    source={{ uri: card.image_uris.normal }}
                    style={styles.cardThumb}
                    resizeMode="contain"
                  />
                )}
              </View>

              {card.oracle_text ? (
                <View style={[styles.oracleBox, { borderTopColor: colors.border }]}>
                  <Text style={[styles.oracleLabel, { color: colors.mutedForeground }]}>
                    {showEnglish ? "Oracle Text" : "Kartentext"}
                  </Text>
                  <Text style={[styles.oracleText, { color: colors.cardForeground }]}>
                    {card.oracle_text}
                  </Text>
                </View>
              ) : null}
            </View>

            {matchedKeywords.length > 0 ? (
              <View style={styles.kwSection}>
                <Text style={[styles.kwTitle, { color: colors.foreground }]}>
                  {showEnglish
                    ? `${matchedKeywords.length} keyword(s) explained`
                    : `${matchedKeywords.length} Schlüsselwort/e erklärt`}
                </Text>
                {matchedKeywords.map((kw) => (
                  <KeywordCard
                    key={kw.id}
                    keyword={kw}
                    showEnglish={showEnglish}
                    expanded={expandedId === kw.id}
                    onPress={() => setExpandedId((p) => (p === kw.id ? null : kw.id))}
                  />
                ))}
              </View>
            ) : (
              <View style={[styles.noKwBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={26} color={colors.mutedForeground} />
                <Text style={[styles.noKwText, { color: colors.mutedForeground }]}>
                  {showEnglish
                    ? "No keywords from our database found on this card."
                    : "Keine Schlüsselwörter aus der Datenbank auf dieser Karte."}
                </Text>
                {(card.keywords?.length ?? 0) > 0 && (
                  <Text style={[styles.noKwSub, { color: colors.mutedForeground }]}>
                    {showEnglish ? "Scryfall keywords: " : "Scryfall: "}
                    {card.keywords?.join(", ")}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {!card && !loadingCard && !errorMsg && query.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {showEnglish ? "Search for a card" : "Karte suchen"}
            </Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              {showEnglish
                ? "Start typing any card name — suggestions will appear automatically"
                : "Fang an zu tippen — Vorschläge erscheinen automatisch"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
    lineHeight: 18,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    padding: 0,
  },
  dropdown: {
    position: "absolute",
    left: 16,
    right: 16,
    top: "100%",
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    zIndex: 100,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  suggestionText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  scroll: {
    padding: 16,
    flexGrow: 1,
  },
  loadingBox: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  content: { gap: 14 },
  cardInfoBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardInfoTop: {
    flexDirection: "row",
    padding: 14,
    gap: 12,
  },
  cardInfoLeft: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  cardType: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  metaBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  cardThumb: {
    width: 82,
    height: 114,
    borderRadius: 6,
  },
  oracleBox: {
    borderTopWidth: 1,
    padding: 14,
    gap: 4,
  },
  oracleLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  oracleText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    fontStyle: "italic",
  },
  kwSection: { gap: 4 },
  kwTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  noKwBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  noKwText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  noKwSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    fontStyle: "italic",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  emptyHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
