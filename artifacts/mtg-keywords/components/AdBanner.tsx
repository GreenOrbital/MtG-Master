import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

interface BannerConfig {
  cardName: string;
  titleDe: string;
  titleEn: string;
  subDe: string;
  subEn: string;
  urlDe: string;
  urlEn: string;
}

const BANNERS: BannerConfig[] = [
  {
    cardName: "Lightning Bolt",
    titleDe: "MtG Booster-Packs",
    titleEn: "MtG Booster Packs",
    subDe: "Neue Karten — direkt bei Amazon.de",
    subEn: "New cards — shop on Amazon",
    urlDe: "https://www.amazon.de/s?k=magic+the+gathering+booster&tag=masterofmtg-21",
    urlEn: "https://www.amazon.com/s?k=magic+the+gathering+booster&tag=mtg08d-20",
  },
  {
    cardName: "Atraxa, Praetors' Voice",
    titleDe: "Commander Decks",
    titleEn: "Commander Decks",
    subDe: "Fertige Decks für deine Spielrunde",
    subEn: "Ready-to-play decks for your group",
    urlDe: "https://www.amazon.de/s?k=magic+the+gathering+commander+deck&tag=masterofmtg-21",
    urlEn: "https://www.amazon.com/s?k=magic+the+gathering+commander+deck&tag=mtg08d-20",
  },
  {
    cardName: "Sol Ring",
    titleDe: "Hüllen & Zubehör",
    titleEn: "Sleeves & Accessories",
    subDe: "Schütze deine Sammlerstücke",
    subEn: "Protect your collection",
    urlDe: "https://www.amazon.de/s?k=magic+the+gathering+sleeves+zubeh%C3%B6r&tag=masterofmtg-21",
    urlEn: "https://www.amazon.com/s?k=magic+the+gathering+sleeves+accessories&tag=mtg08d-20",
  },
  {
    cardName: "Brainstorm",
    titleDe: "MtG Einzelkarten",
    titleEn: "MtG Singles",
    subDe: "Komplettiere dein Deck",
    subEn: "Complete your deck",
    urlDe: "https://www.amazon.de/s?k=magic+the+gathering+singles&tag=masterofmtg-21",
    urlEn: "https://www.amazon.com/s?k=magic+the+gathering+singles&tag=mtg08d-20",
  },
];

const ROTATION_INTERVAL = 8000;

// ─── Per-card cache & in-flight tracking ──────────────────────────────────────
// Using per-card tracking (not a global flag) so failed fetches can be retried.
const artCropCache: Record<string, string> = {};
const artCropInFlight = new Set<string>();
const artCropListeners = new Set<() => void>();

function notifyListeners() {
  artCropListeners.forEach((fn) => fn());
}

function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(id));
}

async function fetchSingleArtCrop(name: string) {
  if (artCropCache[name] || artCropInFlight.has(name)) return;
  artCropInFlight.add(name);

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 800 * attempt));
      const res = await fetchWithTimeout(
        `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`,
        10000
      );
      if (!res.ok) continue;
      const data = await res.json();
      const url =
        data?.image_uris?.art_crop ??
        data?.card_faces?.[0]?.image_uris?.art_crop;
      if (url) {
        artCropCache[name] = url;
        notifyListeners();
        artCropInFlight.delete(name);
        return;
      }
    } catch {}
  }

  // Remove from in-flight on failure so next mount can retry
  artCropInFlight.delete(name);
}

async function fetchArtCrops(cards: string[]) {
  // On native, wait for network to stabilize after app start
  if (Platform.OS !== "web") {
    await new Promise((r) => setTimeout(r, 1500));
  }
  for (const name of cards) {
    fetchSingleArtCrop(name);
    await new Promise((r) => setTimeout(r, 150));
  }
}

function useScryfallArtCrops(cards: string[]) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    artCropListeners.add(listener);

    // Trigger fetch for any missing cards
    const missing = cards.filter((c) => !artCropCache[c] && !artCropInFlight.has(c));
    if (missing.length > 0) fetchArtCrops(missing);

    return () => { artCropListeners.delete(listener); };
  }, [cards.join(",")]);

  return artCropCache;
}

export function AdBanner() {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const nd = Platform.OS !== "web";

  const cardNames = BANNERS.map((b) => b.cardName);
  const artCrops = useScryfallArtCrops(cardNames);

  useEffect(() => {
    const timer = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: nd }).start(() => {
        setIndex((i) => (i + 1) % BANNERS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: nd }).start();
      });
    }, ROTATION_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const banner = BANNERS[index];
  const imageUrl = artCrops[banner.cardName];
  const title = showEnglish ? banner.titleEn : banner.titleDe;
  const sub = showEnglish ? banner.subEn : banner.subDe;
  const url = showEnglish ? banner.urlEn : banner.urlDe;
  const adLabel = showEnglish ? "Amazon Ad" : "Amazon-Anzeige";

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => Linking.openURL(url)}
        style={[styles.touch, { borderColor: colors.primary + "55" }]}
      >
        <ImageBackground
          source={imageUrl ? { uri: imageUrl } : undefined}
          style={styles.bg}
          imageStyle={styles.bgImage}
          resizeMode="cover"
        >
          <View style={[styles.overlay, { backgroundColor: imageUrl ? "rgba(10,8,5,0.68)" : colors.card }]} />
          <View style={styles.content}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              <Text style={styles.sub} numberOfLines={1}>{sub}</Text>
            </View>
            <View style={styles.right}>
              <Text style={[styles.label, { color: colors.primary }]}>{adLabel}</Text>
              <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
            </View>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    overflow: "hidden",
  },
  touch: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  bg: {
    minHeight: 52,
    justifyContent: "center",
  },
  bgImage: {
    borderRadius: 10,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#e8d8a0",
  },
  sub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(232,216,160,0.75)",
    marginTop: 2,
  },
  right: {
    alignItems: "flex-end",
    gap: 2,
  },
  label: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
    opacity: 0.85,
  },
  arrow: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
