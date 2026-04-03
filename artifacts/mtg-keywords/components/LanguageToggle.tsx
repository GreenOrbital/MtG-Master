import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  showEnglish: boolean;
  onToggle: () => void;
};

export function LanguageToggle({ showEnglish, onToggle }: Props) {
  const colors = useColors();

  return (
    <TouchableOpacity
      onPress={onToggle}
      style={[styles.container, { backgroundColor: colors.secondary, borderColor: colors.border }]}
    >
      <View
        style={[
          styles.option,
          !showEnglish && { backgroundColor: colors.primary, borderRadius: 8 },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: !showEnglish ? colors.primaryForeground : colors.mutedForeground },
          ]}
        >
          DE
        </Text>
      </View>
      <View
        style={[
          styles.option,
          showEnglish && { backgroundColor: colors.primary, borderRadius: 8 },
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: showEnglish ? colors.primaryForeground : colors.mutedForeground },
          ]}
        >
          EN
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 3,
    gap: 2,
  },
  option: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
});
