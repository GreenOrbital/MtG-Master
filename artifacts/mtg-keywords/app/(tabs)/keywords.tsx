import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FilterChip } from "@/components/FilterChip";
import { KeywordCard } from "@/components/KeywordCard";
import { LanguageToggle } from "@/components/LanguageToggle";
import { SearchBar } from "@/components/SearchBar";
import { useSettings } from "@/context/SettingsContext";
import { CATEGORIES, CATEGORIES_EN, MTG_KEYWORDS, type MtgKeyword } from "@/data/keywords";
import { useColors } from "@/hooks/useColors";

const CATEGORY_OPTIONS = [
  { key: "all", labelDe: "Alle", labelEn: "All" },
  { key: "keyword_ability", labelDe: "Fähigkeiten", labelEn: "Abilities" },
  { key: "keyword_action", labelDe: "Aktionen", labelEn: "Actions" },
  { key: "ability_word", labelDe: "Fähigkeitswörter", labelEn: "Ability Words" },
];

export default function KeywordsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return MTG_KEYWORDS.filter((kw) => {
      const matchCategory = category === "all" || kw.category === category;
      if (!matchCategory) return false;
      if (!q) return true;
      return (
        kw.name.toLowerCase().includes(q) ||
        kw.nameEn.toLowerCase().includes(q) ||
        kw.shortDe.toLowerCase().includes(q) ||
        kw.shortEn.toLowerCase().includes(q)
      );
    });
  }, [search, category]);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  function renderItem({ item }: { item: MtgKeyword }) {
    return (
      <KeywordCard
        keyword={item}
        showEnglish={showEnglish}
        expanded={expandedId === item.id}
        onPress={() => toggleExpand(item.id)}
      />
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { color: colors.foreground }]}>Schlüsselwörter</Text>
          <LanguageToggle showEnglish={showEnglish} onToggle={() => setShowEnglish(!showEnglish)} />
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {filtered.length} {showEnglish ? "keywords" : "Schlüsselwörter"}
        </Text>
        <View style={styles.searchRow}>
          <SearchBar
            value={search}
            onChangeText={setSearch}
            placeholder={showEnglish ? "Search keywords..." : "Schlüsselwörter suchen..."}
          />
        </View>
        <FlatList
          horizontal
          data={CATEGORY_OPTIONS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <FilterChip
              label={showEnglish ? item.labelEn : item.labelDe}
              active={category === item.key}
              onPress={() => setCategory(item.key)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipList}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {showEnglish ? "No keywords found" : "Keine Schlüsselwörter gefunden"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  searchRow: {
    marginBottom: 10,
  },
  chipList: {
    gap: 8,
    paddingBottom: 2,
  },
  list: {
    padding: 16,
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
});
