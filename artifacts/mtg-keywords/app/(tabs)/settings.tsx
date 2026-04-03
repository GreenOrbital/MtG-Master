import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettings } from "@/context/SettingsContext";
import { MTG_KEYWORDS } from "@/data/keywords";
import { useColors } from "@/hooks/useColors";

function SettingRow({
  label,
  subtitle,
  right,
}: {
  label: string;
  subtitle?: string;
  right: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  const abilityCount = MTG_KEYWORDS.filter((k) => k.category === "keyword_ability").length;
  const actionCount = MTG_KEYWORDS.filter((k) => k.category === "keyword_action").length;
  const wordCount = MTG_KEYWORDS.filter((k) => k.category === "ability_word").length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingBottom: bottomPad }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {showEnglish ? "Settings" : "Einstellungen"}
        </Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {showEnglish ? "LANGUAGE" : "SPRACHE"}
        </Text>
        <SettingRow
          label={showEnglish ? "English Explanations" : "Englische Erklärungen"}
          subtitle={
            showEnglish
              ? "Show keywords and explanations in English"
              : "Schlüsselwörter und Erklärungen auf Englisch"
          }
          right={
            <Switch
              value={showEnglish}
              onValueChange={setShowEnglish}
              trackColor={{ false: colors.muted, true: colors.primary }}
              thumbColor={colors.card}
            />
          }
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {showEnglish ? "DATABASE" : "DATENBANK"}
        </Text>
        <SettingRow
          label={showEnglish ? "Total Keywords" : "Schlüsselwörter gesamt"}
          right={
            <Text style={[styles.statValue, { color: colors.primary }]}>{MTG_KEYWORDS.length}</Text>
          }
        />
        <SettingRow
          label={showEnglish ? "Keyword Abilities" : "Schlüsselwort-Fähigkeiten"}
          right={<Text style={[styles.statValue, { color: colors.mutedForeground }]}>{abilityCount}</Text>}
        />
        <SettingRow
          label={showEnglish ? "Keyword Actions" : "Schlüsselwort-Aktionen"}
          right={<Text style={[styles.statValue, { color: colors.mutedForeground }]}>{actionCount}</Text>}
        />
        <SettingRow
          label={showEnglish ? "Ability Words" : "Fähigkeitswörter"}
          right={<Text style={[styles.statValue, { color: colors.mutedForeground }]}>{wordCount}</Text>}
        />
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {showEnglish ? "ABOUT" : "INFO"}
        </Text>
        <SettingRow
          label={showEnglish ? "Data Source" : "Datenquelle"}
          subtitle="Scryfall API / MTG Comprehensive Rules"
          right={
            <TouchableOpacity onPress={() => Linking.openURL("https://scryfall.com")}>
              <Ionicons name="open-outline" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          }
        />
        <SettingRow
          label={showEnglish ? "App Version" : "App-Version"}
          right={
            <Text style={[styles.statValue, { color: colors.mutedForeground }]}>1.0.0</Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
