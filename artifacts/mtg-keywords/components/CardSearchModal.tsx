import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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

import { AnimatedCard } from "@/components/AnimatedCard";
import { type Deck, useDecks } from "@/context/DeckContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { calculateCardScore, scoreColor, scoreLabel } from "@/utils/cardScore";
import { MTG_KEYWORDS } from "@/data/keywords";

// ─── Types ───────────────────────────────────────────────────────────────────

type CardData = {
  id: string;
  name: string;
  printed_name?: string;
  keywords: string[];
  oracle_text?: string;
  printed_text?: string;
  flavor_text?: string;
  type_line?: string;
  printed_type_line?: string;
  mana_cost?: string;
  cmc?: number;
  colors?: string[];
  color_identity?: string[];
  power?: string;
  toughness?: string;
  set_name?: string;
  rarity?: string;
  image_uris?: { normal?: string; small?: string; art_crop?: string };
  card_faces?: Array<{
    image_uris?: { normal?: string; small?: string; art_crop?: string };
    oracle_text?: string;
    printed_text?: string;
  }>;
  legalities?: Record<string, string>;
  scryfall_uri?: string;
  prices?: { eur?: string | null; usd?: string | null };
  edhrec_rank?: number;
};

type Suggestion = {
  display: string;
  resolveByName?: string;
  resolveById?: string;
  prefetchedCard?: CardData;
};

// ─── Scryfall API ─────────────────────────────────────────────────────────────

const HEADERS = { Accept: "application/json;q=0.9,*/*;q=0.8" };

async function fetchAutocompleteSuggestions(query: string): Promise<Suggestion[]> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/autocomplete?q=${encodeURIComponent(query)}&include_extras=false`,
      { headers: HEADERS }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data: string[] };
    return data.data.slice(0, 8).map((name) => ({ display: name, resolveByName: name }));
  } catch { return []; }
}

async function fetchGermanSuggestions(query: string): Promise<Suggestion[]> {
  try {
    const primaryQuery = query.split(/\s*\/+\s*/)[0].trim();
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=lang%3Ade+${encodeURIComponent(primaryQuery)}&order=name&unique=names`,
      { headers: HEADERS }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data: CardData[] };
    const results: Suggestion[] = [];
    const seen = new Set<string>();
    for (const c of data.data) {
      if (!c.printed_name) continue;
      const key = c.printed_name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ display: c.printed_name, resolveById: c.id, prefetchedCard: c });
      if (results.length >= 8) break;
    }
    return results;
  } catch { return []; }
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

async function overlayGermanData(card: CardData): Promise<CardData> {
  try {
    const searchName = card.name.split(" // ")[0].trim();
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`!"${searchName}" lang:de`)}&unique=prints&order=released`,
      { headers: HEADERS }
    );
    if (!res.ok) return card;
    const data = (await res.json()) as { data?: CardData[] };
    const de = data.data?.[0];
    if (!de) return card;
    return {
      ...card,
      printed_name: de.printed_name ?? card.printed_name,
      printed_text: de.printed_text ?? card.printed_text,
      printed_type_line: de.printed_type_line ?? card.printed_type_line,
      image_uris: de.image_uris ?? card.image_uris,
      card_faces: card.card_faces?.map((face, idx) => ({
        ...face,
        image_uris: de.card_faces?.[idx]?.image_uris ?? face.image_uris,
      })),
    };
  } catch { return card; }
}

async function fetchCardByName(name: string): Promise<CardData | null> {
  try {
    const primaryName = name.split(/\s*\/+\s*/)[0].trim();
    const res = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(primaryName)}`,
      { headers: HEADERS }
    );
    if (res.ok) return (await res.json()) as CardData;
    return null;
  } catch { return null; }
}

// ─── Rarity ──────────────────────────────────────────────────────────────────

const RARITY_LABEL: Record<string, { en: string; de: string; color: string }> = {
  common:   { en: "Common",   de: "Gewöhnlich",  color: "#9e9e9e" },
  uncommon: { en: "Uncommon", de: "Ungewöhnlich", color: "#607d8b" },
  rare:     { en: "Rare",     de: "Selten",       color: "#f59e0b" },
  mythic:   { en: "Mythic",   de: "Mythisch",     color: "#ef4444" },
  special:  { en: "Special",  de: "Speziell",     color: "#7c3aed" },
  bonus:    { en: "Bonus",    de: "Bonus",        color: "#7c3aed" },
};

const FORMAT_LABELS: Record<string, { de: string; en: string }> = {
  standard:  { de: "Standard",  en: "Standard" },
  pioneer:   { de: "Pioneer",   en: "Pioneer" },
  modern:    { de: "Modern",    en: "Modern" },
  legacy:    { de: "Legacy",    en: "Legacy" },
  vintage:   { de: "Vintage",   en: "Vintage" },
  commander: { de: "Commander", en: "Commander" },
  pauper:    { de: "Pauper",    en: "Pauper" },
  brawl:     { de: "Brawl",     en: "Brawl" },
};

const SHOWN_FORMATS = ["standard", "pioneer", "modern", "legacy", "commander"];

// ─── Props ───────────────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  onClose: () => void;
};

// ─── Component ───────────────────────────────────────────────────────────────

export function CardSearchModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();
  const { decks, addCardToDeck } = useDecks();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [cardEn, setCardEn] = useState<CardData | null>(null);
  const [cardDe, setCardDe] = useState<CardData | null>(null);
  const [cardLocalEn, setCardLocalEn] = useState(true);
  const [loadingCard, setLoadingCard] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const [addedToDeck, setAddedToDeck] = useState<string | null>(null);
  const [expandedFormat, setExpandedFormat] = useState(false);
  const [expandedKeywords, setExpandedKeywords] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      // reset when closed
      setQuery("");
      setSuggestions([]);
      setCardEn(null);
      setCardDe(null);
      setErrorMsg("");
      setLoadingCard(false);
      setExpandedFormat(false);
      setExpandedKeywords(false);
      setShowDeckPicker(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setLoadingSuggestions(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      const [en, de] = await Promise.all([
        fetchAutocompleteSuggestions(query),
        fetchGermanSuggestions(query),
      ]);
      setSuggestions(mergeSuggestions(en, de));
      setLoadingSuggestions(false);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function applyCards(en: CardData, de?: CardData | null) {
    setCardEn(en);
    setCardLocalEn(true);
    if (de) {
      setCardDe(de);
    } else {
      const withDe = await overlayGermanData(en);
      setCardDe(withDe !== en ? withDe : null);
    }
  }

  async function selectSuggestion(s: Suggestion) {
    setSuggestions([]);
    setErrorMsg("");
    setCardEn(null); setCardDe(null);
    setLoadingCard(true);
    if (s.prefetchedCard) {
      const deCard = s.prefetchedCard;
      setQuery(deCard.printed_name ?? deCard.name);
      const enCard = await fetchCardByName(deCard.name);
      setLoadingCard(false);
      if (!enCard) setErrorMsg(showEnglish ? `"${s.display}" not found.` : `„${s.display}" nicht gefunden.`);
      else applyCards(enCard, deCard);
    } else {
      const data = s.resolveById ? await fetchCardById(s.resolveById)
        : s.resolveByName ? await fetchCardByName(s.resolveByName) : null;
      setLoadingCard(false);
      if (!data) setErrorMsg(showEnglish ? `"${s.display}" not found.` : `„${s.display}" nicht gefunden.`);
      else applyCards(data);
      if (data) setQuery(s.display);
    }
  }

  async function submitQuery() {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (suggestions.length > 0) { await selectSuggestion(suggestions[0]); return; }
    setSuggestions([]);
    setCardEn(null); setCardDe(null); setErrorMsg("");
    setLoadingCard(true);
    const data = await fetchCardByName(trimmed);
    setLoadingCard(false);
    if (!data) setErrorMsg(showEnglish ? `"${trimmed}" not found.` : `„${trimmed}" nicht gefunden.`);
    else applyCards(data);
  }

  const card = cardEn;
  const activeCard = (cardLocalEn || !cardDe) ? cardEn : cardDe;
  const hasDeTranslation = !!(cardDe?.printed_name && cardDe.printed_name !== cardEn?.name);
  const displayName = activeCard?.printed_name ?? activeCard?.name ?? "";
  const displayType = activeCard?.printed_type_line ?? activeCard?.type_line ?? "";
  const displayOracle = activeCard?.printed_text ?? activeCard?.card_faces?.map((f) => f.printed_text ?? f.oracle_text).join("\n—\n") ?? activeCard?.oracle_text ?? "";
  const cardImageUri = activeCard?.image_uris?.normal ?? activeCard?.card_faces?.[0]?.image_uris?.normal;
  const cardArtUri = activeCard?.image_uris?.art_crop ?? activeCard?.card_faces?.[0]?.image_uris?.art_crop ?? cardImageUri;
  const rarity = card?.rarity ? (RARITY_LABEL[card.rarity] ?? null) : null;
  const eurPrice = card?.prices?.eur ? `€ ${parseFloat(card.prices.eur).toFixed(2)}` : null;
  const showDropdown = inputFocused && suggestions.length > 0;

  // Which decks already have this card
  const decksWithCard = card
    ? decks.filter((d) => d.cards.some((c) => c.id === card.id || c.name.toLowerCase() === card.name.toLowerCase()))
    : [];

  const matchedKeywords = card
    ? MTG_KEYWORDS.filter((kw) =>
        card.keywords?.some((k) => k.toLowerCase() === kw.nameEn.toLowerCase() || k.toLowerCase() === kw.name.toLowerCase()) ||
        (kw.matchPattern
          ? new RegExp(kw.matchPattern, "i").test(card.oracle_text ?? "")
          : (card.oracle_text ?? "").toLowerCase().includes(kw.nameEn.toLowerCase()))
      ).slice(0, 6)
    : [];

  function handleAddToDeck(deck: Deck) {
    if (!card) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    addCardToDeck(deck.id, {
      id: card.id,
      name: card.name,
      printed_name: card.printed_name,
      mana_cost: card.mana_cost,
      cmc: card.cmc,
      type_line: card.type_line,
      oracle_text: card.oracle_text,
      keywords: card.keywords,
      imageUri: cardImageUri,
    });
    setAddedToDeck(deck.name);
    setShowDeckPicker(false);
    setTimeout(() => setAddedToDeck(null), 2500);
  }

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={[styles.root, { backgroundColor: colors.background }]}>

        {/* Backdrop for dropdown */}
        {showDropdown && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => { setInputFocused(false); setSuggestions([]); }}
            style={[StyleSheet.absoluteFillObject, { zIndex: 9 }]}
          />
        )}

        {/* Header */}
        <View style={[styles.header, { paddingTop: (Platform.OS === "web" ? 12 : insets.top) + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {showEnglish ? "Card Search" : "Karte suchen"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Search bar */}
          <View style={{ position: "relative", zIndex: 100 }}>
            <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.primary + "80" }]}>
              <Ionicons name="search" size={18} color={colors.primary} />
              <TextInput
                value={query}
                onChangeText={(t) => { setQuery(t); if (card) { setCardEn(null); setCardDe(null); setErrorMsg(""); } }}
                placeholder={showEnglish ? "e.g. Lightning Bolt or Blitzschlag…" : "z.B. Blitzschlag oder Lightning Bolt…"}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground }]}
                autoCorrect={false} autoCapitalize="words"
                returnKeyType="search" onSubmitEditing={submitQuery}
                onFocus={() => { setInputFocused(true); }}
                onBlur={() => setTimeout(() => setInputFocused(false), 200)}
                autoFocus
              />
              {loadingSuggestions && <ActivityIndicator size="small" color={colors.primary} />}
              {query.length > 0 && !loadingSuggestions && (
                <TouchableOpacity onPress={() => { setQuery(""); setSuggestions([]); setCardEn(null); setCardDe(null); setErrorMsg(""); }}>
                  <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>

            {/* Dropdown */}
            {showDropdown && (
              <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {suggestions.map((s, i) => (
                  <TouchableOpacity
                    key={`${s.display}-${i}`}
                    style={[styles.suggestion, i < suggestions.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
                    onPress={() => selectSuggestion(s)}
                  >
                    <Ionicons name="card-outline" size={14} color={colors.mutedForeground} />
                    <Text style={[styles.suggestionText, { color: colors.foreground }]} numberOfLines={1}>{s.display}</Text>
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

          {/* Empty state */}
          {!card && !loadingCard && !errorMsg && (
            <View style={styles.emptyBox}>
              <Ionicons name="search" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {showEnglish ? "Search your collection" : "Sammlung durchsuchen"}
              </Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? "Type a card name (DE or EN) to check if it's in any of your decks."
                  : "Kartennamen eingeben (DE oder EN) um zu sehen, ob du sie schon in einem Deck hast."}
              </Text>
            </View>
          )}

          {/* Card result */}
          {card && !loadingCard && (
            <View style={styles.content}>

              {/* ── IN DEINEN DECKS (prominent, at top) ── */}
              {decksWithCard.length > 0 ? (
                <View style={[styles.deckBanner, { backgroundColor: "#16a34a18", borderColor: "#16a34a66" }]}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: "#16a34a" }}>
                      {showEnglish ? "Already in your decks:" : "Bereits in deinen Decks:"}
                    </Text>
                    {decksWithCard.map((d) => {
                      const entry = d.cards.find((c) => c.id === card.id || c.name.toLowerCase() === card.name.toLowerCase());
                      return (
                        <Text key={d.id} style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: "#16a34a", marginTop: 2 }}>
                          • {d.name}{entry ? ` (${entry.count}×)` : ""}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              ) : (
                <View style={[styles.deckBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="albums-outline" size={18} color={colors.mutedForeground} />
                  <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.mutedForeground, flex: 1 }}>
                    {showEnglish
                      ? "Not in any of your decks yet."
                      : "Noch in keinem deiner Decks vorhanden."}
                  </Text>
                </View>
              )}

              {/* ── Card Hero Image ── */}
              {cardImageUri && (
                <View style={styles.heroWrapper}>
                  <AnimatedCard
                    imageUri={cardImageUri}
                    artUri={cardArtUri}
                    width={230}
                    height={320}
                    borderRadius={12}
                  />
                  <View style={styles.heroControls}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.heroName, { color: colors.foreground }]} numberOfLines={1}>{displayName}</Text>
                      {hasDeTranslation && !cardLocalEn && cardEn?.name !== displayName && (
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{cardEn?.name}</Text>
                      )}
                    </View>
                    {hasDeTranslation && (
                      <TouchableOpacity
                        onPress={() => setCardLocalEn((v) => !v)}
                        style={[styles.langPill, { backgroundColor: colors.secondary }]}
                      >
                        <Text style={[styles.langOpt, !cardLocalEn && { color: colors.primary, fontFamily: "Inter_700Bold" }]}>DE</Text>
                        <Text style={[styles.langOpt, cardLocalEn && { color: colors.primary, fontFamily: "Inter_700Bold" }]}>EN</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}

              {/* ── Info Box ── */}
              <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: colors.primary }]}>

                {!cardImageUri && (
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{displayName}</Text>
                )}

                {displayType ? (
                  <Text style={[styles.typeLine, { color: colors.accent }]}>{displayType}</Text>
                ) : null}

                {/* Badges */}
                <View style={styles.badges}>
                  {card.mana_cost ? (
                    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>{card.mana_cost}</Text>
                    </View>
                  ) : null}
                  {card.power && card.toughness ? (
                    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>{card.power}/{card.toughness}</Text>
                    </View>
                  ) : null}
                  {rarity ? (
                    <View style={[styles.badge, { backgroundColor: rarity.color + "22", borderColor: rarity.color, borderWidth: 1 }]}>
                      <Text style={[styles.badgeText, { color: rarity.color }]}>{showEnglish ? rarity.en : rarity.de}</Text>
                    </View>
                  ) : null}
                  {card.set_name ? (
                    <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>{card.set_name}</Text>
                    </View>
                  ) : null}
                  {eurPrice ? (
                    <View style={[styles.badge, { backgroundColor: "#16a34a22", borderColor: "#16a34a", borderWidth: 1 }]}>
                      <Text style={[styles.badgeText, { color: "#16a34a" }]}>{eurPrice}</Text>
                    </View>
                  ) : null}
                  {card.edhrec_rank ? (
                    <View style={[styles.badge, { backgroundColor: colors.primary + "18", borderColor: colors.primary, borderWidth: 1 }]}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>EDHREC #{card.edhrec_rank.toLocaleString()}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Oracle Text */}
                {displayOracle ? (
                  <Text style={[styles.oracle, { color: colors.foreground }]}>{displayOracle}</Text>
                ) : null}

                {/* Card Score */}
                {card && (() => {
                  const cs = calculateCardScore({ type_line: card.type_line, oracle_text: card.oracle_text, keywords: card.keywords, cmc: card.cmc });
                  const col = scoreColor(cs.total);
                  const lbl = scoreLabel(cs.total, showEnglish);
                  return (
                    <View style={{ marginTop: 10, borderRadius: 10, borderWidth: 1, borderColor: col + "44", backgroundColor: col + "0d", padding: 10, gap: 6 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: col, backgroundColor: col + "18", alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 15, fontFamily: "Inter_700Bold", color: col }}>{cs.total}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: col }}>{lbl}</Text>
                          <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                            {showEnglish ? "Card score (0–100)" : "Kartenwert (0–100)"}
                          </Text>
                        </View>
                      </View>
                      {[
                        { label: showEnglish ? "Mana efficiency" : "Mana-Effizienz", val: cs.mana, max: 40 },
                        { label: showEnglish ? "Flexibility"     : "Flexibilität",   val: cs.flex, max: 35 },
                        { label: showEnglish ? "Card type"       : "Kartentyp",      val: cs.type_, max: 25 },
                      ].map((row) => (
                        <View key={row.label} style={{ gap: 2 }}>
                          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ fontSize: 11, fontFamily: "Inter_500Medium", color: colors.mutedForeground }}>{row.label}</Text>
                            <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>{row.val}/{row.max}</Text>
                          </View>
                          <View style={{ height: 4, borderRadius: 3, backgroundColor: colors.secondary }}>
                            <View style={{ height: 4, borderRadius: 3, backgroundColor: col, width: `${Math.round((row.val / row.max) * 100)}%` as any }} />
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })()}
              </View>

              {/* ── Add to Deck Button ── */}
              <TouchableOpacity
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowDeckPicker(true)}
                disabled={decks.length === 0}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.addBtnText}>
                  {showEnglish ? "Add to Deck" : "Zu Deck hinzufügen"}
                </Text>
              </TouchableOpacity>

              {/* Added feedback */}
              {addedToDeck && (
                <View style={[styles.deckBanner, { backgroundColor: "#16a34a18", borderColor: "#16a34a66" }]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#16a34a" />
                  <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: "#16a34a" }}>
                    {showEnglish ? `Added to "${addedToDeck}"` : `Zu „${addedToDeck}" hinzugefügt`}
                  </Text>
                </View>
              )}

              {/* ── Format Legality ── */}
              {card.legalities && (
                <TouchableOpacity
                  style={[styles.sectionHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setExpandedFormat((v) => !v)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "22" }]}>
                    <Ionicons name="trophy-outline" size={15} color={colors.primary} />
                  </View>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Format Legality" : "Format-Legalität"}
                  </Text>
                  <Ionicons name={expandedFormat ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
                </TouchableOpacity>
              )}
              {expandedFormat && card.legalities && (
                <View style={[styles.sectionBody, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {SHOWN_FORMATS.map((fmt) => {
                    const status = card.legalities![fmt] ?? "not_legal";
                    const legal = status === "legal" || status === "restricted";
                    const label = FORMAT_LABELS[fmt];
                    return (
                      <View key={fmt} style={styles.legalRow}>
                        <Text style={[styles.legalFmt, { color: colors.foreground }]}>{showEnglish ? label.en : label.de}</Text>
                        <View style={[styles.legalBadge, { backgroundColor: legal ? "#16a34a22" : "#dc262622", borderColor: legal ? "#16a34a" : "#dc2626" }]}>
                          <Text style={[styles.legalBadgeText, { color: legal ? "#16a34a" : "#dc2626" }]}>
                            {status === "legal" ? (showEnglish ? "Legal" : "Legal") :
                             status === "restricted" ? (showEnglish ? "Restricted" : "Eingeschränkt") :
                             (showEnglish ? "Not Legal" : "Nicht Legal")}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* ── Matched Keywords ── */}
              {matchedKeywords.length > 0 && (
                <>
                  <TouchableOpacity
                    style={[styles.sectionHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setExpandedKeywords((v) => !v)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.sectionIcon, { backgroundColor: colors.primary + "22" }]}>
                      <Ionicons name="book-outline" size={15} color={colors.primary} />
                    </View>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                      {showEnglish ? `Keywords (${matchedKeywords.length})` : `Keywords (${matchedKeywords.length})`}
                    </Text>
                    <Ionicons name={expandedKeywords ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} style={{ marginLeft: "auto" }} />
                  </TouchableOpacity>
                  {expandedKeywords && (
                    <View style={[styles.sectionBody, { backgroundColor: colors.card, borderColor: colors.border, gap: 10 }]}>
                      {matchedKeywords.map((kw) => (
                        <View key={kw.nameEn} style={{ gap: 2 }}>
                          <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primary }}>
                            {showEnglish ? kw.nameEn : kw.name}
                          </Text>
                          <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.foreground, lineHeight: 18 }}>
                            {showEnglish ? kw.fullEn : kw.fullDe}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}

            </View>
          )}

        </ScrollView>

        {/* ── Deck Picker ── */}
        <Modal visible={showDeckPicker} transparent animationType="fade">
          <TouchableOpacity style={styles.pickerOverlay} activeOpacity={1} onPress={() => setShowDeckPicker(false)}>
            <View style={[styles.pickerSheet, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
              <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
                {showEnglish ? "Add to Deck" : "Deck wählen"}
              </Text>
              <View style={{ gap: 8 }}>
                {decks.map((deck) => {
                  const already = deck.cards.some((c) => c.id === card?.id || c.name.toLowerCase() === card?.name.toLowerCase());
                  const entry = deck.cards.find((c) => c.id === card?.id);
                  return (
                    <TouchableOpacity
                      key={deck.id}
                      onPress={() => handleAddToDeck(deck)}
                      style={{ flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: already ? colors.primary + "66" : colors.border, gap: 10 }}
                    >
                      <Ionicons name={already ? "albums" : "albums-outline"} size={16} color={already ? colors.primary : colors.mutedForeground} />
                      <Text style={{ flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{deck.name}</Text>
                      {already && (
                        <Text style={{ fontSize: 12, fontFamily: "Inter_400Regular", color: colors.primary }}>
                          {entry ? `${entry.count}×` : "✓"}
                        </Text>
                      )}
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                        {deck.cards.reduce((a, c) => a + c.count, 0)} {showEnglish ? "cards" : "Karten"}
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
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
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth, zIndex: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  dropdown: { position: "absolute", top: "100%", left: 0, right: 0, borderRadius: 10, borderWidth: 1, overflow: "hidden", zIndex: 200, marginTop: 4 },
  suggestion: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 12 },
  suggestionText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  scroll: { padding: 16, gap: 12 },
  loadingBox: { alignItems: "center", paddingVertical: 60, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 12, borderWidth: 1 },
  errorText: { fontSize: 14, fontFamily: "Inter_500Medium", flex: 1 },
  emptyBox: { alignItems: "center", paddingVertical: 60, gap: 12, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  content: { gap: 12 },
  deckBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  heroWrapper: { alignItems: "center", gap: 10 },
  heroControls: { flexDirection: "row", alignItems: "center", gap: 10, width: "100%" },
  heroName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  langPill: { flexDirection: "row", borderRadius: 8, overflow: "hidden" },
  langOpt: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 13, fontFamily: "Inter_500Medium" },
  infoBox: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 8 },
  cardName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  typeLine: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  oracle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginTop: 4 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  addBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1 },
  sectionIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionBody: { padding: 14, borderRadius: 10, borderWidth: 1 },
  legalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 5 },
  legalFmt: { fontSize: 13, fontFamily: "Inter_500Medium" },
  legalBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  legalBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  pickerOverlay: { flex: 1, backgroundColor: "#00000088", justifyContent: "center", alignItems: "center", padding: 24 },
  pickerSheet: { width: "100%", borderRadius: 16, padding: 20, gap: 4 },
  pickerTitle: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 12 },
});
