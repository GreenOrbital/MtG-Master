import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
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

function getAccentColor(colors: string[]): string {
  if (!colors.length) return "#7c3aed";
  const first = colors[0];
  return COLOR_MAP[first] ?? "#7c3aed";
}

export function KeywordCard({ keyword, showEnglish, expanded, onPress }: Props) {
  const colors = useColors();

  const scale     = useSharedValue(1);
  const chevronRot = useSharedValue(expanded ? 1 : 0);

  React.useEffect(() => {
    chevronRot.value = withSpring(expanded ? 1 : 0, { damping: 14, stiffness: 160 });
  }, [expanded]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRot.value * 180}deg` }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.97, { damping: 15 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 15 });
  }

  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  }

  const categoryLabel = showEnglish
    ? CATEGORIES_EN[keyword.category]
    : CATEGORIES[keyword.category];

  const accentColor = getAccentColor(keyword.colors);

  return (
    <Animated.View style={cardStyle}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: accentColor, borderLeftWidth: 3 }]}>
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
              {keyword.colors.slice(0, 4).map((color) => (
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
                <View style={[styles.exampleBox, { backgroundColor: colors.secondary, borderLeftColor: accentColor }]}>
                  <Text style={[styles.exampleLabel, { color: accentColor }]}>
                    {showEnglish ? "Example" : "Beispiel"}
                  </Text>
                  <Text style={[styles.exampleText, { color: colors.secondaryForeground }]}>
                    {showEnglish ? (keyword.exampleEn ?? keyword.example) : keyword.example}
                  </Text>
                </View>
              )}
              {keyword.crRule && (
                <View style={[styles.crBox, { backgroundColor: accentColor + "12", borderColor: accentColor + "33" }]}>
                  <Ionicons name="book-outline" size={11} color={accentColor} />
                  <Text style={[styles.crLabel, { color: colors.mutedForeground }]}>
                    {showEnglish ? "Comprehensive Rules" : "Umfassende Regeln"}
                  </Text>
                  <Text style={[styles.crRuleText, { color: accentColor }]}>CR {keyword.crRule}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.expandRow}>
            <Animated.View style={chevronStyle}>
              <Ionicons
                name="chevron-down"
                size={18}
                color={expanded ? accentColor : colors.mutedForeground}
              />
            </Animated.View>
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
    width: 9,
    height: 9,
    borderRadius: 5,
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
  crBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  crLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    flexShrink: 1,
    flexGrow: 1,
  },
  crRuleText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
    flexShrink: 0,
  },
});
