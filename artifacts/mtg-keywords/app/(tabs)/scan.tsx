import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
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
import { type CompactCard, useCardHistory } from "@/context/CardHistoryContext";
import { useSettings } from "@/context/SettingsContext";
import { MTG_KEYWORDS, type MtgKeyword } from "@/data/keywords";
import { useColors } from "@/hooks/useColors";

type CardData = {
  id: string;
  name: string;
  printed_name?: string;
  keywords: string[];
  oracle_text?: string;
  printed_text?: string;
  type_line?: string;
  printed_type_line?: string;
  mana_cost?: string;
  power?: string;
  toughness?: string;
  set_name?: string;
  image_uris?: { normal?: string; small?: string };
  card_faces?: Array<{
    image_uris?: { normal?: string; small?: string };
    oracle_text?: string;
    printed_text?: string;
  }>;
  legalities?: Record<string, string>;
};

type SimilarCard = {
  id: string;
  name: string;
  printed_name?: string;
  imageUri?: string;
};

type Suggestion = {
  display: string;
  resolveByName?: string;
  resolveById?: string;
  prefetchedCard?: CardData;
};

const KEY_FORMATS = [
  { key: "standard", label: "Standard" },
  { key: "pioneer", label: "Pioneer" },
  { key: "modern", label: "Modern" },
  { key: "legacy", label: "Legacy" },
  { key: "commander", label: "Commander" },
];

function legalityColor(value: string): string {
  if (value === "legal") return "#16a34a";
  if (value === "banned") return "#dc2626";
  if (value === "restricted") return "#d97706";
  return "#6b7280";
}

function matchLocalKeywords(scryfallKeywords: string[], oracleText: string): MtgKeyword[] {
  const found = new Map<string, MtgKeyword>();
  for (const kw of MTG_KEYWORDS) {
    const enLower = kw.nameEn.toLowerCase();
    const deLower = kw.name.toLowerCase();
    for (const sk of scryfallKeywords) {
      if (sk.toLowerCase() === enLower || sk.toLowerCase() === deLower) found.set(kw.id, kw);
    }
    const oracle = oracleText.toLowerCase();
    if (oracle.includes(enLower) || oracle.includes(deLower)) found.set(kw.id, kw);
  }
  return Array.from(found.values());
}

function getApiBase(): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  return domain ? `https://${domain}` : "";
}

const HEADERS = { "User-Agent": "MtGKeywordsApp/1.0" };

async function fetchAutocompleteSuggestions(query: string): Promise<Suggestion[]> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}&include_extras=false`,
      { headers: HEADERS }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data: string[] };
    return data.data.slice(0, 8).map((name) => ({ display: name, resolveByName: name }));
  } catch {
    return [];
  }
}

async function fetchGermanSuggestions(query: string): Promise<Suggestion[]> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=lang%3Ade+${encodeURIComponent(query)}&order=name&unique=names`,
      { headers: HEADERS }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data: CardData[] };
    return data.data
      .filter((c) => c.printed_name)
      .slice(0, 8)
      .map((c) => ({ display: c.printed_name!, resolveById: c.id, prefetchedCard: c }));
  } catch {
    return [];
  }
}

function mergeSuggestions(en: Suggestion[], de: Suggestion[]): Suggestion[] {
  const seen = new Set<string>();
  const result: Suggestion[] = [];
  for (const s of [...de, ...en]) {
    const key = s.display.toLowerCase();
    if (!seen.has(key)) { seen.add(key); result.push(s); }
  }
  return result.slice(0, 12);
}

async function fetchCardById(id: string): Promise<CardData | null> {
  try {
    const res = await fetch(`https://api.scryfall.com/cards/${id}`, { headers: HEADERS });
    return res.ok ? ((await res.json()) as CardData) : null;
  } catch { return null; }
}

async function fetchCardByName(name: string): Promise<CardData | null> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
      { headers: HEADERS }
    );
    return res.ok ? ((await res.json()) as CardData) : null;
  } catch { return null; }
}

async function fetchSimilarCards(keywords: string[], excludeName: string): Promise<SimilarCard[]> {
  if (keywords.length === 0) return [];
  try {
    const kwQuery = keywords
      .slice(0, 2)
      .map((k) => `keyword:"${k}"`)
      .join("+OR+");
    const q = `(${kwQuery})+-!"${excludeName}"&order=edhrec&unique=cards`;
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q).replace(/%2B/g, "+")}`,
      { headers: HEADERS }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data: CardData[] };
    return data.data.slice(0, 6).map((c) => ({
      id: c.id,
      name: c.name,
      printed_name: c.printed_name,
      imageUri: c.image_uris?.normal ?? c.card_faces?.[0]?.image_uris?.normal,
    }));
  } catch { return []; }
}

export default function CardSearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();
  const { recentCards, favorites, addToRecent, toggleFavorite, isFavorite, clearRecent } =
    useCardHistory();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [card, setCard] = useState<CardData | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [matchedKeywords, setMatchedKeywords] = useState<MtgKeyword[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [playTip, setPlayTip] = useState("");
  const [loadingTip, setLoadingTip] = useState(false);
  const [similarCards, setSimilarCards] = useState<SimilarCard[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

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
      const [en, de] = await Promise.all([
        fetchAutocompleteSuggestions(trimmed),
        fetchGermanSuggestions(trimmed),
      ]);
      setSuggestions(mergeSuggestions(en, de));
      setShowSuggestions(true);
      setLoadingSuggestions(false);
    }, 300);
  }, [query]);

  async function applyCard(data: CardData) {
    setCard(data);
    const oracleText =
      data.oracle_text ?? data.card_faces?.map((f) => f.oracle_text).join(" ") ?? "";
    const matched = matchLocalKeywords(data.keywords ?? [], oracleText);
    setMatchedKeywords(matched);

    const compact: CompactCard = {
      id: data.id,
      name: data.name,
      printed_name: data.printed_name,
      type_line: data.type_line,
      printed_type_line: data.printed_type_line,
      mana_cost: data.mana_cost,
      set_name: data.set_name,
      imageUri: data.image_uris?.normal ?? data.card_faces?.[0]?.image_uris?.normal,
    };
    addToRecent(compact);

    setPlayTip("");
    setLoadingTip(true);
    setSimilarCards([]);
    setLoadingSimilar(true);

    const [tipRes, similar] = await Promise.all([
      fetch(`${getApiBase()}/api/card-tips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardName: data.name,
          typeLine: data.type_line,
          oracleText,
          keywords: data.keywords ?? [],
          manaCost: data.mana_cost,
          power: data.power,
          toughness: data.toughness,
        }),
      }).then(async (r) => {
        if (r.ok) {
          const j = (await r.json()) as { tip: string };
          return j.tip ?? "";
        }
        return "";
      }).catch(() => ""),
      fetchSimilarCards(data.keywords ?? [], data.name),
    ]);

    setPlayTip(tipRes);
    setLoadingTip(false);
    setSimilarCards(similar);
    setLoadingSimilar(false);
  }

  async function selectSuggestion(s: Suggestion) {
    setQuery(s.display);
    setSuggestions([]);
    setShowSuggestions(false);
    setCard(null);
    setMatchedKeywords([]);
    setExpandedId(null);
    setErrorMsg("");
    setPlayTip("");
    setSimilarCards([]);
    setLoadingCard(true);

    let data: CardData | null = null;
    if (s.prefetchedCard) data = s.prefetchedCard;
    else if (s.resolveById) data = await fetchCardById(s.resolveById);
    else if (s.resolveByName) data = await fetchCardByName(s.resolveByName);

    if (!data) {
      setErrorMsg(showEnglish ? `Card "${s.display}" not found.` : `Karte "${s.display}" nicht gefunden.`);
    } else {
      await applyCard(data);
    }
    setLoadingCard(false);
  }

  async function selectCompact(c: CompactCard) {
    setQuery(c.printed_name ?? c.name);
    setCard(null);
    setMatchedKeywords([]);
    setExpandedId(null);
    setErrorMsg("");
    setPlayTip("");
    setSimilarCards([]);
    setLoadingCard(true);
    const data = await fetchCardById(c.id);
    if (!data) {
      setErrorMsg(showEnglish ? "Card not found." : "Karte nicht gefunden.");
    } else {
      await applyCard(data);
    }
    setLoadingCard(false);
  }

  async function submitQuery() {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (suggestions.length > 0) { await selectSuggestion(suggestions[0]); return; }
    setSuggestions([]);
    setShowSuggestions(false);
    setCard(null);
    setMatchedKeywords([]);
    setExpandedId(null);
    setErrorMsg("");
    setPlayTip("");
    setSimilarCards([]);
    setLoadingCard(true);
    const data = await fetchCardByName(trimmed);
    if (!data) setErrorMsg(showEnglish ? `Card "${trimmed}" not found.` : `Karte "${trimmed}" nicht gefunden.`);
    else await applyCard(data);
    setLoadingCard(false);
  }

  function clearAll() {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setCard(null);
    setMatchedKeywords([]);
    setExpandedId(null);
    setErrorMsg("");
    setPlayTip("");
    setLoadingTip(false);
    setSimilarCards([]);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  const displayName = card?.printed_name ?? card?.name ?? "";
  const displayTypeLine = card?.printed_type_line ?? card?.type_line ?? "";
  const displayOracleText =
    card?.printed_text ??
    card?.card_faces?.map((f) => f.printed_text ?? f.oracle_text).join("\n—\n") ??
    card?.oracle_text ?? "";
  const cardImageUri = card?.image_uris?.normal ?? card?.card_faces?.[0]?.image_uris?.normal;
  const scryfallUrl = card ? `https://scryfall.com/search?q=!${encodeURIComponent(card.name)}` : "";

  const showEmpty = !card && !loadingCard && !errorMsg && query.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Fixed header + search */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {showEnglish ? "Card Search" : "Karte suchen"}
          </Text>
          <LanguageToggle showEnglish={showEnglish} onToggle={() => setShowEnglish(!showEnglish)} />
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {showEnglish ? "Search by English or German card name" : "Deutschen oder englischen Kartennamen eingeben"}
        </Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={(t) => { setQuery(t); if (card) { setCard(null); setMatchedKeywords([]); setErrorMsg(""); } }}
            placeholder={showEnglish ? "e.g. Lightning Bolt or Blitzschlag…" : "z.B. Blitzschlag oder Lightning Bolt…"}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={submitQuery}
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
                key={`${s.display}-${i}`}
                style={[styles.suggestion, i < suggestions.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                onPress={() => selectSuggestion(s)}
              >
                <Ionicons name="card-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.suggestionText, { color: colors.foreground }]} numberOfLines={1}>{s.display}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* Loading */}
        {loadingCard && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              {showEnglish ? "Loading card data…" : "Kartendaten werden geladen…"}
            </Text>
          </View>
        )}

        {/* Error */}
        {errorMsg.length > 0 && !loadingCard && (
          <View style={[styles.errorBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="alert-circle-outline" size={28} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
          </View>
        )}

        {/* Card result */}
        {card && !loadingCard && (
          <View style={styles.content}>
            {/* Card info */}
            <View style={[styles.cardInfoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardInfoTop}>
                <View style={styles.cardInfoLeft}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={2}>{displayName}</Text>
                    <TouchableOpacity onPress={() => toggleFavorite({
                      id: card.id, name: card.name, printed_name: card.printed_name,
                      type_line: card.type_line, printed_type_line: card.printed_type_line,
                      mana_cost: card.mana_cost, set_name: card.set_name, imageUri: cardImageUri,
                    })}>
                      <Ionicons
                        name={isFavorite(card.id) ? "star" : "star-outline"}
                        size={22}
                        color={isFavorite(card.id) ? "#f59e0b" : colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  </View>
                  {card.printed_name && card.name !== card.printed_name && (
                    <Text style={[styles.cardEnName, { color: colors.mutedForeground }]}>{card.name}</Text>
                  )}
                  {displayTypeLine ? (
                    <Text style={[styles.cardType, { color: colors.mutedForeground }]}>{displayTypeLine}</Text>
                  ) : null}
                  <View style={styles.cardMeta}>
                    {card.mana_cost ? (
                      <View style={[styles.metaBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.metaBadgeText, { color: colors.secondaryForeground }]}>{card.mana_cost}</Text>
                      </View>
                    ) : null}
                    {card.power && card.toughness ? (
                      <View style={[styles.metaBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.metaBadgeText, { color: colors.secondaryForeground }]}>{card.power}/{card.toughness}</Text>
                      </View>
                    ) : null}
                    {card.set_name ? (
                      <View style={[styles.metaBadge, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.metaBadgeText, { color: colors.secondaryForeground }]}>{card.set_name}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                {cardImageUri && (
                  <Image source={{ uri: cardImageUri }} style={styles.cardThumb} resizeMode="contain" />
                )}
              </View>

              {/* Format legality */}
              {card.legalities && (
                <View style={[styles.legalityRow, { borderTopColor: colors.border }]}>
                  {KEY_FORMATS.map((f) => {
                    const val = card.legalities?.[f.key] ?? "not_legal";
                    const col = legalityColor(val);
                    const isLegal = val === "legal";
                    return (
                      <View key={f.key} style={[styles.legalBadge, { borderColor: col, backgroundColor: isLegal ? col + "22" : "transparent" }]}>
                        <Text style={[styles.legalBadgeText, { color: isLegal ? col : colors.mutedForeground }]}>{f.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Oracle text */}
              {displayOracleText ? (
                <View style={[styles.oracleBox, { borderTopColor: colors.border }]}>
                  <Text style={[styles.oracleLabel, { color: colors.mutedForeground }]}>
                    {showEnglish ? "Card Text" : "Kartentext"}
                  </Text>
                  <Text style={[styles.oracleText, { color: colors.cardForeground }]}>{displayOracleText}</Text>
                </View>
              ) : null}

              {/* Scryfall link */}
              <TouchableOpacity
                style={[styles.scryfallRow, { borderTopColor: colors.border }]}
                onPress={() => Linking.openURL(scryfallUrl)}
              >
                <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.scryfallText, { color: colors.mutedForeground }]}>
                  {showEnglish ? "View on Scryfall (prices, editions, rulings)" : "Auf Scryfall ansehen (Preise, Editionen, Regeln)"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Keywords */}
            {matchedKeywords.length > 0 ? (
              <View style={styles.kwSection}>
                <Text style={[styles.kwTitle, { color: colors.foreground }]}>
                  {showEnglish ? `${matchedKeywords.length} keyword(s) explained` : `${matchedKeywords.length} Schlüsselwort/e erklärt`}
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
                  {showEnglish ? "No keywords from our database found on this card." : "Keine Schlüsselwörter aus der Datenbank auf dieser Karte."}
                </Text>
              </View>
            )}

            {/* Spieltipp */}
            {(loadingTip || playTip.length > 0) && (
              <View style={[styles.tipBox, { backgroundColor: colors.card, borderColor: colors.primary }]}>
                <View style={styles.tipHeader}>
                  <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                  <Text style={[styles.tipLabel, { color: colors.primary }]}>
                    {showEnglish ? "When to play this card" : "Wann diese Karte spielen?"}
                  </Text>
                </View>
                {loadingTip ? (
                  <View style={styles.tipLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.tipLoadingText, { color: colors.mutedForeground }]}>
                      {showEnglish ? "Generating tip…" : "Tipp wird erstellt…"}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.tipText, { color: colors.cardForeground }]}>{playTip}</Text>
                )}
              </View>
            )}

            {/* Ähnliche Karten */}
            {(loadingSimilar || similarCards.length > 0) && (
              <View style={styles.similarSection}>
                <Text style={[styles.kwTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Similar Cards" : "Ähnliche Karten"}
                </Text>
                {loadingSimilar ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: "flex-start" }} />
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll} contentContainerStyle={styles.similarContent}>
                    {similarCards.map((sc) => (
                      <TouchableOpacity
                        key={sc.id}
                        style={styles.similarCard}
                        onPress={() => selectCompact({ id: sc.id, name: sc.name, printed_name: sc.printed_name, imageUri: sc.imageUri })}
                      >
                        {sc.imageUri ? (
                          <Image source={{ uri: sc.imageUri }} style={styles.similarImage} resizeMode="contain" />
                        ) : (
                          <View style={[styles.similarImagePlaceholder, { backgroundColor: colors.card }]}>
                            <Ionicons name="card-outline" size={24} color={colors.mutedForeground} />
                          </View>
                        )}
                        <Text style={[styles.similarName, { color: colors.foreground }]} numberOfLines={2}>
                          {sc.printed_name ?? sc.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        )}

        {/* Empty state: Favoriten + Zuletzt gesucht */}
        {showEmpty && (
          <View style={styles.emptyContent}>
            {favorites.length > 0 && (
              <View style={styles.historySection}>
                <Text style={[styles.historySectionTitle, { color: colors.foreground }]}>
                  <Ionicons name="star" size={14} color="#f59e0b" /> {showEnglish ? " Favorites" : " Favoriten"}
                </Text>
                <View style={styles.historyGrid}>
                  {favorites.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => selectCompact(c)}
                    >
                      {c.imageUri && <Image source={{ uri: c.imageUri }} style={styles.historyImage} resizeMode="contain" />}
                      <Text style={[styles.historyName, { color: colors.foreground }]} numberOfLines={2}>
                        {c.printed_name ?? c.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {recentCards.length > 0 && (
              <View style={styles.historySection}>
                <View style={styles.historySectionRow}>
                  <Text style={[styles.historySectionTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Recently Searched" : "Zuletzt gesucht"}
                  </Text>
                  <TouchableOpacity onPress={clearRecent}>
                    <Text style={[styles.clearText, { color: colors.mutedForeground }]}>
                      {showEnglish ? "Clear" : "Löschen"}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.recentList}>
                  {recentCards.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.recentRow, { borderBottomColor: colors.border }]}
                      onPress={() => selectCompact(c)}
                    >
                      {c.imageUri && <Image source={{ uri: c.imageUri }} style={styles.recentThumb} resizeMode="contain" />}
                      <View style={styles.recentInfo}>
                        <Text style={[styles.recentName, { color: colors.foreground }]} numberOfLines={1}>
                          {c.printed_name ?? c.name}
                        </Text>
                        {c.printed_name && c.printed_name !== c.name && (
                          <Text style={[styles.recentSub, { color: colors.mutedForeground }]} numberOfLines={1}>{c.name}</Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {favorites.length === 0 && recentCards.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.mutedForeground} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Search for a card" : "Karte suchen"}
                </Text>
                <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
                  {showEnglish ? "Works with English and German card names" : "Funktioniert mit deutschen und englischen Kartennamen"}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, zIndex: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10, lineHeight: 18 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  dropdown: {
    position: "absolute", left: 16, right: 16, top: "100%",
    borderRadius: 12, borderWidth: 1, marginTop: 4, zIndex: 100, overflow: "hidden",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 8 },
    }),
  },
  suggestion: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  suggestionText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  scroll: { padding: 16, flexGrow: 1 },
  loadingBox: { alignItems: "center", paddingTop: 60, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  errorBox: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8, marginTop: 20 },
  errorText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  content: { gap: 14 },
  cardInfoBox: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardInfoTop: { flexDirection: "row", padding: 14, gap: 12 },
  cardInfoLeft: { flex: 1, gap: 4 },
  nameRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  cardName: { fontSize: 20, fontFamily: "Inter_700Bold", flex: 1 },
  cardEnName: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  cardType: { fontSize: 13, fontFamily: "Inter_400Regular" },
  cardMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  metaBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  metaBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  cardThumb: { width: 82, height: 114, borderRadius: 6 },
  legalityRow: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  legalBadge: { borderRadius: 6, borderWidth: 1.5, paddingHorizontal: 8, paddingVertical: 3 },
  legalBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  oracleBox: { borderTopWidth: 1, padding: 14, gap: 4 },
  oracleLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  oracleText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, fontStyle: "italic" },
  scryfallRow: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  scryfallText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  kwSection: { gap: 4 },
  kwTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  noKwBox: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  noKwText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  tipBox: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 8 },
  tipHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  tipLabel: { fontSize: 13, fontFamily: "Inter_700Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  tipLoading: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  tipLoadingText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  tipText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  similarSection: { gap: 8 },
  similarScroll: { marginHorizontal: -4 },
  similarContent: { paddingHorizontal: 4, gap: 10 },
  similarCard: { width: 90, alignItems: "center", gap: 4 },
  similarImage: { width: 90, height: 126, borderRadius: 6 },
  similarImagePlaceholder: { width: 90, height: 126, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  similarName: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },
  emptyContent: { gap: 20 },
  historySection: { gap: 10 },
  historySectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historySectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  clearText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  historyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  historyCard: { width: 90, borderRadius: 10, borderWidth: 1, padding: 6, alignItems: "center", gap: 4 },
  historyImage: { width: 78, height: 109, borderRadius: 4 },
  historyName: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },
  recentList: { borderRadius: 12, overflow: "hidden" },
  recentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  recentThumb: { width: 36, height: 50, borderRadius: 4 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  recentSub: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyHint: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
