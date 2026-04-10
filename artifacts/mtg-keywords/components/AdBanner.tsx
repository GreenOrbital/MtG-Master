import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

// ─── Amazon Affiliate Banners ─────────────────────────────────────────────────
// DE: tag=masterofmtg-21  |  EN: tag=mtg08d-20
// TODO: Replace with AdMob once App ID is configured (see AdMobBanner.tsx)

const BANNERS_DE = [
  {
    label: "Amazon-Anzeige",
    title: "MtG Booster-Packs",
    sub: "Neue Karten — direkt bei Amazon.de",
    icon: "cube-outline" as const,
    url: "https://www.amazon.de/s?k=magic+the+gathering+booster&tag=masterofmtg-21",
  },
  {
    label: "Amazon-Anzeige",
    title: "Commander Decks",
    sub: "Fertige Decks für deine Spielrunde",
    icon: "layers-outline" as const,
    url: "https://www.amazon.de/s?k=magic+the+gathering+commander+deck&tag=masterofmtg-21",
  },
  {
    label: "Amazon-Anzeige",
    title: "Karten-Hüllen & Zubehör",
    sub: "Schütze deine Sammlerstücke",
    icon: "shield-outline" as const,
    url: "https://www.amazon.de/s?k=magic+the+gathering+sleeves+zubeh%C3%B6r&tag=masterofmtg-21",
  },
  {
    label: "Amazon-Anzeige",
    title: "MtG Einzelkarten",
    sub: "Komplettiere dein Deck",
    icon: "card-outline" as const,
    url: "https://www.amazon.de/s?k=magic+the+gathering+singles&tag=masterofmtg-21",
  },
];

const BANNERS_EN = [
  {
    label: "Amazon Ad",
    title: "MtG Booster Packs",
    sub: "New cards — shop on Amazon",
    icon: "cube-outline" as const,
    url: "https://www.amazon.com/s?k=magic+the+gathering+booster&tag=mtg08d-20",
  },
  {
    label: "Amazon Ad",
    title: "Commander Decks",
    sub: "Ready-to-play decks for your group",
    icon: "layers-outline" as const,
    url: "https://www.amazon.com/s?k=magic+the+gathering+commander+deck&tag=mtg08d-20",
  },
  {
    label: "Amazon Ad",
    title: "Card Sleeves & Accessories",
    sub: "Protect your collection",
    icon: "shield-outline" as const,
    url: "https://www.amazon.com/s?k=magic+the+gathering+sleeves+accessories&tag=mtg08d-20",
  },
  {
    label: "Amazon Ad",
    title: "MtG Singles",
    sub: "Complete your deck",
    icon: "card-outline" as const,
    url: "https://www.amazon.com/s?k=magic+the+gathering+singles&tag=mtg08d-20",
  },
];

const ROTATION_INTERVAL = 7000;

export function AdBanner() {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const banners = showEnglish ? BANNERS_EN : BANNERS_DE;

  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const nd = Platform.OS !== "web";

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: nd,
      }).start(() => {
        setIndex((i) => (i + 1) % banners.length);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: nd,
        }).start();
      });
    }, ROTATION_INTERVAL);
    return () => clearInterval(timer);
  }, [banners.length]);

  const banner = banners[index];

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => Linking.openURL(banner.url)}
      style={[styles.wrapper, { borderColor: colors.primary + "55", backgroundColor: colors.card }]}
    >
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary + "20" }]}>
          <Ionicons name={banner.icon} size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
            {banner.title}
          </Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={1}>
            {banner.sub}
          </Text>
        </View>
        <View style={styles.rightCol}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>{banner.label}</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.primary} style={{ opacity: 0.7 }} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
    opacity: 0.8,
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 3,
  },
  label: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    opacity: 0.6,
    letterSpacing: 0.3,
  },
});
