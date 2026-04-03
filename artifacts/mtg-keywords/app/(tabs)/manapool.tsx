import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
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
import { type Deck, type DeckCard, useDecks } from "@/context/DeckContext";
import { useSettings } from "@/context/SettingsContext";
import { useColors } from "@/hooks/useColors";

// ─── Constants ───────────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = { W: "#f5f0dc", U: "#0e68ab", B: "#2c2c2c", R: "#d3202a", G: "#00733e" };
const COLOR_TEXT: Record<string, string> = { W: "#1a1a1a", U: "#fff", B: "#e0e0e0", R: "#fff", G: "#fff" };
const COLORS = ["W", "U", "B", "R", "G"] as const;

type ManaCounts = { W: number; U: number; B: number; R: number; G: number; generic: number; cmc: number };

function isLand(card: DeckCard) {
  return !!card.type_line?.toLowerCase().includes("land");
}

// Derive what colors a land produces from produced_mana or type_line
function landColors(card: DeckCard): string[] {
  if (card.produced_mana && card.produced_mana.length > 0) {
    return card.produced_mana.filter((c) => COLORS.includes(c as typeof COLORS[number]));
  }
  // Fallback: parse from type_line subtype
  const tl = (card.type_line ?? "").toLowerCase();
  const derived: string[] = [];
  if (tl.includes("plains"))   derived.push("W");
  if (tl.includes("island"))   derived.push("U");
  if (tl.includes("swamp"))    derived.push("B");
  if (tl.includes("mountain")) derived.push("R");
  if (tl.includes("forest"))   derived.push("G");
  return derived;
}

// Compute available colored mana from land cards in the deck
function computeLandMana(cards: DeckCard[]): Record<string, number> {
  const avail: Record<string, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (const c of cards) {
    if (!isLand(c)) continue;
    const cols = landColors(c);
    for (const col of cols) {
      avail[col] = (avail[col] ?? 0) + c.count;
    }
  }
  return avail;
}

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

function sumMana(cards: Deck["cards"]): ManaCounts {
  const total: ManaCounts = { W: 0, U: 0, B: 0, R: 0, G: 0, generic: 0, cmc: 0 };
  for (const c of cards) {
    if (!c.mana_cost || isLand(c)) continue;
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
  const { decks, createDeck, updateDeck, deleteDeck, removeCardFromDeck, adjustCardCount } = useDecks();

  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  const activeDeck = decks.find((d) => d.id === activeDeckId) ?? null;

  function openDeck(deck: Deck) {
    setActiveDeckId(deck.id);
    setEditName(deck.name);
  }

  function closeDeck() {
    setActiveDeckId(null);
    setEditName("");
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
            <TouchableOpacity
              style={[styles.newDeckBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowNewDeckModal(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" />
              <Text style={styles.newDeckBtnText}>
                {showEnglish ? "New Deck" : "Neues Deck"}
              </Text>
            </TouchableOpacity>

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
                const landCards = deck.cards.filter(isLand);
                const landTotal = landCards.reduce((a, c) => a + c.count, 0);
                const spellTotal = deck.cards.filter((c) => !isLand(c)).reduce((a, c) => a + c.count, 0);
                const availMana = computeLandMana(deck.cards);
                const hasColors = COLORS.some((k) => availMana[k] > 0);
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
                          {landTotal} {showEnglish ? "lands" : "Länder"} · {spellTotal} {showEnglish ? "spells" : "Spells"}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                    </View>
                    {hasColors && (
                      <View style={styles.miniBar}>
                        {COLORS.filter((k) => availMana[k] > 0).map((k) => (
                          <View key={k} style={[styles.miniBarSeg, { backgroundColor: COLOR_HEX[k], flex: availMana[k] }]} />
                        ))}
                      </View>
                    )}
                    {hasColors && (
                      <View style={styles.colorChips}>
                        {COLORS.filter((k) => availMana[k] > 0).map((k) => (
                          <View key={k} style={[styles.colorChipSm, { backgroundColor: COLOR_HEX[k] }]}>
                            <Text style={[styles.colorChipSmText, { color: COLOR_TEXT[k] }]}>{availMana[k]}{k}</Text>
                          </View>
                        ))}
                      </View>
                    )}
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

            {/* ── Karten ── */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {showEnglish
                ? `Cards (${activeDeck.cards.reduce((a,c)=>a+c.count,0)})`
                : `Karten (${activeDeck.cards.reduce((a,c)=>a+c.count,0)})`}
            </Text>

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
                {activeDeck.cards.map((c, i) => {
                  const land = isLand(c);
                  const mana = c.mana_cost ? parseMana(c.mana_cost) : null;
                  const cols = mana ? COLORS.filter((k) => mana[k] > 0) : [];
                  const lCols = land ? landColors(c) : [];
                  return (
                    <View key={c.id} style={[styles.cardRow,
                      i < activeDeck.cards.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                      <View style={styles.cardRowLeft}>
                        <Text style={[styles.cardRowName, { color: colors.foreground }]} numberOfLines={1}>
                          {c.printed_name ?? c.name}
                        </Text>
                        <View style={styles.cardRowMeta}>
                          {land ? (
                            <>
                              <Text style={[styles.cardRowMana, { color: colors.mutedForeground }]}>
                                {showEnglish ? "Land" : "Land"}
                              </Text>
                              {lCols.map((cl) => (
                                <View key={cl} style={[styles.colorDotTiny, { backgroundColor: COLOR_HEX[cl] }]}>
                                  <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT[cl] }]}>{cl}</Text>
                                </View>
                              ))}
                            </>
                          ) : (
                            <>
                              {c.mana_cost ? <Text style={[styles.cardRowMana, { color: colors.mutedForeground }]}>{c.mana_cost}</Text> : null}
                              {cols.map((cl) => (
                                <View key={cl} style={[styles.colorDotTiny, { backgroundColor: COLOR_HEX[cl] }]}>
                                  <Text style={[styles.colorDotTinyText, { color: COLOR_TEXT[cl] }]}>{cl}</Text>
                                </View>
                              ))}
                            </>
                          )}
                        </View>
                      </View>
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

            {/* ── Manapool-Analyse ── */}
            {(() => {
              const availMana = computeLandMana(activeDeck.cards);
              const landTotal = activeDeck.cards.filter(isLand).reduce((a, c) => a + c.count, 0);
              const required = sumMana(activeDeck.cards);
              if (landTotal === 0 && required.cmc === 0) return null;
              const hasColors = COLORS.some((k) => availMana[k] > 0);
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
                          {COLORS.filter((k) => availMana[k] > 0).map((k) => (
                            <View key={k} style={[styles.colorBarSeg, { backgroundColor: COLOR_HEX[k], flex: availMana[k] }]} />
                          ))}
                        </View>
                        <View style={styles.colorChips}>
                          {COLORS.filter((k) => availMana[k] > 0).map((k) => (
                            <View key={k} style={[styles.colorChipSm, { backgroundColor: COLOR_HEX[k] }]}>
                              <Text style={[styles.colorChipSmText, { color: COLOR_TEXT[k] }]}>{availMana[k]}{k}</Text>
                            </View>
                          ))}
                        </View>
                      </>
                    )}

                    {required.cmc > 0 && (
                      <>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <View style={styles.analysisRow}>
                          <Ionicons name="flash" size={15} color="#f59e0b" />
                          <Text style={[styles.analysisLabel, { color: colors.foreground }]}>
                            {showEnglish ? "Required (spells)" : "Benötigt (Spells)"}
                          </Text>
                          <Text style={[styles.analysisValue, { color: "#f59e0b" }]}>{required.cmc}</Text>
                        </View>
                        <View style={styles.colorChips}>
                          {COLORS.filter((k) => required[k] > 0).map((k) => (
                            <View key={k} style={[styles.colorChipSm, { backgroundColor: COLOR_HEX[k] }]}>
                              <Text style={[styles.colorChipSmText, { color: COLOR_TEXT[k] }]}>{required[k]}{k}</Text>
                            </View>
                          ))}
                          {required.generic > 0 && (
                            <View style={[styles.colorChipSm, { backgroundColor: colors.secondary }]}>
                              <Text style={[styles.colorChipSmText, { color: colors.secondaryForeground }]}>{required.generic}◇</Text>
                            </View>
                          )}
                        </View>

                        {/* Coverage — only show if we have color info */}
                        {hasColors && (
                          <>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            {COLORS.map((k) => {
                              const have = availMana[k] ?? 0;
                              const need = required[k];
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
                                    {have}/{need} {ok ? "✓" : `−${need-have}`}
                                  </Text>
                                </View>
                              );
                            })}

                            {/* Verdict */}
                            {(() => {
                              const lacking = COLORS.filter((k) => required[k] > 0 && (availMana[k] ?? 0) < required[k]);
                              if (lacking.length === 0) {
                                return (
                                  <View style={[styles.verdict, { backgroundColor: "#16a34a22", borderColor: "#16a34a" }]}>
                                    <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                                    <Text style={[styles.verdictText, { color: "#16a34a" }]}>
                                      {showEnglish ? "Mana pool covers all costs!" : "Manapool deckt alle Kosten!"}
                                    </Text>
                                  </View>
                                );
                              }
                              return (
                                <View style={[styles.verdict, { backgroundColor: "#dc262622", borderColor: "#dc2626" }]}>
                                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                                  <Text style={[styles.verdictText, { color: "#dc2626" }]}>
                                    {showEnglish ? `Need more ${lacking.join("/")} sources` : `Mehr ${lacking.join("/")} Quellen nötig`}
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
                            if (!c.mana_cost || isLand(c)) continue;
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
                    )}
                  </View>
                </>
              );
            })()}

            {/* ── Delete Deck ── */}
            <TouchableOpacity style={[styles.deleteDeckBtn, { borderColor: colors.destructive }]}
              onPress={() => Alert.alert(
                showEnglish ? "Delete deck?" : "Deck löschen?",
                `"${activeDeck.name}"`,
                [
                  { text: showEnglish ? "Cancel" : "Abbrechen", style: "cancel" },
                  { text: showEnglish ? "Delete" : "Löschen", style: "destructive",
                    onPress: () => { deleteDeck(activeDeck.id); closeDeck(); } },
                ]
              )}>
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
              <Text style={[styles.deleteDeckText, { color: colors.destructive }]}>
                {showEnglish ? "Delete Deck" : "Deck löschen"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

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
  cardList: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  cardRowLeft: { flex: 1 },
  cardRowName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  cardRowMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  cardRowMana: { fontSize: 11, fontFamily: "Inter_400Regular" },
  colorDotTiny: { width: 17, height: 17, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  colorDotTinyText: { fontSize: 8, fontFamily: "Inter_700Bold" },
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
  modalOverlay: { flex: 1, backgroundColor: "#00000080", justifyContent: "center", alignItems: "center", padding: 24 },
  modalSheet: { borderRadius: 16, padding: 20, width: "100%", gap: 14 },
  modalTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modalInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, fontFamily: "Inter_400Regular" },
  modalCreateBtn: { borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  modalCreateBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
