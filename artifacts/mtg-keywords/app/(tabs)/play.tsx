import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MatchupSimulator } from "@/components/play/MatchupSimulator";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AdBanner } from "@/components/AdBanner";

// Approximate space for the bottom tab bar; iOS/Android both render ~80 px tall.
const TAB_BAR_PAD = 88;

export default function PlayScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { showEnglish } = useSettings();
  const t = (de: string, en: string) => (showEnglish ? en : de);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_PAD + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {t("Spielmodus", "Play mode")}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {t(
                "Lass dein Deck gegen das Deck eines Freundes antreten und schau, wie es ausgehen würde.",
                "Pit your deck against a friend's and see how it would play out.",
              )}
            </Text>
          </View>
          <LanguageToggle />
        </View>

        <MatchupSimulator />

        <View style={{ marginTop: 16 }}>
          <AdBanner />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },
});
