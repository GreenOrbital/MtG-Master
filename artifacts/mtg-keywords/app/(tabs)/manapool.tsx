import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
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

type DeckPreset = {
  id: string;
  name: string;
  lands: LandCounts;
  savedAt: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const LAND_CONFIG = [
  { key: "W" as const, nameDe: "Ebene",  nameEn: "Plains",   hex: "#f5f0dc", text: "#1a1a1a", symbol: "W" },
  { key: "U" as const, nameDe: "Insel",  nameEn: "Island",   hex: "#0e68ab", text: "#ffffff", symbol: "U" },
  { key: "B" as const, nameDe: "Sumpf",  nameEn: "Swamp",    hex: "#2c2c2c", text: "#e0e0e0", symbol: "B" },
  { key: "R" as const, nameDe: "Berg",   nameEn: "Mountain", hex: "#d3202a", text: "#ffffff", symbol: "R" },
  { key: "G" as const, nameDe: "Wald",   nameEn: "Forest",   hex: "#00733e", text: "#ffffff", symbol: "G" },
];

const STORAGE_KEY = "mtg_deck_presets";
const EMPTY_LANDS: LandCounts = { W: 0, U: 0, B: 0, R: 0, G: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

export default function ManapoolScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();

  const [lands, setLands] = useState<LandCounts>({ ...EMPTY_LANDS });
  const [deckName, setDeckName] = useState("");
  const [presets, setPresets] = useState<DeckPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v) setPresets(JSON.parse(v));
    });
  }, []);

  function savePresetsToStorage(p: DeckPreset[]) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(p));
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

  function savePreset() {
    const name = deckName.trim() || (showEnglish ? "My Deck" : "Mein Deck");
    const preset: DeckPreset = {
      id: Date.now().toString(),
      name,
      lands: { ...lands },
      savedAt: Date.now(),
    };
    const next = [preset, ...presets];
    setPresets(next);
    savePresetsToStorage(next);
    setActivePresetId(preset.id);
    setDeckName("");
  }

  function loadPreset(p: DeckPreset) {
    setLands({ ...p.lands });
    setDeckName(p.name);
    setActivePresetId(p.id);
  }

  function deletePreset(id: string) {
    const next = presets.filter((p) => p.id !== id);
    setPresets(next);
    savePresetsToStorage(next);
    if (activePresetId === id) setActivePresetId(null);
  }

  function clearAll() {
    setLands({ ...EMPTY_LANDS });
    setDeckName("");
    setActivePresetId(null);
  }

  const total = Object.values(lands).reduce((a, b) => a + b, 0);
  const hasAny = total > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {showEnglish ? "Mana Pool" : "Manapool"}
          </Text>
          <LanguageToggle showEnglish={showEnglish} onToggle={() => setShowEnglish(!showEnglish)} />
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {showEnglish
            ? "Enter your lands to calculate your mana pool"
            : "Länder eingeben und gesamten Manapool berechnen"}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Deck Name Input ── */}
        <View style={[styles.nameBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="albums-outline" size={17} color={colors.mutedForeground} />
          <TextInput
            value={deckName}
            onChangeText={setDeckName}
            placeholder={showEnglish ? "Deck name (optional)…" : "Deckname (optional)…"}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.nameInput, { color: colors.foreground }]}
            autoCorrect={false}
          />
          {deckName.length > 0 && (
            <TouchableOpacity onPress={() => setDeckName("")}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Land Steppers ── */}
        <View style={[styles.landBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {LAND_CONFIG.map((lc, i) => {
            const count = lands[lc.key];
            const pct = total > 0 ? count / total : 0;
            return (
              <View
                key={lc.key}
                style={[
                  styles.landRow,
                  i < LAND_CONFIG.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                {/* Color indicator */}
                <View style={[styles.colorDot, { backgroundColor: lc.hex }]}>
                  <Text style={[styles.colorDotText, { color: lc.text }]}>{lc.symbol}</Text>
                </View>

                {/* Land name */}
                <View style={styles.landNameCol}>
                  <Text style={[styles.landName, { color: colors.foreground }]}>
                    {showEnglish ? lc.nameEn : lc.nameDe}
                  </Text>
                  <Text style={[styles.landSub, { color: colors.mutedForeground }]}>
                    {showEnglish ? lc.nameDe : lc.nameEn} · {lc.symbol}
                  </Text>
                </View>

                {/* Stepper */}
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => adjustLand(lc.key, -1)}
                  >
                    <Ionicons name="remove" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.stepValue, { color: colors.foreground, borderColor: colors.border }]}
                    value={String(count)}
                    onChangeText={(v) => setLandDirect(lc.key, v)}
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                    onPress={() => adjustLand(lc.key, 1)}
                  >
                    <Ionicons name="add" size={18} color={colors.foreground} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Mana Pool Visualization ── */}
        {hasAny && (
          <View style={[styles.poolBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.poolHeaderRow}>
              <Text style={[styles.poolTitle, { color: colors.foreground }]}>
                {showEnglish ? "Mana Pool" : "Gesamter Manapool"}
              </Text>
              <View style={[styles.totalBadge, { backgroundColor: colors.primary }]}>
                <Text style={[styles.totalBadgeText, { color: "#fff" }]}>{total}</Text>
              </View>
            </View>

            {/* Color bar */}
            <View style={styles.colorBar}>
              {LAND_CONFIG.filter((lc) => lands[lc.key] > 0).map((lc) => (
                <View
                  key={lc.key}
                  style={[
                    styles.colorBarSegment,
                    { backgroundColor: lc.hex, flex: lands[lc.key] },
                  ]}
                />
              ))}
            </View>

            {/* Mana breakdown */}
            <View style={styles.breakdown}>
              {LAND_CONFIG.filter((lc) => lands[lc.key] > 0).map((lc) => {
                const count = lands[lc.key];
                const pct = Math.round((count / total) * 100);
                return (
                  <View key={lc.key} style={styles.breakdownRow}>
                    <View style={[styles.breakdownDot, { backgroundColor: lc.hex }]} />
                    <Text style={[styles.breakdownLabel, { color: colors.foreground }]}>
                      {showEnglish ? lc.nameEn : lc.nameDe}
                    </Text>
                    <Text style={[styles.breakdownCount, { color: colors.primary }]}>
                      {count} {lc.symbol}
                    </Text>
                    <Text style={[styles.breakdownPct, { color: colors.mutedForeground }]}>
                      {pct}%
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Mana tip */}
            <View style={[styles.tipRow, { borderTopColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={14} color={colors.mutedForeground} />
              <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? `${total} lands → up to ${total} mana per turn in late game`
                  : `${total} Länder → bis zu ${total} Mana pro Runde im Spätstadium`}
              </Text>
            </View>
          </View>
        )}

        {/* ── Save Button ── */}
        <View style={styles.saveRow}>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: hasAny ? 1 : 0.5 }]}
            onPress={savePreset}
            disabled={!hasAny}
          >
            <Ionicons name="save-outline" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>
              {showEnglish ? "Save Deck" : "Deck speichern"}
            </Text>
          </TouchableOpacity>
          {hasAny && (
            <TouchableOpacity
              style={[styles.clearBtn, { borderColor: colors.border }]}
              onPress={clearAll}
            >
              <Text style={[styles.clearBtnText, { color: colors.mutedForeground }]}>
                {showEnglish ? "Reset" : "Zurücksetzen"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Saved Presets ── */}
        {presets.length > 0 && (
          <View style={styles.presetsSection}>
            <Text style={[styles.presetsTitle, { color: colors.foreground }]}>
              {showEnglish ? "Saved Decks" : "Gespeicherte Decks"}
            </Text>
            {presets.map((p) => {
              const pTotal = Object.values(p.lands).reduce((a, b) => a + b, 0);
              const isActive = p.id === activePresetId;
              return (
                <View
                  key={p.id}
                  style={[
                    styles.presetCard,
                    {
                      backgroundColor: isActive ? colors.primary + "18" : colors.card,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <TouchableOpacity style={styles.presetMain} onPress={() => loadPreset(p)}>
                    <View style={styles.presetHeader}>
                      <Text style={[styles.presetName, { color: colors.foreground }]}>
                        {p.name}
                      </Text>
                      <Text style={[styles.presetTotal, { color: colors.mutedForeground }]}>
                        {pTotal} {showEnglish ? "lands" : "Länder"}
                      </Text>
                    </View>

                    {/* Mini color bar */}
                    <View style={styles.miniBar}>
                      {LAND_CONFIG.filter((lc) => p.lands[lc.key] > 0).map((lc) => (
                        <View key={lc.key} style={[styles.miniBarSegment, { backgroundColor: lc.hex, flex: p.lands[lc.key] }]} />
                      ))}
                    </View>

                    {/* Land counts */}
                    <View style={styles.presetCounts}>
                      {LAND_CONFIG.filter((lc) => p.lands[lc.key] > 0).map((lc) => (
                        <View key={lc.key} style={[styles.presetCountBadge, { backgroundColor: lc.hex }]}>
                          <Text style={[styles.presetCountText, { color: lc.text }]}>
                            {p.lands[lc.key]}{lc.symbol}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() =>
                      Alert.alert(
                        showEnglish ? "Delete Deck" : "Deck löschen",
                        showEnglish ? `Delete "${p.name}"?` : `"${p.name}" löschen?`,
                        [
                          { text: showEnglish ? "Cancel" : "Abbrechen", style: "cancel" },
                          { text: showEnglish ? "Delete" : "Löschen", style: "destructive", onPress: () => deletePreset(p.id) },
                        ]
                      )
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Empty hint ── */}
        {!hasAny && presets.length === 0 && (
          <View style={styles.emptyHint}>
            <Ionicons name="water-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {showEnglish ? "Enter your lands above" : "Länder oben eingeben"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {showEnglish
                ? "Each land type produces 1 mana of its color per turn. Use + and − to set your deck's land counts."
                : "Jedes Land produziert 1 Mana seiner Farbe pro Runde. Verwende + und − um die Länder deines Decks einzugeben."}
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
  nameBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10,
  },
  nameInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", padding: 0 },
  landBox: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  landRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  colorDotText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  landNameCol: { flex: 1 },
  landName: { fontSize: 15, fontFamily: "Inter_500Medium" },
  landSub: { fontSize: 11, fontFamily: "Inter_400Regular" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepBtn: {
    width: 34, height: 34, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  stepValue: {
    width: 40, height: 34, borderRadius: 8, borderWidth: 1,
    textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold",
  },
  poolBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  poolHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  poolTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  totalBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  totalBadgeText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  colorBar: { height: 20, borderRadius: 10, flexDirection: "row", overflow: "hidden" },
  colorBarSegment: {},
  breakdown: { gap: 6 },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  breakdownDot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  breakdownCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  breakdownPct: { fontSize: 13, fontFamily: "Inter_400Regular", width: 38, textAlign: "right" },
  tipRow: { borderTopWidth: 1, paddingTop: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  tipText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 16 },
  saveRow: { flexDirection: "row", gap: 10 },
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 13 },
  saveBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  clearBtn: { paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, justifyContent: "center" },
  clearBtnText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  presetsSection: { gap: 10 },
  presetsTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  presetCard: { borderRadius: 14, borderWidth: 1, flexDirection: "row", overflow: "hidden" },
  presetMain: { flex: 1, padding: 12, gap: 8 },
  presetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  presetName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  presetTotal: { fontSize: 13, fontFamily: "Inter_400Regular" },
  miniBar: { height: 8, borderRadius: 4, flexDirection: "row", overflow: "hidden" },
  miniBarSegment: {},
  presetCounts: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  presetCountBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  presetCountText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  deleteBtn: { padding: 14, justifyContent: "center" },
  emptyHint: { alignItems: "center", paddingTop: 30, gap: 12, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
