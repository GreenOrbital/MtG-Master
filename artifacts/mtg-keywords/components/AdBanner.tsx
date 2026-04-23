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

// ─── Art crop cache & listeners ────────────────────────────────────────────
const artCropCache: Record<string, string> = {};
let fetchStarted = false;
const artCropListeners = new Set<() => void>();

function notifyListeners() {
  artCropListeners.forEach((fn) => fn());
}

// Fetch all banner art crops in ONE collection request
async function fetchAllArtCrops(cards: string[]) {
  if (fetchStarted) return;
  fetchStarted = true;

  // On native, wait for network to stabilize after app start
  if (Platform.OS !== "web") {
    await new Promise((r) => setTimeout(r, 800));
  }

  try {
    const res = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: cards.map((name) => ({ name })) }),
    });
    if (!res.ok) { fetchStarted = false; return; }
    const json = await res.json() as { data: any[] };
    let changed = false;
    for (const raw of json.data ?? []) {
      const artCrop =
        raw?.image_uris?.art_crop ??
        raw?.card_faces?.[0]?.image_uris?.art_crop;
      if (artCrop && raw?.name) {
        // Match back to our requested name (exact or prefix)
        const match = cards.find(
          (c) => c.toLowerCase() === raw.name.toLowerCase()
        ) ?? raw.name;
        artCropCache[match] = artCrop;
        changed = true;
      }
    }
    if (changed) notifyListeners();
  } catch {
    fetchStarted = false; // allow retry on next mount
  }
}

function useScryfallArtCrops(cards: string[]) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    artCropListeners.add(listener);
    fetchAllArtCrops(cards);
    return () => { artCropListeners.delete(listener); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const werbungLabel = showEnglish ? "Advertisement · Amazon Affiliate" : "Werbung · Amazon-Affiliate-Link";

  return (
    <Animated.View style={[styles.wrapper, { opacity: fadeAnim }]}>
      {/* ── Werbungs-Trennlinie ── */}
      <View style={[styles.adLabel, { borderColor: colors.border }]}>
        <View style={[styles.adLabelLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.adLabelText, { color: colors.mutedForeground }]}>{werbungLabel}</Text>
        <View style={[styles.adLabelLine, { backgroundColor: colors.border }]} />
      </View>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => Linking.openURL(url)}
        style={[styles.touch, { borderColor: colors.border }]}
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
  },
  adLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 5,
    paddingHorizontal: 2,
  },
  adLabelLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  adLabelText: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
