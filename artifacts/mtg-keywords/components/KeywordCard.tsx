import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

import { CATEGORIES, CATEGORIES_EN, type MtgKeyword } from "@/data/keywords";
import { useColors } from "@/hooks/useColors";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = {
  keyword: MtgKeyword;
  showEnglish: boolean;
  expanded?: boolean;
  onPress?: () => void;
};

const COLOR_MAP: Record<string, string> = {
  white: "#F8E7A0",
  blue: "#7EC8E3",
  black: "#B0A0C8",
  red: "#F4915B",
  green: "#7DC99E",
  all: "#D4A017",
};

export function KeywordCard({ keyword, showEnglish, expanded, onPress }: Props) {
  const colors = useColors();

  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { damping: 15 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15 });
  }

  const categoryLabel = showEnglish
    ? CATEGORIES_EN[keyword.category]
    : CATEGORIES[keyword.category];

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: colors.foreground }]}>
                {showEnglish ? keyword.nameEn : keyword.name}
              </Text>
              {showEnglish && keyword.name !== keyword.nameEn && (
                <Text style={[styles.altName, { color: colors.mutedForeground }]}>
                  {" "}({keyword.name})
                </Text>
              )}
            </View>
            <View style={styles.row}>
              {keyword.colors.slice(0, 3).map((color) => (
                <View
                  key={color}
                  style={[styles.colorDot, { backgroundColor: COLOR_MAP[color] ?? "#888" }]}
                />
              ))}
              <Text style={[styles.category, { color: colors.mutedForeground }]}>
                {categoryLabel}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.shortDesc, { color: colors.cardForeground }]}
            numberOfLines={expanded ? undefined : 2}
          >
            {showEnglish ? keyword.shortEn : keyword.shortDe}
          </Text>

          {expanded && (
            <View style={styles.expanded}>
              <Text style={[styles.fullDesc, { color: colors.cardForeground }]}>
                {showEnglish ? keyword.fullEn : keyword.fullDe}
              </Text>
              {(keyword.example || keyword.exampleEn) && (
                <View style={[styles.exampleBox, { backgroundColor: colors.secondary, borderLeftColor: colors.primary }]}>
                  <Text style={[styles.exampleLabel, { color: colors.primary }]}>
                    {showEnglish ? "Example" : "Beispiel"}
                  </Text>
                  <Text style={[styles.exampleText, { color: colors.secondaryForeground }]}>
                    {showEnglish ? (keyword.exampleEn ?? keyword.example) : keyword.example}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.expandRow}>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={18}
              color={colors.mutedForeground}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  header: {
    marginBottom: 6,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },
  name: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  altName: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  category: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginLeft: 4,
  },
  shortDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  expanded: {
    marginTop: 10,
    gap: 10,
  },
  fullDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  exampleBox: {
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 10,
    gap: 2,
  },
  exampleLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  exampleText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    lineHeight: 18,
  },
  expandRow: {
    alignItems: "center",
    marginTop: 8,
  },
});
