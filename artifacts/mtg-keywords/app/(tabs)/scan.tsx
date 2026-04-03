import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeywordCard } from "@/components/KeywordCard";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useSettings } from "@/context/SettingsContext";
import { MTG_KEYWORDS, type MtgKeyword } from "@/data/keywords";
import { useColors } from "@/hooks/useColors";

type ScanState = "idle" | "scanning" | "done" | "error";

type ScanResult = {
  detectedName: string;
  cardName: string;
  keywords: string[];
  oracleText: string;
  typeLine: string;
  manaCost: string;
  power?: string;
  toughness?: string;
  setName: string;
  imageUri?: string;
};

function matchLocalKeywords(scryfallKeywords: string[], oracleText: string): MtgKeyword[] {
  const found = new Map<string, MtgKeyword>();

  for (const kw of MTG_KEYWORDS) {
    const nameEnLower = kw.nameEn.toLowerCase();
    const nameDeLower = kw.name.toLowerCase();

    for (const sk of scryfallKeywords) {
      if (sk.toLowerCase() === nameEnLower || sk.toLowerCase() === nameDeLower) {
        found.set(kw.id, kw);
      }
    }

    const oracleLower = oracleText.toLowerCase();
    if (oracleLower.includes(nameEnLower) || oracleLower.includes(nameDeLower)) {
      found.set(kw.id, kw);
    }
  }

  return Array.from(found.values());
}

function getApiBase(): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (domain) return `https://${domain}`;
  return "";
}

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [matchedKeywords, setMatchedKeywords] = useState<MtgKeyword[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  async function pickImage(fromCamera: boolean) {
    try {
      let result;
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setErrorMsg(
            showEnglish ? "Camera permission required." : "Kamera-Berechtigung erforderlich."
          );
          setScanState("error");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          quality: 0.85,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          quality: 0.85,
          base64: true,
        });
      }

      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset || !asset.base64) {
        setErrorMsg(showEnglish ? "Could not load image." : "Bild konnte nicht geladen werden.");
        setScanState("error");
        return;
      }

      setLocalImageUri(asset.uri);
      setScanResult(null);
      setMatchedKeywords([]);
      setExpandedId(null);
      setScanState("scanning");

      await analyzeCard(asset.base64);
    } catch {
      setErrorMsg(showEnglish ? "Could not access image." : "Bild nicht zugänglich.");
      setScanState("error");
    }
  }

  async function analyzeCard(base64: string) {
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/scan-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (response.status === 422) {
        setErrorMsg(
          showEnglish
            ? "Could not recognize the card name. Make sure the card name at the top is clearly visible."
            : "Kartenname nicht erkannt. Stelle sicher, dass der Name oben auf der Karte gut lesbar ist."
        );
        setScanState("error");
        return;
      }

      if (response.status === 404) {
        const data = (await response.json()) as { detectedName?: string };
        setErrorMsg(
          showEnglish
            ? `Recognized name "${data.detectedName ?? "?"}" not found in Scryfall database.`
            : `Erkannter Name "${data.detectedName ?? "?"}" nicht in der Scryfall-Datenbank gefunden.`
        );
        setScanState("error");
        return;
      }

      if (!response.ok) {
        setErrorMsg(showEnglish ? "Server error during scan." : "Serverfehler beim Scannen.");
        setScanState("error");
        return;
      }

      const data = (await response.json()) as ScanResult;
      setScanResult(data);

      const matched = matchLocalKeywords(data.keywords, data.oracleText);
      setMatchedKeywords(matched);
      setScanState("done");
    } catch {
      setErrorMsg(showEnglish ? "Network error." : "Netzwerkfehler. Bitte prüfe die Verbindung.");
      setScanState("error");
    }
  }

  function reset() {
    setScanState("idle");
    setScanResult(null);
    setLocalImageUri(null);
    setMatchedKeywords([]);
    setExpandedId(null);
    setErrorMsg("");
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {showEnglish ? "Card Scanner" : "Karten-Scanner"}
          </Text>
          <LanguageToggle showEnglish={showEnglish} onToggle={() => setShowEnglish(!showEnglish)} />
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {showEnglish
            ? "Photograph a card to identify its keywords"
            : "Fotografiere eine Karte — KI erkennt den Namen und erklärt die Schlüsselwörter"}
        </Text>
      </View>

      <View style={styles.content}>
        {scanState === "idle" && (
          <View style={styles.actionArea}>
            <View style={[styles.placeholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="cards-playing-outline" size={56} color={colors.mutedForeground} />
              <Text style={[styles.placeholderTitle, { color: colors.foreground }]}>
                {showEnglish ? "Scan a Card" : "Karte scannen"}
              </Text>
              <Text style={[styles.placeholderHint, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? "Make sure the card name at the top is clearly visible"
                  : "Halte die Kamera so, dass der Name oben gut lesbar ist"}
              </Text>
            </View>

            <View style={styles.buttons}>
              {Platform.OS !== "web" && (
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: colors.primary }]}
                  onPress={() => pickImage(true)}
                >
                  <Ionicons name="camera" size={22} color={colors.primaryForeground} />
                  <Text style={[styles.btnText, { color: colors.primaryForeground }]}>
                    {showEnglish ? "Take Photo" : "Foto aufnehmen"}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.btn,
                  {
                    backgroundColor: Platform.OS === "web" ? colors.primary : colors.secondary,
                    borderColor: colors.border,
                    borderWidth: Platform.OS === "web" ? 0 : 1,
                  },
                ]}
                onPress={() => pickImage(false)}
              >
                <Ionicons
                  name="image"
                  size={22}
                  color={Platform.OS === "web" ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={[
                    styles.btnText,
                    { color: Platform.OS === "web" ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {showEnglish ? "Choose from Gallery" : "Aus Galerie wählen"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {scanState === "scanning" && (
          <View style={styles.scanningArea}>
            {localImageUri && (
              <Image source={{ uri: localImageUri }} style={styles.previewImage} resizeMode="contain" />
            )}
            <View style={[styles.scanOverlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.scanTitle, { color: colors.foreground }]}>
                {showEnglish ? "Analyzing card..." : "Karte wird analysiert..."}
              </Text>
              <Text style={[styles.scanStep, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? "Reading card name → querying Scryfall"
                  : "Name wird gelesen → Scryfall wird abgefragt"}
              </Text>
            </View>
          </View>
        )}

        {scanState === "done" && scanResult && (
          <View style={styles.resultsArea}>
            <View style={[styles.cardInfoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardInfoTop}>
                <View style={styles.cardInfoLeft}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>
                    {scanResult.cardName}
                  </Text>
                  {scanResult.typeLine ? (
                    <Text style={[styles.cardType, { color: colors.mutedForeground }]}>
                      {scanResult.typeLine}
                    </Text>
                  ) : null}
                  <View style={styles.cardMeta}>
                    {scanResult.manaCost ? (
                      <Text style={[styles.metaBadge, { backgroundColor: colors.secondary, color: colors.secondaryForeground }]}>
                        {scanResult.manaCost}
                      </Text>
                    ) : null}
                    {scanResult.power && scanResult.toughness ? (
                      <Text style={[styles.metaBadge, { backgroundColor: colors.secondary, color: colors.secondaryForeground }]}>
                        {scanResult.power}/{scanResult.toughness}
                      </Text>
                    ) : null}
                    {scanResult.setName ? (
                      <Text style={[styles.metaBadge, { backgroundColor: colors.secondary, color: colors.secondaryForeground }]}>
                        {scanResult.setName}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {scanResult.imageUri && (
                  <Image
                    source={{ uri: scanResult.imageUri }}
                    style={styles.cardThumb}
                    resizeMode="contain"
                  />
                )}
              </View>

              {scanResult.oracleText ? (
                <View style={[styles.oracleBox, { borderTopColor: colors.border }]}>
                  <Text style={[styles.oracleLabel, { color: colors.mutedForeground }]}>
                    {showEnglish ? "Oracle Text" : "Kartentext"}
                  </Text>
                  <Text style={[styles.oracleText, { color: colors.cardForeground }]}>
                    {scanResult.oracleText}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity onPress={reset} style={styles.resetRow}>
                <Ionicons name="scan-outline" size={16} color={colors.primary} />
                <Text style={[styles.resetText, { color: colors.primary }]}>
                  {showEnglish ? "Scan another card" : "Neue Karte scannen"}
                </Text>
              </TouchableOpacity>
            </View>

            {matchedKeywords.length > 0 ? (
              <View style={styles.kwSection}>
                <Text style={[styles.kwSectionTitle, { color: colors.foreground }]}>
                  {showEnglish
                    ? `${matchedKeywords.length} Keyword(s) found`
                    : `${matchedKeywords.length} Schlüsselwort/e erklärt`}
                </Text>
                {matchedKeywords.map((kw) => (
                  <KeywordCard
                    key={kw.id}
                    keyword={kw}
                    showEnglish={showEnglish}
                    expanded={expandedId === kw.id}
                    onPress={() => setExpandedId((p) => (p === kw.id ? null : kw.id))}
                  />
                ))}
              </View>
            ) : (
              <View style={[styles.noKwBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={28} color={colors.mutedForeground} />
                <Text style={[styles.noKwText, { color: colors.mutedForeground }]}>
                  {showEnglish
                    ? "No keywords from our database found on this card."
                    : "Keine Schlüsselwörter aus der Datenbank auf dieser Karte gefunden."}
                </Text>
                {scanResult.keywords.length > 0 && (
                  <Text style={[styles.noKwSub, { color: colors.mutedForeground }]}>
                    {showEnglish ? "Scryfall keywords: " : "Scryfall-Schlüsselwörter: "}
                    {scanResult.keywords.join(", ")}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {scanState === "error" && (
          <View style={[styles.errorArea, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="alert-circle" size={44} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={reset}
            >
              <Text style={[styles.retryText, { color: colors.primaryForeground }]}>
                {showEnglish ? "Try Again" : "Erneut versuchen"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  content: {
    paddingHorizontal: 16,
  },
  actionArea: { gap: 16 },
  placeholder: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20,
  },
  placeholderTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  placeholderHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  buttons: { gap: 12 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  scanningArea: { gap: 14, alignItems: "center" },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  scanOverlay: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  scanTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  scanStep: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  resultsArea: { gap: 14 },
  cardInfoBox: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardInfoTop: {
    flexDirection: "row",
    padding: 14,
    gap: 12,
  },
  cardInfoLeft: {
    flex: 1,
    gap: 4,
  },
  cardName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  cardType: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  metaBadge: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  cardThumb: {
    width: 80,
    height: 112,
    borderRadius: 6,
  },
  oracleBox: {
    borderTopWidth: 1,
    padding: 14,
    gap: 4,
  },
  oracleLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  oracleText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    fontStyle: "italic",
  },
  resetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  resetText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  kwSection: { gap: 4 },
  kwSectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  noKwBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  noKwText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  noKwSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    fontStyle: "italic",
  },
  errorArea: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  retryText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
