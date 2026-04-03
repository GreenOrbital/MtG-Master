import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Image,
  Linking,
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

import { KeywordCard } from "@/components/KeywordCard";
import { LanguageToggle } from "@/components/LanguageToggle";
import { type CompactCard, useCardHistory } from "@/context/CardHistoryContext";
import { useDecks } from "@/context/DeckContext";
import { useSettings } from "@/context/SettingsContext";
import { MTG_KEYWORDS, type MtgKeyword } from "@/data/keywords";
import { useColors } from "@/hooks/useColors";

// ─── Types ──────────────────────────────────────────────────────────────────

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
  colors?: string[];
  color_identity?: string[];
  power?: string;
  toughness?: string;
  set_name?: string;
  rarity?: string;
  image_uris?: { normal?: string; small?: string };
  card_faces?: Array<{
    image_uris?: { normal?: string; small?: string };
    oracle_text?: string;
    printed_text?: string;
    flavor_text?: string;
  }>;
  legalities?: Record<string, string>;
  produced_mana?: string[];
};

type Suggestion = {
  display: string;
  resolveByName?: string;
  resolveById?: string;
  prefetchedCard?: CardData;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_INFO: Record<string, { label: string; land: string; landEn: string; hex: string; text: string }> = {
  W: { label: "Weiß", land: "Ebene", landEn: "Plains", hex: "#f5f0dc", text: "#1a1a1a" },
  U: { label: "Blau", land: "Insel", landEn: "Island", hex: "#0e68ab", text: "#ffffff" },
  B: { label: "Schwarz", land: "Sumpf", landEn: "Swamp", hex: "#2c2c2c", text: "#e0e0e0" },
  R: { label: "Rot", land: "Berg", landEn: "Mountain", hex: "#d3202a", text: "#ffffff" },
  G: { label: "Grün", land: "Wald", landEn: "Forest", hex: "#00733e", text: "#ffffff" },
};

const RARITY_LABEL: Record<string, { de: string; en: string; color: string }> = {
  common:   { de: "Gewöhnlich", en: "Common",   color: "#9ca3af" },
  uncommon: { de: "Ungewöhnlich", en: "Uncommon", color: "#6ee7b7" },
  rare:     { de: "Selten", en: "Rare",       color: "#fbbf24" },
  mythic:   { de: "Mythisch", en: "Mythic",     color: "#f97316" },
  special:  { de: "Speziell", en: "Special",    color: "#c084fc" },
};

const FORMAT_INFO: Array<{ key: string; labelDe: string; labelEn: string; descDe: string; descEn: string }> = [
  { key: "standard",  labelDe: "Standard",  labelEn: "Standard",  descDe: "Nur Karten der letzten ~2 Jahre", descEn: "Cards from the last ~2 years" },
  { key: "pioneer",   labelDe: "Pioneer",   labelEn: "Pioneer",   descDe: "Karten ab 2012 (kein Vintage/Legacy)", descEn: "Cards from 2012 onwards" },
  { key: "modern",    labelDe: "Modern",    labelEn: "Modern",    descDe: "Karten ab 8. Edition (2003)", descEn: "Cards from 8th Edition (2003)" },
  { key: "legacy",    labelDe: "Legacy",    labelEn: "Legacy",    descDe: "Fast alle Karten, einige verboten", descEn: "Almost all cards, some banned" },
  { key: "commander", labelDe: "Commander", labelEn: "Commander", descDe: "100-Karten-Format mit einem legendären Anführer", descEn: "100-card format with a legendary commander" },
];

function legalityColor(value: string): string {
  if (value === "legal")      return "#16a34a";
  if (value === "banned")     return "#dc2626";
  if (value === "restricted") return "#d97706";
  return "#6b7280";
}

function legalityLabel(value: string, de: boolean): string {
  if (value === "legal")      return de ? "Erlaubt" : "Legal";
  if (value === "banned")     return de ? "Verboten" : "Banned";
  if (value === "restricted") return de ? "Eingeschränkt" : "Restricted";
  return de ? "Nicht erlaubt" : "Not legal";
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
  // On web (dev + production): use relative URL so the reverse proxy routes correctly
  if (Platform.OS === "web") return "";
  // On native (Expo Go / standalone): need absolute URL
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
  } catch { return []; }
}

async function fetchGermanSuggestions(query: string): Promise<Suggestion[]> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=lang%3Ade+${encodeURIComponent(query)}&order=name&unique=names`,
      { headers: HEADERS }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data: CardData[] };
    return data.data.filter((c) => c.printed_name).slice(0, 8).map((c) => ({
      display: c.printed_name!,
      resolveById: c.id,
      prefetchedCard: c,
    }));
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

async function fetchCardByName(name: string): Promise<CardData | null> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
      { headers: HEADERS }
    );
    return res.ok ? ((await res.json()) as CardData) : null;
  } catch { return null; }
}

async function fetchSimilarCards(card: CardData): Promise<CardData[]> {
  try {
    const keywords = card.keywords ?? [];
    const colors = card.colors ?? [];
    const typeLine = card.type_line ?? "";

    let queryParts: string[] = [];

    if (keywords.length > 0) {
      const kwParts = keywords.slice(0, 2).map((k) => `o:"${k}"`).join(" OR ");
      queryParts.push(`(${kwParts})`);
    } else {
      if (typeLine.includes("Creature"))      queryParts.push("t:creature");
      else if (typeLine.includes("Instant"))  queryParts.push("t:instant");
      else if (typeLine.includes("Sorcery"))  queryParts.push("t:sorcery");
      else if (typeLine.includes("Enchantment")) queryParts.push("t:enchantment");
      else if (typeLine.includes("Artifact")) queryParts.push("t:artifact");
      else if (typeLine.includes("Planeswalker")) queryParts.push("t:planeswalker");
    }

    if (colors.length > 0 && colors.length <= 2) {
      queryParts.push(`color<=${colors.join("")}`);
    }

    queryParts.push(`-name:"${card.name}"`);
    queryParts.push("order:edhrec");

    const query = queryParts.join(" ");
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=cards`,
      { headers: HEADERS }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as { data: CardData[] };
    return data.data.slice(0, 8);
  } catch { return []; }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CardSearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();
  const { recentCards, favorites, addToRecent, toggleFavorite, isFavorite, clearRecent } = useCardHistory();
  const { decks, addCardToDeck } = useDecks();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [card, setCard] = useState<CardData | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);
  const [matchedKeywords, setMatchedKeywords] = useState<MtgKeyword[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFormatInfo, setShowFormatInfo] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [showDeckPicker, setShowDeckPicker] = useState(false);
  const [addedToDeck, setAddedToDeck] = useState<string | null>(null);
  const [pickedDeckId, setPickedDeckId] = useState<string | null>(null);
  const [addCount, setAddCount] = useState(1);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [loadingRecognize, setLoadingRecognize] = useState(false);
  const [recognizeError, setRecognizeError] = useState("");
  const [similarCards, setSimilarCards] = useState<CardData[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
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

  function applyCard(data: CardData) {
    const oracleText = data.oracle_text ?? data.card_faces?.map((f) => f.oracle_text).join(" ") ?? "";
    setCard(data);
    setMatchedKeywords(matchLocalKeywords(data.keywords ?? [], oracleText));
    setSimilarCards([]);
    setLoadingSimilar(true);
    fetchSimilarCards(data).then((cards) => {
      setSimilarCards(cards);
      setLoadingSimilar(false);
    });

    const compact: CompactCard = {
      id: data.id, name: data.name, printed_name: data.printed_name,
      type_line: data.type_line, printed_type_line: data.printed_type_line,
      mana_cost: data.mana_cost, set_name: data.set_name,
      imageUri: data.image_uris?.normal ?? data.card_faces?.[0]?.image_uris?.normal,
    };
    addToRecent(compact);
  }

  async function selectSuggestion(s: Suggestion) {
    setQuery(s.display); setSuggestions([]); setShowSuggestions(false);
    resetCardState(); setLoadingCard(true);
    const data = s.prefetchedCard
      ? s.prefetchedCard
      : s.resolveById ? await fetchCardById(s.resolveById)
      : s.resolveByName ? await fetchCardByName(s.resolveByName) : null;
    setLoadingCard(false);
    if (!data) setErrorMsg(showEnglish ? `Card "${s.display}" not found.` : `Karte "${s.display}" nicht gefunden.`);
    else applyCard(data); // non-blocking
  }

  async function selectCompact(c: CompactCard) {
    setQuery(c.printed_name ?? c.name);
    resetCardState(); setLoadingCard(true);
    const data = await fetchCardById(c.id);
    setLoadingCard(false);
    if (!data) setErrorMsg(showEnglish ? "Card not found." : "Karte nicht gefunden.");
    else applyCard(data); // non-blocking
  }

  async function submitQuery() {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (suggestions.length > 0) { await selectSuggestion(suggestions[0]); return; }
    setSuggestions([]); setShowSuggestions(false);
    resetCardState(); setLoadingCard(true);
    const data = await fetchCardByName(trimmed);
    setLoadingCard(false);
    if (!data) setErrorMsg(showEnglish ? `"${trimmed}" not found.` : `"${trimmed}" nicht gefunden.`);
    else applyCard(data); // non-blocking
  }

  function resetCardState() {
    setCard(null); setMatchedKeywords([]); setExpandedId(null); setErrorMsg("");
    setSimilarCards([]); setLoadingSimilar(false);
  }

  async function recognizeCard() {
    setRecognizeError("");
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setRecognizeError(showEnglish ? "Camera permission denied." : "Kamera-Zugriff verweigert.");
        return;
      }
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;

    const { base64, mimeType } = result.assets[0];
    setLoadingRecognize(true);
    resetCardState();
    try {
      const r = await fetch(`${getApiBase()}/api/recognize-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType: mimeType ?? "image/jpeg" }),
      });
      const { cardName } = (await r.json()) as { cardName: string | null };
      if (!cardName) {
        setRecognizeError(showEnglish ? "Card not recognized. Try a clearer photo." : "Karte nicht erkannt. Schärferes Foto versuchen.");
        setLoadingRecognize(false);
        return;
      }
      setQuery(cardName);
      setLoadingRecognize(false);
      setLoadingCard(true);
      const data = await fetchCardByName(cardName);
      setLoadingCard(false);
      if (!data) setErrorMsg(showEnglish ? `"${cardName}" not found.` : `"${cardName}" nicht gefunden.`);
      else applyCard(data);
    } catch {
      setRecognizeError(showEnglish ? "Recognition failed." : "Erkennung fehlgeschlagen.");
      setLoadingRecognize(false);
    }
  }

  function clearAll() { setQuery(""); setSuggestions([]); setShowSuggestions(false); setInputFocused(false); resetCardState(); setRecognizeError(""); }

  const showDropdown = inputFocused && suggestions.length > 0;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  const displayName      = card?.printed_name ?? card?.name ?? "";
  const displayTypeLine  = card?.printed_type_line ?? card?.type_line ?? "";
  const displayOracle    = card?.printed_text ?? card?.card_faces?.map((f) => f.printed_text ?? f.oracle_text).join("\n—\n") ?? card?.oracle_text ?? "";
  const displayFlavor    = card?.flavor_text ?? card?.card_faces?.find((f) => f.flavor_text)?.flavor_text;
  const cardImageUri     = card?.image_uris?.normal ?? card?.card_faces?.[0]?.image_uris?.normal;
  const scryfallUrl      = card ? `https://scryfall.com/search?q=!${encodeURIComponent(card.name)}` : "";
  const showEmpty        = !card && !loadingCard && !errorMsg && query.length === 0;
  const cardColors       = card?.colors ?? [];
  const rarity           = card?.rarity ? (RARITY_LABEL[card.rarity] ?? null) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Backdrop: closes dropdown when tapping outside */}
      {showDropdown && (
        <TouchableOpacity style={[StyleSheet.absoluteFillObject, { zIndex: 9 }]} activeOpacity={1}
          onPress={() => { setInputFocused(false); setShowSuggestions(false); }} />
      )}
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border, zIndex: 10 }]}>
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
            onChangeText={(t) => { setQuery(t); if (card) resetCardState(); }}
            placeholder={showEnglish ? "e.g. Lightning Bolt or Blitzschlag…" : "z.B. Blitzschlag oder Lightning Bolt…"}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            autoCorrect={false} autoCapitalize="words"
            returnKeyType="search" onSubmitEditing={submitQuery}
            onFocus={() => { setInputFocused(true); setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setInputFocused(false), 200)}
          />
          {(loadingSuggestions || loadingRecognize) && <ActivityIndicator size="small" color={colors.primary} />}
          {query.length > 0 && !loadingSuggestions && !loadingRecognize && (
            <TouchableOpacity onPress={clearAll}>
              <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
          {!loadingRecognize && (
            <TouchableOpacity onPress={recognizeCard} style={[styles.cameraBtn, { backgroundColor: colors.primary + "22" }]}>
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
        {recognizeError ? (
          <View style={styles.recognizeErrorRow}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.destructive} />
            <Text style={[styles.recognizeErrorText, { color: colors.destructive }]}>{recognizeError}</Text>
          </View>
        ) : null}
        {loadingRecognize && (
          <View style={styles.recognizeHintRow}>
            <Ionicons name="sparkles-outline" size={13} color={colors.primary} />
            <Text style={[styles.recognizeHintText, { color: colors.primary }]}>
              {showEnglish ? "KI is reading your card…" : "KI liest deine Karte…"}
            </Text>
          </View>
        )}
        {showDropdown && (
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

        {loadingCard && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              {showEnglish ? "Loading card data…" : "Kartendaten werden geladen…"}
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

            {/* ── Card info box ── */}
            <View style={[styles.cardInfoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardInfoTop}>
                <View style={styles.cardInfoLeft}>
                  {/* Name + star */}
                  <View style={styles.nameRow}>
                    <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={2}>{displayName}</Text>
                    <TouchableOpacity onPress={() => toggleFavorite({
                      id: card.id, name: card.name, printed_name: card.printed_name,
                      type_line: card.type_line, printed_type_line: card.printed_type_line,
                      mana_cost: card.mana_cost, set_name: card.set_name, imageUri: cardImageUri,
                    })}>
                      <Ionicons name={isFavorite(card.id) ? "star" : "star-outline"} size={22}
                        color={isFavorite(card.id) ? "#f59e0b" : colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>

                  {/* English name (if German card) */}
                  {card.printed_name && card.name !== card.printed_name && (
                    <Text style={[styles.cardEnName, { color: colors.mutedForeground }]}>{card.name}</Text>
                  )}

                  {/* Type */}
                  {displayTypeLine ? <Text style={[styles.cardType, { color: colors.mutedForeground }]}>{displayTypeLine}</Text> : null}

                  {/* Badges: mana + P/T + set + rarity */}
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
                    {rarity ? (
                      <View style={[styles.metaBadge, { backgroundColor: rarity.color + "22", borderColor: rarity.color, borderWidth: 1 }]}>
                        <Text style={[styles.metaBadgeText, { color: rarity.color }]}>{showEnglish ? rarity.en : rarity.de}</Text>
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
                  <TouchableOpacity onPress={() => setShowImageZoom(true)} activeOpacity={0.85}>
                    <Image source={{ uri: cardImageUri }} style={styles.cardThumb} resizeMode="contain" />
                    <View style={styles.zoomHint}>
                      <Ionicons name="expand-outline" size={12} color="#ffffff99" />
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── Mana colors with land names ── */}
              {cardColors.length > 0 && (
                <View style={[styles.colorsBox, { borderTopColor: colors.border }]}>
                  <Text style={[styles.colorsLabel, { color: colors.mutedForeground }]}>
                    {showEnglish ? "Mana Colors & Lands" : "Manafarben & Länder"}
                  </Text>
                  <View style={styles.colorsList}>
                    {cardColors.map((c) => {
                      const info = COLOR_INFO[c];
                      if (!info) return null;
                      return (
                        <View key={c} style={[styles.colorChip, { backgroundColor: info.hex }]}>
                          <Text style={[styles.colorChipMain, { color: info.text }]}>
                            {showEnglish ? info.label.replace("Weiß","White").replace("Blau","Blue").replace("Schwarz","Black").replace("Rot","Red").replace("Grün","Green") : info.label}
                          </Text>
                          <Text style={[styles.colorChipSub, { color: info.text + "cc" }]}>
                            {showEnglish ? info.landEn : info.land}
                          </Text>
                        </View>
                      );
                    })}
                    {cardColors.length === 0 && (
                      <View style={[styles.colorChip, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.colorChipMain, { color: colors.secondaryForeground }]}>
                          {showEnglish ? "Colorless" : "Farblos"}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* ── Oracle text ── */}
              {displayOracle ? (
                <View style={[styles.oracleBox, { borderTopColor: colors.border }]}>
                  <Text style={[styles.oracleLabel, { color: colors.mutedForeground }]}>
                    {showEnglish ? "Card Text" : "Kartentext"}
                  </Text>
                  <Text style={[styles.oracleText, { color: colors.cardForeground }]}>{displayOracle}</Text>
                </View>
              ) : null}

              {/* ── Flavor text ── */}
              {displayFlavor ? (
                <View style={[styles.flavorBox, { borderTopColor: colors.border }]}>
                  <Text style={[styles.flavorText, { color: colors.mutedForeground }]}>„{displayFlavor}"</Text>
                </View>
              ) : null}

              {/* ── Scryfall link ── */}
              <TouchableOpacity style={[styles.scryfallRow, { borderTopColor: colors.border }]} onPress={() => Linking.openURL(scryfallUrl)}>
                <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.scryfallText, { color: colors.mutedForeground }]}>
                  {showEnglish ? "Prices, all editions & rulings on Scryfall" : "Preise, alle Editionen & Regeln auf Scryfall"}
                </Text>
              </TouchableOpacity>

              {/* ── Zum Deck hinzufügen ── */}
              <TouchableOpacity
                style={[styles.addToDeckBtn, {
                  borderTopColor: colors.border,
                  backgroundColor: addedToDeck ? "#16a34a22" : colors.primary + "18",
                }]}
                onPress={() => {
                  if (decks.length === 0) {
                    setShowDeckPicker(true);
                  } else {
                    setShowDeckPicker(true);
                  }
                }}
              >
                <Ionicons
                  name={addedToDeck ? "checkmark-circle" : "albums-outline"}
                  size={16}
                  color={addedToDeck ? "#16a34a" : colors.primary}
                />
                <Text style={[styles.addToDeckText, { color: addedToDeck ? "#16a34a" : colors.primary }]}>
                  {addedToDeck
                    ? (showEnglish ? `Added to "${addedToDeck}"` : `Zu "${addedToDeck}" hinzugefügt`)
                    : (showEnglish ? "Add to Deck" : "Zu Deck hinzufügen")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Format Legality ── */}
            {card.legalities && (
              <View style={[styles.formatBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <TouchableOpacity style={styles.formatHeader} onPress={() => setShowFormatInfo((v) => !v)}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Format Legality" : "Format-Zulässigkeit"}
                  </Text>
                  <Ionicons name={showFormatInfo ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
                <View style={styles.legalityGrid}>
                  {FORMAT_INFO.map((f) => {
                    const val = card.legalities?.[f.key] ?? "not_legal";
                    const col = legalityColor(val);
                    const isLegal = val === "legal";
                    return (
                      <View key={f.key} style={[styles.legalCard, { borderColor: col, backgroundColor: isLegal ? col + "18" : colors.background }]}>
                        <Text style={[styles.legalFormat, { color: isLegal ? col : colors.mutedForeground }]}>
                          {showEnglish ? f.labelEn : f.labelDe}
                        </Text>
                        <Text style={[styles.legalStatus, { color: col }]}>
                          {legalityLabel(val, !showEnglish)}
                        </Text>
                        {showFormatInfo && (
                          <Text style={[styles.legalDesc, { color: colors.mutedForeground }]}>
                            {showEnglish ? f.descEn : f.descDe}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Keywords ── */}
            {matchedKeywords.length > 0 ? (
              <View style={styles.kwSection}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {showEnglish ? `${matchedKeywords.length} keyword(s) explained` : `${matchedKeywords.length} Schlüsselwort/e erklärt`}
                </Text>
                {matchedKeywords.map((kw) => (
                  <KeywordCard key={kw.id} keyword={kw} showEnglish={showEnglish}
                    expanded={expandedId === kw.id}
                    onPress={() => setExpandedId((p) => (p === kw.id ? null : kw.id))} />
                ))}
              </View>
            ) : (
              <View style={[styles.noKwBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={26} color={colors.mutedForeground} />
                <Text style={[styles.noKwText, { color: colors.mutedForeground }]}>
                  {showEnglish ? "No keywords from our database on this card." : "Keine Schlüsselwörter aus unserer Datenbank auf dieser Karte."}
                </Text>
              </View>
            )}

            {/* ── Ähnliche Karten ── */}
            {(loadingSimilar || similarCards.length > 0) && (
              <View style={styles.similarSection}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Similar Cards" : "Ähnliche Karten"}
                </Text>
                {loadingSimilar ? (
                  <View style={styles.similarLoading}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.similarLoadingText, { color: colors.mutedForeground }]}>
                      {showEnglish ? "Searching…" : "Suche läuft…"}
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.similarScroll}
                    contentContainerStyle={styles.similarScrollContent}
                  >
                    {similarCards.map((sc) => {
                      const imgUri = sc.image_uris?.small ?? sc.card_faces?.[0]?.image_uris?.small;
                      const displayN = sc.printed_name ?? sc.name;
                      const scRarity = sc.rarity ? (RARITY_LABEL[sc.rarity] ?? null) : null;
                      return (
                        <TouchableOpacity
                          key={sc.id}
                          style={[styles.similarCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                          activeOpacity={0.75}
                          onPress={() => {
                            setQuery(displayN);
                            resetCardState();
                            setLoadingCard(true);
                            fetchCardById(sc.id).then((data) => {
                              setLoadingCard(false);
                              if (data) applyCard(data);
                              else setErrorMsg(showEnglish ? "Card not found." : "Karte nicht gefunden.");
                            });
                          }}
                        >
                          {imgUri ? (
                            <Image source={{ uri: imgUri }} style={styles.similarImage} resizeMode="cover" />
                          ) : (
                            <View style={[styles.similarImagePlaceholder, { backgroundColor: colors.secondary }]}>
                              <Ionicons name="card-outline" size={20} color={colors.mutedForeground} />
                            </View>
                          )}
                          <Text style={[styles.similarName, { color: colors.foreground }]} numberOfLines={2}>{displayN}</Text>
                          {scRarity && (
                            <Text style={[styles.similarRarity, { color: scRarity.color }]}>
                              {showEnglish ? scRarity.en : scRarity.de}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            )}

          </View>
        )}

        {/* ── Image Zoom Modal ── */}
        <Modal visible={showImageZoom} transparent animationType="fade"
          onRequestClose={() => setShowImageZoom(false)}>
          <TouchableOpacity style={styles.zoomOverlay} activeOpacity={1} onPress={() => setShowImageZoom(false)}>
            <Image
              source={{ uri: card?.image_uris?.normal ?? card?.card_faces?.[0]?.image_uris?.normal }}
              style={styles.zoomImage}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.zoomClose} onPress={() => setShowImageZoom(false)}>
              <Ionicons name="close-circle" size={34} color="#ffffffcc" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* ── Deck Picker Modal ── */}
        <Modal visible={showDeckPicker} transparent animationType="slide"
          onRequestClose={() => { setShowDeckPicker(false); setPickedDeckId(null); setAddCount(1); }}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1}
            onPress={() => { setShowDeckPicker(false); setPickedDeckId(null); setAddCount(1); }}>
            <View style={[styles.modalSheet, { backgroundColor: colors.card }]} onStartShouldSetResponder={() => true}>
              <View style={styles.modalHandle} />

              {/* Step 1: Choose deck */}
              {!pickedDeckId && (
                <>
                  <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Add to deck" : "Zu Deck hinzufügen"}
                  </Text>
                  {decks.length === 0 ? (
                    <View style={styles.modalEmpty}>
                      <Ionicons name="albums-outline" size={32} color={colors.mutedForeground} />
                      <Text style={[styles.modalEmptyText, { color: colors.mutedForeground }]}>
                        {showEnglish
                          ? "No decks yet. Create a deck first in the Deck Builder tab."
                          : "Noch keine Decks. Zuerst im Deck-Builder Tab ein Deck anlegen."}
                      </Text>
                    </View>
                  ) : (
                    decks.map((d) => (
                      <TouchableOpacity key={d.id}
                        style={[styles.modalDeckRow, { borderColor: colors.border, backgroundColor: colors.background }]}
                        onPress={() => {
                          const cardIsLand = !!card?.type_line?.toLowerCase().includes("land");
                          setPickedDeckId(d.id);
                          setAddCount(cardIsLand ? 4 : 1);
                        }}>
                        <Ionicons name="albums-outline" size={18} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.modalDeckName, { color: colors.foreground }]}>{d.name}</Text>
                          <Text style={[styles.modalDeckMeta, { color: colors.mutedForeground }]}>
                            {d.cards.reduce((a, c) => a + c.count, 0)} {showEnglish ? "cards" : "Karten"}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                      </TouchableOpacity>
                    ))
                  )}
                </>
              )}

              {/* Step 2: Set count */}
              {pickedDeckId && card && (() => {
                const deck = decks.find((d) => d.id === pickedDeckId);
                const cardIsLand = !!card.type_line?.toLowerCase().includes("land");
                const maxC = cardIsLand ? 99 : 4;
                return (
                  <>
                    <TouchableOpacity style={styles.modalBack} onPress={() => { setPickedDeckId(null); setAddCount(1); }}>
                      <Ionicons name="chevron-back" size={16} color={colors.primary} />
                      <Text style={[styles.modalBackText, { color: colors.primary }]}>{deck?.name}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                      {card.printed_name ?? card.name}
                    </Text>
                    <Text style={[styles.modalSubtitle, { color: colors.mutedForeground }]}>
                      {showEnglish ? "How many copies?" : "Wie viele Exemplare?"}
                    </Text>
                    <View style={styles.countRow}>
                      <TouchableOpacity
                        style={[styles.countBtn, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: addCount <= 1 ? 0.4 : 1 }]}
                        onPress={() => setAddCount((c) => Math.max(1, c - 1))} disabled={addCount <= 1}>
                        <Ionicons name="remove" size={22} color={colors.foreground} />
                      </TouchableOpacity>
                      <Text style={[styles.countVal, { color: colors.foreground }]}>{addCount}</Text>
                      <TouchableOpacity
                        style={[styles.countBtn, { backgroundColor: colors.secondary, borderColor: colors.border, opacity: addCount >= maxC ? 0.4 : 1 }]}
                        onPress={() => setAddCount((c) => Math.min(maxC, c + 1))} disabled={addCount >= maxC}>
                        <Ionicons name="add" size={22} color={colors.foreground} />
                      </TouchableOpacity>
                    </View>
                    {cardIsLand && (
                      <View style={styles.quickCounts}>
                        {[4, 8, 12, 16, 20, 24].map((n) => (
                          <TouchableOpacity key={n} style={[styles.quickCountBtn, { borderColor: addCount === n ? colors.primary : colors.border, backgroundColor: addCount === n ? colors.primary + "22" : "transparent" }]}
                            onPress={() => setAddCount(n)}>
                            <Text style={[styles.quickCountText, { color: addCount === n ? colors.primary : colors.mutedForeground }]}>{n}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                    <TouchableOpacity
                      style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        if (!card || !pickedDeckId) return;
                        addCardToDeck(pickedDeckId, {
                          id: card.id,
                          name: card.name,
                          printed_name: card.printed_name,
                          mana_cost: card.mana_cost,
                          type_line: card.type_line,
                          produced_mana: card.produced_mana,
                        }, addCount);
                        const deckName = deck?.name ?? "";
                        setAddedToDeck(deckName);
                        setShowDeckPicker(false);
                        setPickedDeckId(null);
                        setAddCount(1);
                        setTimeout(() => setAddedToDeck(null), 3000);
                      }}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                      <Text style={styles.confirmBtnText}>
                        {showEnglish ? `Add ${addCount}×` : `${addCount}× hinzufügen`}
                      </Text>
                    </TouchableOpacity>
                  </>
                );
              })()}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ── Empty state ── */}
        {showEmpty && (
          <View style={styles.emptyContent}>
            {favorites.length > 0 && (
              <View style={styles.historySection}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  ★  {showEnglish ? "Favorites" : "Favoriten"}
                </Text>
                <View style={styles.historyGrid}>
                  {favorites.map((c) => (
                    <TouchableOpacity key={c.id} style={[styles.historyCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => selectCompact(c)}>
                      {c.imageUri && <Image source={{ uri: c.imageUri }} style={styles.historyImage} resizeMode="contain" />}
                      <Text style={[styles.historyName, { color: colors.foreground }]} numberOfLines={2}>{c.printed_name ?? c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {recentCards.length > 0 && (
              <View style={styles.historySection}>
                <View style={styles.historySectionRow}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Recently Searched" : "Zuletzt gesucht"}
                  </Text>
                  <TouchableOpacity onPress={clearRecent}>
                    <Text style={[styles.clearText, { color: colors.mutedForeground }]}>{showEnglish ? "Clear" : "Löschen"}</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.recentList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {recentCards.map((c, i) => (
                    <TouchableOpacity key={c.id} style={[styles.recentRow, { borderBottomColor: colors.border, borderBottomWidth: i < recentCards.length - 1 ? StyleSheet.hairlineWidth : 0 }]} onPress={() => selectCompact(c)}>
                      {c.imageUri && <Image source={{ uri: c.imageUri }} style={styles.recentThumb} resizeMode="contain" />}
                      <View style={styles.recentInfo}>
                        <Text style={[styles.recentName, { color: colors.foreground }]} numberOfLines={1}>{c.printed_name ?? c.name}</Text>
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1, zIndex: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 10, lineHeight: 18 },
  inputRow: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  cameraBtn: { borderRadius: 8, padding: 5 },
  recognizeErrorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  recognizeErrorText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  recognizeHintRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  recognizeHintText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  dropdown: {
    position: "absolute", left: 16, right: 16, top: "100%",
    borderRadius: 12, borderWidth: 1, marginTop: 4, zIndex: 100, overflow: "hidden",
    ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 8 } }),
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
  colorsBox: { borderTopWidth: 1, padding: 14, gap: 8 },
  colorsLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  colorsList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  colorChip: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: "center", minWidth: 68 },
  colorChipMain: { fontSize: 13, fontFamily: "Inter_700Bold" },
  colorChipSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  oracleBox: { borderTopWidth: 1, padding: 14, gap: 4 },
  oracleLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  oracleText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, fontStyle: "italic" },
  flavorBox: { borderTopWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  flavorText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, fontStyle: "italic" },
  scryfallRow: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  scryfallText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  formatBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  formatHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  legalityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  legalCard: { borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 8, minWidth: "30%", flex: 1 },
  legalFormat: { fontSize: 12, fontFamily: "Inter_700Bold" },
  legalStatus: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 2 },
  legalDesc: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 14 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  kwSection: { gap: 4 },
  noKwBox: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  noKwText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  similarSection: { gap: 10 },
  similarLoading: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  similarLoadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  similarScroll: { marginHorizontal: -16 },
  similarScrollContent: { paddingHorizontal: 16, gap: 10, paddingBottom: 4 },
  similarCard: { width: 96, borderRadius: 10, borderWidth: 1, padding: 6, alignItems: "center", gap: 4 },
  similarImage: { width: 84, height: 116, borderRadius: 6 },
  similarImagePlaceholder: { width: 84, height: 116, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  similarName: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 14 },
  similarRarity: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  emptyContent: { gap: 20 },
  historySection: { gap: 10 },
  historySectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  clearText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  historyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  historyCard: { width: 90, borderRadius: 10, borderWidth: 1, padding: 6, alignItems: "center", gap: 4 },
  historyImage: { width: 78, height: 109, borderRadius: 4 },
  historyName: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 14 },
  recentList: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  recentRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, gap: 10 },
  recentThumb: { width: 36, height: 50, borderRadius: 4 },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  recentSub: { fontSize: 12, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  emptyState: { alignItems: "center", paddingTop: 40, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  emptyHint: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 4, flex: 0, marginLeft: 8 },
  retryText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  zoomHint: { position: "absolute", bottom: 4, right: 4, backgroundColor: "#00000044", borderRadius: 8, padding: 3 },
  zoomOverlay: { flex: 1, backgroundColor: "#000000ee", justifyContent: "center", alignItems: "center" },
  zoomImage: { width: "90%", height: "80%", borderRadius: 16 },
  zoomClose: { position: "absolute", top: 52, right: 16 },
  addToDeckBtn: {
    borderTopWidth: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingHorizontal: 14, paddingVertical: 12,
  },
  addToDeckText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "#00000080", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12, paddingBottom: 40 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#66666660", alignSelf: "center", marginBottom: 4 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalEmpty: { alignItems: "center", padding: 20, gap: 10 },
  modalEmptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  modalDeckRow: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  modalDeckName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalDeckMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  modalBack: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: -4 },
  modalBackText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  modalSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  countRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, paddingVertical: 8 },
  countBtn: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  countVal: { fontSize: 36, fontFamily: "Inter_700Bold", minWidth: 60, textAlign: "center" },
  quickCounts: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  quickCountBtn: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7 },
  quickCountText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  confirmBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 14, marginTop: 4 },
  confirmBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
