import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { RULES_CATEGORIES, RULES_QA, type RulesQA, type Verdict } from "@/data/rulesQA";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Verdict badge ────────────────────────────────────────────────────────────

function VerdictBadge({ verdict, showEnglish }: { verdict: Verdict; showEnglish: boolean }) {
  const config: Record<Verdict, { labelDe: string; labelEn: string; bg: string; fg: string }> = {
    ja: { labelDe: "Ja", labelEn: "Yes", bg: "#1a3a1a", fg: "#4caf50" },
    nein: { labelDe: "Nein", labelEn: "No", bg: "#3a1a1a", fg: "#ef5350" },
    kommt_an: { labelDe: "Kommt an", labelEn: "Depends", bg: "#3a2a0a", fg: "#ffa726" },
  };
  const c = config[verdict];
  return (
    <View style={[styles.verdictBadge, { backgroundColor: c.bg }]}>
      <Text style={[styles.verdictText, { color: c.fg }]}>
        {showEnglish ? c.labelEn : c.labelDe}
      </Text>
    </View>
  );
}

// ─── Single Q&A card ─────────────────────────────────────────────────────────

function QACard({ item, showEnglish }: { item: RulesQA; showEnglish: boolean }) {
  const colors = useColors();
  const [open, setOpen] = useState(false);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  }

  const question = showEnglish ? item.questionEn : item.questionDe;
  const answer = showEnglish ? item.answerEn : item.answerDe;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: open ? colors.primary + "55" : colors.border }]}
      onPress={toggle}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          {item.verdict && <VerdictBadge verdict={item.verdict} showEnglish={showEnglish} />}
          <Text style={[styles.question, { color: colors.foreground, flex: 1 }]}>{question}</Text>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.mutedForeground}
          style={{ marginLeft: 6 }}
        />
      </View>
      {open && (
        <View style={[styles.answerBox, { borderTopColor: colors.border }]}>
          <Text style={[styles.answer, { color: colors.mutedForeground }]}>{answer}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function RulesScreen() {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return RULES_QA.filter((item) => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (!q) return true;
      return (
        item.questionDe.toLowerCase().includes(q) ||
        item.questionEn.toLowerCase().includes(q) ||
        item.answerDe.toLowerCase().includes(q) ||
        item.answerEn.toLowerCase().includes(q) ||
        item.tags.some((t) => t.includes(q))
      );
    });
  }, [search, activeCategory]);

  const categoryEntries = Object.entries(RULES_CATEGORIES);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {showEnglish ? "Rules FAQ" : "Regelwerk FAQ"}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {showEnglish
            ? "Common rules questions, answered"
            : "Häufige Regelfragen, beantwortet"}
        </Text>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder={showEnglish ? "Search rules..." : "Regeln suchen…"}
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryChip,
            {
              backgroundColor: activeCategory === null ? colors.primary + "22" : colors.card,
              borderColor: activeCategory === null ? colors.primary + "55" : colors.border,
            },
          ]}
          onPress={() => setActiveCategory(null)}
        >
          <Text style={[styles.categoryChipText, { color: activeCategory === null ? colors.primary : colors.mutedForeground }]}>
            {showEnglish ? "All" : "Alle"}
          </Text>
        </TouchableOpacity>
        {categoryEntries.map(([key, cat]) => {
          const active = activeCategory === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: active ? colors.primary + "22" : colors.card,
                  borderColor: active ? colors.primary + "55" : colors.border,
                },
              ]}
              onPress={() => setActiveCategory(active ? null : key)}
            >
              <Ionicons
                name={cat.icon as any}
                size={12}
                color={active ? colors.primary : colors.mutedForeground}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.categoryChipText, { color: active ? colors.primary : colors.mutedForeground }]}>
                {showEnglish ? cat.en : cat.de}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results count */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: colors.mutedForeground }]}>
          {filtered.length} {showEnglish ? "questions" : "Fragen"}
        </Text>
      </View>

      {/* Q&A list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="help-circle-outline" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {showEnglish ? "No results" : "Keine Ergebnisse"}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              {showEnglish ? "Try different keywords" : "Andere Suchbegriffe probieren"}
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <QACard key={item.id} item={item} showEnglish={showEnglish} />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  categoryScroll: { flexGrow: 0 },
  categoryContent: {
    paddingHorizontal: 12,
    gap: 6,
    paddingBottom: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  countRow: { paddingHorizontal: 16, paddingBottom: 6 },
  countText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 12, gap: 8 },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  cardHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    flexWrap: "nowrap",
  },
  question: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  answerBox: {
    padding: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  answer: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  verdictBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 1,
    flexShrink: 0,
  },
  verdictText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  emptyState: { alignItems: "center", paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptySubtitle: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
