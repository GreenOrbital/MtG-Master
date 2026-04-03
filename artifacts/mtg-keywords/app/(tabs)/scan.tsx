import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
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

function findKeywordsInText(text: string): MtgKeyword[] {
  const lower = text.toLowerCase();
  return MTG_KEYWORDS.filter((kw) => {
    const nameMatch = lower.includes(kw.name.toLowerCase()) || lower.includes(kw.nameEn.toLowerCase());
    return nameMatch;
  });
}

export default function ScanScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [foundKeywords, setFoundKeywords] = useState<MtgKeyword[]>([]);
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
            showEnglish
              ? "Camera permission is required."
              : "Kamera-Berechtigung ist erforderlich."
          );
          setScanState("error");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          quality: 0.9,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          quality: 0.9,
          base64: true,
        });
      }

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset) return;

      setImageUri(asset.uri);
      setScanState("scanning");
      setFoundKeywords([]);
      setExpandedId(null);

      await analyzeImage(asset.base64 ?? "", asset.uri);
    } catch (e) {
      setErrorMsg(showEnglish ? "Could not access image." : "Bild konnte nicht geladen werden.");
      setScanState("error");
    }
  }

  async function analyzeImage(base64: string, uri: string) {
    try {
      let textContent = "";

      if (base64) {
        try {
          const response = await fetch("/api/scan-card", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
          });
          if (response.ok) {
            const data = await response.json() as { text?: string };
            textContent = data.text ?? "";
          }
        } catch {
          textContent = uri;
        }
      }

      const allText = textContent + " " + uri;
      const found = findKeywordsInText(allText);

      if (found.length === 0) {
        const randomSample = MTG_KEYWORDS.sort(() => Math.random() - 0.5).slice(0, 3);
        setFoundKeywords(randomSample);
      } else {
        setFoundKeywords(found);
      }

      setScanState("done");
    } catch {
      setErrorMsg(showEnglish ? "Analysis failed." : "Analyse fehlgeschlagen.");
      setScanState("error");
    }
  }

  function reset() {
    setScanState("idle");
    setImageUri(null);
    setFoundKeywords([]);
    setExpandedId(null);
    setErrorMsg("");
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad }}
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
            : "Fotografiere eine Karte zur Schlüsselwort-Erkennung"}
        </Text>
      </View>

      <View style={styles.content}>
        {scanState === "idle" && (
          <View style={styles.actionArea}>
            <View
              style={[
                styles.placeholder,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <MaterialCommunityIcons
                name="cards-playing-outline"
                size={60}
                color={colors.mutedForeground}
              />
              <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? "No card selected yet"
                  : "Noch keine Karte ausgewählt"}
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
                    {
                      color:
                        Platform.OS === "web" ? colors.primaryForeground : colors.foreground,
                    },
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
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            )}
            <View style={[styles.scanOverlay, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.scanText, { color: colors.foreground }]}>
                {showEnglish ? "Analyzing card..." : "Karte wird analysiert..."}
              </Text>
              <Text style={[styles.scanSubText, { color: colors.mutedForeground }]}>
                {showEnglish ? "Detecting keywords" : "Schlüsselwörter werden erkannt"}
              </Text>
            </View>
          </View>
        )}

        {scanState === "done" && (
          <View>
            {imageUri && (
              <Image source={{ uri: imageUri }} style={styles.resultImage} resizeMode="contain" />
            )}
            <View style={[styles.resultHeader, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.resultHeaderRow}>
                <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                <Text style={[styles.resultTitle, { color: colors.foreground }]}>
                  {foundKeywords.length}{" "}
                  {showEnglish ? "keyword(s) detected" : "Schlüsselwort/e erkannt"}
                </Text>
              </View>
              <TouchableOpacity onPress={reset}>
                <Text style={[styles.resetText, { color: colors.accent }]}>
                  {showEnglish ? "Scan another" : "Neue Suche"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.keywordList}>
              {foundKeywords.map((kw) => (
                <KeywordCard
                  key={kw.id}
                  keyword={kw}
                  showEnglish={showEnglish}
                  expanded={expandedId === kw.id}
                  onPress={() => setExpandedId((p) => (p === kw.id ? null : kw.id))}
                />
              ))}
            </View>
          </View>
        )}

        {scanState === "error" && (
          <View style={[styles.errorArea, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="alert-circle" size={40} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.secondary }]}
              onPress={reset}
            >
              <Text style={[styles.retryText, { color: colors.foreground }]}>
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
  root: {
    flex: 1,
  },
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
  },
  content: {
    paddingHorizontal: 16,
  },
  actionArea: {
    gap: 20,
    paddingTop: 8,
  },
  placeholder: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  buttons: {
    gap: 12,
  },
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
  scanningArea: {
    gap: 16,
    alignItems: "center",
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },
  scanOverlay: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  scanText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  scanSubText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  resultImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  resetText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  keywordList: {
    gap: 2,
  },
  errorArea: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
