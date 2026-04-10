import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

export function AdBanner() {
  const colors = useColors();
  const { showEnglish } = useSettings();

  return (
    <View style={[styles.banner, { borderColor: colors.primary + "50", backgroundColor: colors.card }]}>
      <Ionicons name="megaphone-outline" size={14} color={colors.primary} style={{ opacity: 0.6 }} />
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        {showEnglish ? "Advertisement" : "Werbung"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 10,
    minHeight: 44,
  },
  text: {
    fontSize: 12,
    letterSpacing: 0.5,
    opacity: 0.7,
  },
});
