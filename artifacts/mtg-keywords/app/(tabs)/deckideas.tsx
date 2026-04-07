import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import { getArchetypeList, getDeckSuggestion, type ArchetypeMeta, type DeckSuggestion, type SuggestedCard } from "@/lib/deckSuggestionService";

// ─── Commander Precon Decks ───────────────────────────────────────────────────

const COMMANDER_PRECONS: { name: string; set: string; year: string; commander?: string }[] = [
  // Commander Masters 2023
  { name: "Enduring Enchantments",  set: "Commander Masters", year: "2023", commander: "Anikthea, Hand of Erebos" },
  { name: "Planeswalker Party",     set: "Commander Masters", year: "2023", commander: "Commodore Guff" },
  { name: "Sliver Swarm",           set: "Commander Masters", year: "2023", commander: "Sliver Gravemother" },
  { name: "Eldrazi Unbound",        set: "Commander Masters", year: "2023", commander: "Zhulodok, Void Gorger" },
  // The Lost Caverns of Ixalan
  { name: "Blood Rites",            set: "The Lost Caverns of Ixalan", year: "2023", commander: "Clavileño, First of the Blessed" },
  { name: "Explorers of the Deep",  set: "The Lost Caverns of Ixalan", year: "2023", commander: "Hakbal of the Surging Soul" },
  { name: "Ahoy Mateys",            set: "The Lost Caverns of Ixalan", year: "2023", commander: "Admiral Brass, Unsinkable" },
  { name: "Veloci-Ramp-Tor",        set: "The Lost Caverns of Ixalan", year: "2023", commander: "Pantlaza, Sun-Favored" },
  // Murders at Karlov Manor
  { name: "Blame Game",             set: "Murders at Karlov Manor", year: "2024", commander: "Miriam, Herd Whisperer" },
  { name: "Deep Clue Sea",          set: "Murders at Karlov Manor", year: "2024", commander: "Morska, Undersea Sleuth" },
  { name: "Revenant Recon",         set: "Murders at Karlov Manor", year: "2024", commander: "Kaya, Spirits' Justice" },
  { name: "Deadly Disguise",        set: "Murders at Karlov Manor", year: "2024", commander: "Nelly Borca, Impulsive Accuser" },
  // Outlaws of Thunder Junction
  { name: "Most Wanted",            set: "Outlaws of Thunder Junction", year: "2024", commander: "Olivia, Opulent Outlaw" },
  { name: "Desert Bloom",           set: "Outlaws of Thunder Junction", year: "2024", commander: "Yuma, Proud Protector" },
  { name: "Quick Draw",             set: "Outlaws of Thunder Junction", year: "2024", commander: "Stella Lee, Wild Card" },
  { name: "Grand Larceny",          set: "Outlaws of Thunder Junction", year: "2024", commander: "Gonti, Canny Acquisitor" },
  // Bloomburrow
  { name: "Peace Offering",         set: "Bloomburrow", year: "2024", commander: "Gylwain, Casting Director" },
  { name: "Squirreled Away",        set: "Bloomburrow", year: "2024", commander: "Ygra, Eater of All" },
  { name: "Family Matters",         set: "Bloomburrow", year: "2024", commander: "Bello, Bard of the Brambles" },
  { name: "Animated Army",          set: "Bloomburrow", year: "2024", commander: "Gev, Scaled Scorch" },
  // Duskmourn: House of Horror
  { name: "Fear More Fears",        set: "Duskmourn: House of Horror", year: "2024", commander: "Ayara, Widow of the Realm" },
  { name: "Jump Scare",             set: "Duskmourn: House of Horror", year: "2024", commander: "Zimone, All-Questions Answered" },
  { name: "Enduring Victory",       set: "Duskmourn: House of Horror", year: "2024", commander: "Disa the Restless" },
  { name: "Coven Counters",         set: "Duskmourn: House of Horror", year: "2024", commander: "Mirko, Obsessive Theorist" },
  // Aetherdrift
  { name: "Cult Mechanix",          set: "Aetherdrift", year: "2025", commander: "Lurrus of the Dream-Den" },
  { name: "Full Speed Ahead",       set: "Aetherdrift", year: "2025", commander: "Atraxa, Praetors' Voice" },
  { name: "Glory Days",             set: "Aetherdrift", year: "2025", commander: "Jetmir, Nexus of Revels" },
  { name: "Sprint to the Finish",   set: "Aetherdrift", year: "2025", commander: "Kediss, Emberclaw Familiar" },
];

// ─── Types ───────────────────────────────────────────────────────────────────

type GameFormat = {
  key: string;
  labelDe: string;
  labelEn: string;
  icon: string;
  color: string;
  descDe: string;
  descEn: string;
};

const FORMATS: GameFormat[] = [
  { key: "modern",    labelDe: "Modern",    labelEn: "Modern",    icon: "time-outline",          color: "#7c3aed", descDe: "60 Karten · Ab 2003",      descEn: "60 cards · From 2003" },
  { key: "standard",  labelDe: "Standard",  labelEn: "Standard",  icon: "calendar-outline",      color: "#0ea5e9", descDe: "60 Karten · Aktuelle Sets", descEn: "60 cards · Current sets" },
  { key: "pioneer",   labelDe: "Pioneer",   labelEn: "Pioneer",   icon: "compass-outline",       color: "#f59e0b", descDe: "60 Karten · Ab 2012",      descEn: "60 cards · From 2012" },
  { key: "commander", labelDe: "Commander", labelEn: "Commander", icon: "shield-half-outline",   color: "#16a34a", descDe: "100 Karten · Multiplayer",  descEn: "100 cards · Multiplayer" },
  { key: "pauper",    labelDe: "Pauper",    labelEn: "Pauper",    icon: "cash-outline",          color: "#ef4444", descDe: "60 Karten · Nur Commons",   descEn: "60 cards · Commons only" },
];


// ─── Color symbols ───────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  W: "#f5f0dc", U: "#0e68ab", B: "#2c2c2c", R: "#d3202a", G: "#00733e",
};
const COLOR_TEXT: Record<string, string> = {
  W: "#1a1a1a", U: "#fff", B: "#e0e0e0", R: "#fff", G: "#fff",
};

// ─── PreconRow Component ──────────────────────────────────────────────────────

function PreconRow({ deck, isLast, colors, showEnglish }: {
  deck: { name: string; set: string; year: string; commander?: string };
  isLast: boolean;
  colors: ReturnType<typeof useColors>;
  showEnglish: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUri = deck.commander
    ? `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(deck.commander)}&format=image&version=small`
    : null;
  return (
    <View style={[styles.preconRow, { borderBottomColor: colors.border, borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth }]}>
      <View style={{ width: 44, height: 61, borderRadius: 4, overflow: "hidden", marginRight: 8, backgroundColor: "#16a34a22" }}>
        {imageUri && !imgFailed ? (
          <Image
            source={{ uri: imageUri }}
            style={{ width: 44, height: 61 }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={[styles.preconBadgeText, { color: "#16a34a" }]}>CMD</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.preconName, { color: colors.foreground }]} numberOfLines={1}>{deck.name}</Text>
        <Text style={[styles.preconSet, { color: colors.mutedForeground }]}>{deck.set} · {deck.year}</Text>
        {deck.commander && (
          <Text style={[styles.preconSet, { color: colors.mutedForeground, fontSize: 10 }]} numberOfLines={1}>{deck.commander}</Text>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <TouchableOpacity style={[styles.amazonSmallBtn, { borderColor: "#ff990066", backgroundColor: "#ff990022" }]}
          onPress={() => Linking.openURL(`https://www.amazon.de/s?k=${encodeURIComponent("Magic the Gathering " + deck.name + " Commander Deck")}&tag=masterofmtg-21`)}>
          <Text style={[styles.amazonSmallBtnText, { color: "#ff9900" }]}>DE</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.amazonSmallBtn, { borderColor: "#3b82f666", backgroundColor: "#3b82f622" }]}
          onPress={() => Linking.openURL(`https://www.amazon.com/s?k=${encodeURIComponent("Magic the Gathering " + deck.name + " Commander Deck")}&tag=mtg08d-20`)}>
          <Text style={[styles.amazonSmallBtnText, { color: "#3b82f6" }]}>COM</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
            {showEnglish ? card.name : (card.nameDe ?? card.name)}
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
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.modalOverlay, { backgroundColor: "#00000088" }]}>
        <View style={[styles.cardDetailModal, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cardDetailHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.cardDetailName, { color: colors.foreground }]} numberOfLines={1}>
              {showEnglish ? card.name : (card.nameDe ?? card.name)}
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
            {(card.oracle_text || card.oracle_text_de) ? (
              <Text style={[styles.cardDetailOracle, { color: colors.foreground }]}>
                {showEnglish ? card.oracle_text : (card.oracle_text_de || card.oracle_text)}
              </Text>
            ) : null}
            {/* Price + Cardmarket */}
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
            <TouchableOpacity
              style={[styles.cardmarketBtn, { backgroundColor: "#1da46218", borderColor: "#1da46244" }]}
              onPress={() => Linking.openURL(`https://www.cardmarket.com/de/Magic/Products/Search?searchString=${encodeURIComponent(card.name)}`)}
              activeOpacity={0.7}
            >
              <Ionicons name="cart-outline" size={16} color="#1da462" />
              <Text style={[styles.cardmarketBtnText, { color: "#1da462" }]}>
                {showEnglish ? "Buy on Cardmarket" : "Bei Cardmarket kaufen"}
              </Text>
              <Ionicons name="open-outline" size={14} color="#1da462" />
            </TouchableOpacity>
            {/* Amazon card — DE + COM row */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity
                style={[styles.cardmarketBtn, { flex: 1, backgroundColor: "#ff990018", borderColor: "#ff990044" }]}
                onPress={() => Linking.openURL(`https://www.amazon.de/s?k=${encodeURIComponent(card.name + " Magic the Gathering Karte")}&tag=masterofmtg-21`)}
                activeOpacity={0.7}
              >
                <Ionicons name="cart-outline" size={15} color="#ff9900" />
                <Text style={[styles.cardmarketBtnText, { color: "#ff9900" }]}>Amazon.de</Text>
                <Ionicons name="open-outline" size={13} color="#ff9900" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.cardmarketBtn, { flex: 1, backgroundColor: "#3b82f618", borderColor: "#3b82f644" }]}
                onPress={() => Linking.openURL(`https://www.amazon.com/s?k=${encodeURIComponent(card.name + " Magic the Gathering Card")}&tag=mtg08d-20`)}
                activeOpacity={0.7}
              >
                <Ionicons name="cart-outline" size={15} color="#3b82f6" />
                <Text style={[styles.cardmarketBtnText, { color: "#3b82f6" }]}>Amazon.com</Text>
                <Ionicons name="open-outline" size={13} color="#3b82f6" />
              </TouchableOpacity>
            </View>
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

  const [selectedFormat, setSelectedFormat] = useState<string>("modern");

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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showPreconSection, setShowPreconSection] = useState(false);

  // Load archetype list when format changes (synchronous — no network needed)
  useEffect(() => {
    setLoadingList(true);
    setListError(null);
    setSelectedKey(null);
    setSuggestion(null);
    try {
      setArchetypes(getArchetypeList(selectedFormat));
    } catch {
      setListError(showEnglish ? "Could not load archetypes." : "Archetypen konnten nicht geladen werden.");
    } finally {
      setLoadingList(false);
    }
  }, [selectedFormat, showEnglish]);

  // Load specific archetype deck (fetches card images from Scryfall)
  const loadSuggestion = useCallback(async (key: string) => {
    setSelectedKey(key);
    setSuggestion(null);
    setSuggestionError(null);
    setLoadingSuggestion(true);
    try {
      const data = await getDeckSuggestion(key, selectedFormat);
      if (!data) throw new Error("not found");
      setSuggestion(data);
      setLastUpdated(new Date());
    } catch {
      setSuggestionError(showEnglish ? "Deck could not be loaded." : "Deck konnte nicht geladen werden.");
    } finally {
      setLoadingSuggestion(false);
    }
  }, [showEnglish, selectedFormat]);

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
                  ? `${archetypes.length || "—"} archetypes for the selected format`
                  : `${archetypes.length || "—"} Archetypen für das gewählte Format`}
              </Text>
            </View>
            <LanguageToggle />
          </View>

          {/* Format Picker */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.formatScroll} contentContainerStyle={styles.formatRow}>
            {FORMATS.map((fmt) => {
              const active = selectedFormat === fmt.key;
              return (
                <TouchableOpacity
                  key={fmt.key}
                  style={[
                    styles.formatPill,
                    {
                      backgroundColor: active ? fmt.color : colors.card,
                      borderColor: active ? fmt.color : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedFormat(fmt.key)}
                  activeOpacity={0.75}
                >
                  <Ionicons name={fmt.icon as any} size={14} color={active ? "#fff" : fmt.color} />
                  <Text style={[styles.formatPillText, { color: active ? "#fff" : colors.foreground }]}>
                    {showEnglish ? fmt.labelEn : fmt.labelDe}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Format description */}
          {(() => {
            const fmt = FORMATS.find((f) => f.key === selectedFormat);
            if (!fmt) return null;
            return (
              <View style={[styles.formatDesc, { backgroundColor: fmt.color + "18", borderColor: fmt.color + "44" }]}>
                <Ionicons name={fmt.icon as any} size={14} color={fmt.color} />
                <Text style={[styles.formatDescText, { color: colors.mutedForeground }]}>
                  {showEnglish ? fmt.descEn : fmt.descDe}
                </Text>
              </View>
            );
          })()}

          {loadingList && (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          )}
          {listError && (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive + "44" }]}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{listError}</Text>
            </View>
          )}

          {/* ── Commander Fertigdecks kaufen ── */}
          <TouchableOpacity
            style={[styles.preconHeader, { backgroundColor: colors.card, borderColor: "#16a34a", borderWidth: 2 }]}
            onPress={() => setShowPreconSection(v => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.preconIconWrap, { backgroundColor: "#16a34a" }]}>
              <Ionicons name="cart-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.preconTitle, { color: "#16a34a" }]}>
                {showEnglish ? "Commander Precon Decks" : "Commander Fertigdecks"}
              </Text>
              <Text style={[styles.preconSubtitle, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? `${COMMANDER_PRECONS.length} official decks — buy on Amazon`
                  : `${COMMANDER_PRECONS.length} offizielle Decks — bei Amazon kaufen`}
              </Text>
            </View>
            <Ionicons name={showPreconSection ? "chevron-up" : "chevron-down"} size={18} color="#16a34a" />
          </TouchableOpacity>

          {showPreconSection && (
            <View style={[styles.preconList, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {COMMANDER_PRECONS.map((deck, i) => (
                <PreconRow
                  key={i}
                  deck={deck}
                  isLast={i === COMMANDER_PRECONS.length - 1}
                  colors={colors}
                  showEnglish={showEnglish}
                />
              ))}
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
        {/* Back + Refresh row */}
        <View style={styles.detailNavRow}>
          <TouchableOpacity
            style={[styles.backBtn, { borderColor: colors.border }]}
            onPress={() => { setSelectedKey(null); setSuggestion(null); setLastUpdated(null); }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.primary} />
            <Text style={[styles.backBtnText, { color: colors.primary }]}>
              {showEnglish ? "All Archetypes" : "Alle Archetypen"}
            </Text>
          </TouchableOpacity>
          {selectedKey && !loadingSuggestion && (
            <TouchableOpacity
              style={[styles.refreshBtn, { borderColor: colors.border }]}
              onPress={() => loadSuggestion(selectedKey)}
              activeOpacity={0.75}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.accent} />
              <Text style={[styles.refreshBtnText, { color: colors.accent }]}>
                {showEnglish ? "Update" : "Aktualisieren"}
              </Text>
            </TouchableOpacity>
          )}
          {selectedKey && loadingSuggestion && (
            <View style={[styles.refreshBtn, { borderColor: colors.border, opacity: 0.5 }]}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          )}
        </View>
        {lastUpdated && !loadingSuggestion && (
          <Text style={[styles.lastUpdatedText, { color: colors.mutedForeground }]}>
            {showEnglish
              ? `Last updated: ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : `Aktualisiert um ${lastUpdated.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr`}
          </Text>
        )}

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

            {/* Commander Card – prominently displayed for Commander format */}
            {suggestion.commanderCard && (
              <View style={[styles.commanderSection, { backgroundColor: "#0d1a0d", borderColor: "#16a34a77" }]}>
                <View style={styles.commanderHeader}>
                  <Ionicons name="shield-half-outline" size={18} color="#4ade80" />
                  <Text style={[styles.commanderTitle, { color: "#4ade80" }]}>
                    {showEnglish ? "Commander" : "Commander"}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.commanderCardRow}
                  onPress={() => { setDetailCard(suggestion.commanderCard!); setShowCardDetail(true); }}
                  activeOpacity={0.82}
                >
                  {suggestion.commanderCard.imageUri ? (
                    <Image
                      source={{ uri: suggestion.commanderCard.imageUri }}
                      style={styles.commanderImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.commanderImagePlaceholder, { backgroundColor: colors.secondary }]}>
                      <Ionicons name="shield-half-outline" size={36} color="#16a34a" />
                    </View>
                  )}
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={[styles.commanderName, { color: colors.foreground }]}>
                      {showEnglish ? suggestion.commanderCard.name : (suggestion.commanderCard.nameDe ?? suggestion.commanderCard.name)}
                    </Text>
                    <Text style={[styles.commanderType, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {suggestion.commanderCard.type_line}
                    </Text>
                    <Text style={[styles.commanderRole, { color: "#4ade80" }]} numberOfLines={3}>
                      {showEnglish ? suggestion.commanderCard.roleEn : suggestion.commanderCard.roleDe}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            )}

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
                  <TouchableOpacity
                    style={[styles.cardmarketDeckBtn, { backgroundColor: "#1da46218", borderColor: "#1da46244" }]}
                    onPress={() => {
                      const allCards = [...suggestion.deckCards, ...suggestion.landCards];
                      const names = allCards.map((c) => `${c.count}x ${c.name}`).join(" ");
                      Linking.openURL(`https://www.cardmarket.com/de/Magic/Products/Search?searchString=${encodeURIComponent(names.slice(0, 200))}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="cart-outline" size={16} color="#1da462" />
                    <Text style={[styles.cardmarketBtnText, { color: "#1da462" }]}>
                      {showEnglish ? "Buy whole deck on Cardmarket" : "Ganzes Deck bei Cardmarket kaufen"}
                    </Text>
                    <Ionicons name="open-outline" size={14} color="#1da462" />
                  </TouchableOpacity>
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

  preconHeader: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  preconIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  preconTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 2 },
  preconSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular" },
  preconList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  preconRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  preconBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, minWidth: 44, alignItems: "center" },
  preconBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  preconName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  preconSet: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  amazonSmallBtn: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, alignItems: "center", justifyContent: "center" },
  amazonSmallBtnText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4 },

  detailNavRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 2,
  },
  backBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  backBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  refreshBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  refreshBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  lastUpdatedText: {
    fontSize: 11, fontFamily: "Inter_400Regular",
    textAlign: "right", marginBottom: 4,
  },

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

  // Cardmarket buttons
  cardmarketBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 12, marginTop: 4, marginBottom: 12,
  },
  cardmarketDeckBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10,
    marginHorizontal: 12, marginTop: 4, marginBottom: 12,
  },
  cardmarketBtnText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },

  // Format picker
  formatScroll: { marginBottom: 4 },
  formatRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  formatPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 99, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  formatPillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  formatDesc: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 2,
  },
  formatDescText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },

  // Commander section
  commanderSection: {
    borderRadius: 16, borderWidth: 2,
    overflow: "hidden", marginBottom: 0,
  },
  commanderHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
  },
  commanderTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
  commanderCardRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingBottom: 14,
  },
  commanderImage: {
    width: 70, height: 98, borderRadius: 8,
    borderWidth: 2, borderColor: "#16a34a66",
  },
  commanderImagePlaceholder: {
    width: 70, height: 98, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  commanderName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  commanderType: { fontSize: 12, fontFamily: "Inter_400Regular" },
  commanderRole: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
