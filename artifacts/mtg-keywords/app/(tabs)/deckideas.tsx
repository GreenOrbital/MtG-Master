import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LanguageToggle } from "@/components/LanguageToggle";
import { type Deck, type DeckCard, useDecks } from "@/context/DeckContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";

// ─── API base ────────────────────────────────────────────────────────────────

function getApiBase(): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (!domain) return "";
  return `https://${domain}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ArchetypeMeta = {
  key: string;
  labelDe: string;
  labelEn: string;
  colors: string[];
  colorHex: string;
  icon: string;
  tagsDe: string[];
  tagsEn: string[];
  summaryDe: string;
  summaryEn: string;
};

type SuggestedCard = {
  id: string;
  name: string;
  count: number;
  roleDe: string;
  roleEn: string;
  imageUri: string | null;
  mana_cost: string;
  cmc: number;
  type_line: string;
  oracle_text: string;
  keywords: string[];
  priceEur: number | null;
  priceUsd: number | null;
};

type DeckSuggestion = ArchetypeMeta & {
  whyDe: string;
  whyEn: string;
  totalCards: number;
  deckCards: SuggestedCard[];
  landCards: SuggestedCard[];
};

// ─── Color symbols ───────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  W: "#f5f0dc", U: "#0e68ab", B: "#2c2c2c", R: "#d3202a", G: "#00733e",
};
const COLOR_TEXT: Record<string, string> = {
  W: "#1a1a1a", U: "#fff", B: "#e0e0e0", R: "#fff", G: "#fff",
};

function ColorPip({ c }: { c: string }) {
  return (
    <View style={[styles.colorPip, { backgroundColor: COLOR_HEX[c] ?? "#888" }]}>
      <Text style={[styles.colorPipText, { color: COLOR_TEXT[c] ?? "#fff" }]}>{c}</Text>
    </View>
  );
}

// ─── Card Role Row ───────────────────────────────────────────────────────────

function SuggestedCardRow({
  card, showEnglish, onPress, colors,
}: {
  card: SuggestedCard;
  showEnglish: boolean;
  onPress: (card: SuggestedCard) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[styles.cardRow, { borderBottomColor: colors.border }]}
      onPress={() => onPress(card)}
      activeOpacity={0.75}
    >
      {/* Card image thumbnail */}
      {card.imageUri ? (
        <Image source={{ uri: card.imageUri }} style={styles.cardThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.cardThumbPlaceholder, { backgroundColor: colors.secondary }]}>
          <Ionicons name="card-outline" size={18} color={colors.mutedForeground} />
        </View>
      )}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={[styles.countBadge, { backgroundColor: colors.primary + "33" }]}>
            <Text style={[styles.countBadgeText, { color: colors.primary }]}>{card.count}×</Text>
          </View>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {card.name}
          </Text>
        </View>
        <Text style={[styles.roleText, { color: colors.accent }]} numberOfLines={2}>
          {showEnglish ? card.roleEn : card.roleDe}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

// ─── Card Detail Modal ───────────────────────────────────────────────────────

function CardDetailModal({
  card, visible, onClose, showEnglish, colors,
}: {
  card: SuggestedCard | null;
  visible: boolean;
  onClose: () => void;
  showEnglish: boolean;
  colors: ReturnType<typeof useColors>;
}) {
  if (!card) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={[styles.modalOverlay, { backgroundColor: "#00000088" }]}>
        <View style={[styles.cardDetailModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cardDetailHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.cardDetailName, { color: colors.foreground }]} numberOfLines={1}>
              {card.name}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 14 }}>
            {card.imageUri && (
              <Image
                source={{ uri: card.imageUri }}
                style={styles.cardDetailImage}
                resizeMode="contain"
              />
            )}
            {/* Rolle */}
            <View style={[styles.roleCard, { backgroundColor: colors.accent + "18", borderColor: colors.accent + "44" }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.roleCardLabel, { color: colors.accent }]}>
                  {showEnglish ? "Role in this deck" : "Rolle in diesem Deck"}
                </Text>
                <Text style={[styles.roleCardText, { color: colors.foreground }]}>
                  {showEnglish ? card.roleEn : card.roleDe}
                </Text>
              </View>
            </View>
            {/* Type + mana */}
            <View style={{ gap: 5 }}>
              {card.type_line ? (
                <Text style={[styles.cardDetailMeta, { color: colors.mutedForeground }]}>
                  {card.type_line}
                </Text>
              ) : null}
              {card.mana_cost ? (
                <Text style={[styles.cardDetailMeta, { color: colors.mutedForeground }]}>
                  {card.mana_cost}
                </Text>
              ) : null}
            </View>
            {/* Oracle text */}
            {card.oracle_text ? (
              <Text style={[styles.cardDetailOracle, { color: colors.foreground }]}>
                {card.oracle_text}
              </Text>
            ) : null}
            {/* Price */}
            {(card.priceEur != null || card.priceUsd != null) && (
              <View style={styles.priceRow}>
                {card.priceEur != null && (
                  <View style={[styles.pricePill, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.pricePillText, { color: colors.foreground }]}>
                      € {card.priceEur.toFixed(2)}
                    </Text>
                  </View>
                )}
                {card.priceUsd != null && (
                  <View style={[styles.pricePill, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.pricePillText, { color: colors.foreground }]}>
                      $ {card.priceUsd.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DeckIdeasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();
  const { decks, createDeck, importDeck } = useDecks();
  const router = useRouter();

  const [archetypes, setArchetypes] = useState<ArchetypeMeta[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<DeckSuggestion | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const [detailCard, setDetailCard] = useState<SuggestedCard | null>(null);
  const [showCardDetail, setShowCardDetail] = useState(false);

  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const apiBase = getApiBase();

  // Load archetype list on mount
  useEffect(() => {
    async function load() {
      setLoadingList(true);
      setListError(null);
      try {
        const r = await fetch(`${apiBase}/api/deck-suggestion/archetypes`);
        const data = await r.json();
        setArchetypes(data.archetypes ?? []);
      } catch {
        setListError(showEnglish ? "Could not load archetypes." : "Archetypen konnten nicht geladen werden.");
      } finally {
        setLoadingList(false);
      }
    }
    if (apiBase) load();
  }, [apiBase]);

  // Load specific archetype deck
  const loadSuggestion = useCallback(async (key: string) => {
    setSelectedKey(key);
    setSuggestion(null);
    setSuggestionError(null);
    setLoadingSuggestion(true);
    try {
      const r = await fetch(`${apiBase}/api/deck-suggestion/${key}`);
      if (!r.ok) throw new Error("not found");
      const data: DeckSuggestion = await r.json();
      setSuggestion(data);
    } catch {
      setSuggestionError(showEnglish ? "Deck could not be loaded." : "Deck konnte nicht geladen werden.");
    } finally {
      setLoadingSuggestion(false);
    }
  }, [apiBase, showEnglish]);

  function handleImportDeck() {
    if (!suggestion) return;
    const allCards: DeckCard[] = [
      ...suggestion.deckCards.map((c) => ({
        id: c.id, name: c.name, count: c.count,
        mana_cost: c.mana_cost, cmc: c.cmc,
        type_line: c.type_line, oracle_text: c.oracle_text,
        keywords: c.keywords, imageUri: c.imageUri ?? undefined,
        priceEur: c.priceEur ?? undefined, priceUsd: c.priceUsd ?? undefined,
      })),
      ...suggestion.landCards.map((c) => ({
        id: c.id, name: c.name, count: c.count,
        mana_cost: c.mana_cost, cmc: c.cmc,
        type_line: c.type_line, oracle_text: c.oracle_text,
        keywords: c.keywords, imageUri: c.imageUri ?? undefined,
        priceEur: c.priceEur ?? undefined, priceUsd: c.priceUsd ?? undefined,
      })),
    ];

    const newDeck: Deck = {
      id: `idea-${Date.now()}`,
      name: showEnglish ? suggestion.labelEn : suggestion.labelDe,
      cards: allCards,
      lands: { W: 0, U: 0, B: 0, R: 0, G: 0 },
      savedAt: Date.now(),
    };
    importDeck(newDeck);
    setImportFeedback(showEnglish ? "Deck added to your collection!" : "Deck zu deiner Sammlung hinzugefügt!");
    setTimeout(() => setImportFeedback(null), 5000);
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // ── Archetype List View ──────────────────────────────────────────────────
  if (!selectedKey) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={[styles.listContent, { paddingTop: topPad + 12 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.screenTitle, { color: colors.foreground }]}>
                {showEnglish ? "Deck Ideas" : "Deck-Ideen"}
              </Text>
              <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? "12 curated archetypes with real Scryfall cards and strategy explanations"
                  : "12 kuratierte Archetypen mit echten Scryfall-Karten und Strategie-Erklärungen"}
              </Text>
            </View>
            <LanguageToggle />
          </View>

          {loadingList && (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          )}
          {listError && (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{listError}</Text>
            </View>
          )}

          {archetypes.map((a) => (
            <TouchableOpacity
              key={a.key}
              style={[styles.archetypeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => loadSuggestion(a.key)}
              activeOpacity={0.82}
            >
              {/* Top bar with color */}
              <View style={[styles.archetypeTopBar, { backgroundColor: a.colorHex + "33" }]}>
                <View style={[styles.archetypeIconWrap, { backgroundColor: a.colorHex + "44" }]}>
                  <Ionicons name={a.icon as any} size={22} color={a.colorHex} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.archetypeName, { color: colors.foreground }]}>
                    {showEnglish ? a.labelEn : a.labelDe}
                  </Text>
                  <View style={styles.colorPips}>
                    {a.colors.map((c) => <ColorPip key={c} c={c} />)}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
              </View>
              {/* Summary */}
              <Text style={[styles.archetypeSummary, { color: colors.mutedForeground }]} numberOfLines={2}>
                {showEnglish ? a.summaryEn : a.summaryDe}
              </Text>
              {/* Tags */}
              <View style={styles.tagRow}>
                {(showEnglish ? a.tagsEn : a.tagsDe).map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: a.colorHex + "22", borderColor: a.colorHex + "55" }]}>
                    <Text style={[styles.tagText, { color: a.colorHex }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}

          <View style={{ height: insets.bottom + 100 }} />
        </ScrollView>
      </View>
    );
  }

  // ── Deck Detail View ─────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.detailContent, { paddingTop: topPad + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          style={[styles.backBtn, { borderColor: colors.border }]}
          onPress={() => { setSelectedKey(null); setSuggestion(null); }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>
            {showEnglish ? "All Archetypes" : "Alle Archetypen"}
          </Text>
        </TouchableOpacity>

        {loadingSuggestion && (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              {showEnglish ? "Loading deck from Scryfall…" : "Deck wird von Scryfall geladen…"}
            </Text>
          </View>
        )}

        {suggestionError && (
          <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{suggestionError}</Text>
          </View>
        )}

        {suggestion && (
          <>
            {/* Header */}
            <View style={[styles.detailHeader, { backgroundColor: suggestion.colorHex + "18", borderColor: suggestion.colorHex + "44" }]}>
              <View style={[styles.detailIconWrap, { backgroundColor: suggestion.colorHex + "33" }]}>
                <Ionicons name={suggestion.icon as any} size={28} color={suggestion.colorHex} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>
                  {showEnglish ? suggestion.labelEn : suggestion.labelDe}
                </Text>
                <View style={styles.colorPips}>
                  {suggestion.colors.map((c) => <ColorPip key={c} c={c} />)}
                </View>
                <View style={styles.tagRow}>
                  {(showEnglish ? suggestion.tagsEn : suggestion.tagsDe).map((tag) => (
                    <View key={tag} style={[styles.tag, { backgroundColor: suggestion.colorHex + "22", borderColor: suggestion.colorHex + "55" }]}>
                      <Text style={[styles.tagText, { color: suggestion.colorHex }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Strategy Summary */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardHeader}>
                <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                <Text style={[styles.sectionCardTitle, { color: colors.primary }]}>
                  {showEnglish ? "Strategy" : "Strategie"}
                </Text>
                <View style={[styles.totalBadge, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.totalBadgeText, { color: colors.primary }]}>
                    {suggestion.totalCards} {showEnglish ? "cards" : "Karten"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.sectionCardText, { color: colors.foreground }]}>
                {showEnglish ? suggestion.summaryEn : suggestion.summaryDe}
              </Text>
            </View>

            {/* Why this deck */}
            <View style={[styles.sectionCard, { backgroundColor: "#0d1f0d", borderColor: "#16a34a44" }]}>
              <View style={styles.sectionCardHeader}>
                <Ionicons name="analytics-outline" size={16} color="#4ade80" />
                <Text style={[styles.sectionCardTitle, { color: "#4ade80" }]}>
                  {showEnglish ? "Why this deck works" : "Warum dieses Deck funktioniert"}
                </Text>
              </View>
              <Text style={[styles.sectionCardText, { color: colors.foreground, lineHeight: 22 }]}>
                {showEnglish ? suggestion.whyEn : suggestion.whyDe}
              </Text>
            </View>

            {/* Import button */}
            {importFeedback ? (
              <View style={[styles.feedbackBox, { backgroundColor: "#16a34a22", borderColor: "#16a34a55" }]}>
                <Ionicons name="checkmark-circle" size={16} color="#4ade80" />
                <Text style={[styles.feedbackText, { color: "#4ade80" }]}>{importFeedback}</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.importBtn, { backgroundColor: colors.primary }]}
                onPress={handleImportDeck}
              >
                <Ionicons name="add-circle-outline" size={19} color="#fff" />
                <Text style={styles.importBtnText}>
                  {showEnglish ? "Add to my Decks" : "Zu meinen Decks hinzufügen"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Main Cards */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardHeader}>
                <Ionicons name="layers-outline" size={16} color={colors.primary} />
                <Text style={[styles.sectionCardTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Main Deck" : "Hauptdeck"}
                </Text>
                <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                  {suggestion.deckCards.reduce((s, c) => s + c.count, 0)} {showEnglish ? "cards" : "Karten"}
                </Text>
              </View>
              <Text style={[styles.tapHintText, { color: colors.mutedForeground }]}>
                {showEnglish ? "Tap a card to see full details" : "Karte antippen für vollständige Details"}
              </Text>
              {suggestion.deckCards.map((card) => (
                <SuggestedCardRow
                  key={card.id + card.name}
                  card={card}
                  showEnglish={showEnglish}
                  colors={colors}
                  onPress={(c) => { setDetailCard(c); setShowCardDetail(true); }}
                />
              ))}
            </View>

            {/* Land Cards */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.sectionCardHeader}>
                <Ionicons name="earth-outline" size={16} color={colors.primary} />
                <Text style={[styles.sectionCardTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Lands" : "Länder"}
                </Text>
                <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                  {suggestion.landCards.reduce((s, c) => s + c.count, 0)} {showEnglish ? "cards" : "Karten"}
                </Text>
              </View>
              {suggestion.landCards.map((card) => (
                <SuggestedCardRow
                  key={card.id + card.name}
                  card={card}
                  showEnglish={showEnglish}
                  colors={colors}
                  onPress={(c) => { setDetailCard(c); setShowCardDetail(true); }}
                />
              ))}
            </View>

            {/* Price summary */}
            {(() => {
              const allCards = [...suggestion.deckCards, ...suggestion.landCards];
              const totalEur = allCards.every((c) => c.priceEur != null)
                ? allCards.reduce((s, c) => s + (c.priceEur ?? 0) * c.count, 0) : null;
              const totalUsd = allCards.every((c) => c.priceUsd != null)
                ? allCards.reduce((s, c) => s + (c.priceUsd ?? 0) * c.count, 0) : null;
              if (!totalEur && !totalUsd) return null;
              return (
                <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.sectionCardHeader}>
                    <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
                    <Text style={[styles.sectionCardTitle, { color: colors.foreground }]}>
                      {showEnglish ? "Estimated Price" : "Geschätzter Preis"}
                    </Text>
                  </View>
                  <View style={styles.priceRow}>
                    {totalEur != null && (
                      <View style={[styles.pricePill, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.pricePillText, { color: colors.foreground }]}>
                          € {totalEur.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    {totalUsd != null && (
                      <View style={[styles.pricePill, { backgroundColor: colors.secondary }]}>
                        <Text style={[styles.pricePillText, { color: colors.foreground }]}>
                          $ {totalUsd.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.priceDisclaimer, { color: colors.mutedForeground }]}>
                    {showEnglish
                      ? "Prices from Scryfall/Cardmarket. May vary."
                      : "Preise von Scryfall/Cardmarket. Können variieren."}
                  </Text>
                </View>
              );
            })()}

            <View style={{ height: insets.bottom + 100 }} />
          </>
        )}
      </ScrollView>

      {/* Card detail modal */}
      <CardDetailModal
        card={detailCard}
        visible={showCardDetail}
        onClose={() => setShowCardDetail(false)}
        showEnglish={showEnglish}
        colors={colors}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingHorizontal: 16, gap: 14 },
  detailContent: { paddingHorizontal: 16, gap: 14 },

  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 4 },
  screenTitle: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 3 },
  screenSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },

  archetypeCard: {
    borderRadius: 16, borderWidth: 1, overflow: "hidden",
  },
  archetypeTopBar: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, paddingBottom: 10,
  },
  archetypeIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  archetypeName: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  archetypeSummary: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, paddingHorizontal: 14, paddingBottom: 8 },

  colorPips: { flexDirection: "row", gap: 4 },
  colorPip: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  colorPipText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, paddingHorizontal: 14, paddingBottom: 12 },
  tag: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 7, marginBottom: 2,
  },
  backBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  loadingCenter: { alignItems: "center", paddingTop: 50, gap: 12 },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular" },

  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },

  detailHeader: {
    flexDirection: "row", alignItems: "flex-start", gap: 14,
    borderRadius: 16, borderWidth: 1, padding: 16,
  },
  detailIconWrap: { width: 50, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  detailTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 6 },

  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  sectionCardHeader: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, paddingBottom: 10 },
  sectionCardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", flex: 1 },
  sectionCardText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21, paddingHorizontal: 12, paddingBottom: 12 },
  tapHintText: { fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 12, paddingBottom: 8, fontStyle: "italic" },

  totalBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  totalBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  countLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },

  cardRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cardThumb: { width: 40, height: 55, borderRadius: 4 },
  cardThumbPlaceholder: { width: 40, height: 55, borderRadius: 4, alignItems: "center", justifyContent: "center" },
  cardName: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  roleText: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  countBadge: { borderRadius: 99, paddingHorizontal: 6, paddingVertical: 1 },
  countBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold" },

  importBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderRadius: 12, paddingVertical: 14,
  },
  importBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },

  feedbackBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 14 },
  feedbackText: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },

  priceRow: { flexDirection: "row", gap: 8, padding: 12, paddingTop: 0, flexWrap: "wrap" },
  pricePill: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  pricePillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  priceDisclaimer: { fontSize: 11, fontFamily: "Inter_400Regular", paddingHorizontal: 12, paddingBottom: 10 },

  // Card detail modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  cardDetailModal: {
    height: "85%", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0,
  },
  cardDetailHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1,
  },
  cardDetailName: { fontSize: 18, fontFamily: "Inter_700Bold", flex: 1, marginRight: 10 },
  cardDetailImage: { width: "100%", height: 280, borderRadius: 12 },
  cardDetailMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardDetailOracle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  roleCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    borderRadius: 10, borderWidth: 1, padding: 10,
  },
  roleCardLabel: { fontSize: 11, fontFamily: "Inter_700Bold", marginBottom: 3 },
  roleCardText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
