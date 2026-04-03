import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettings } from "@/context/SettingsContext";
import { MTG_KEYWORDS } from "@/data/keywords";
import { useColors } from "@/hooks/useColors";

function SettingRow({
  label,
  subtitle,
  right,
}: {
  label: string;
  subtitle?: string;
  right: React.ReactNode;
}) {
  const colors = useColors();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.rowLeft}>
        <Text style={[styles.rowLabel, { color: colors.foreground }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

function AboutSection({ showEnglish, colors }: { showEnglish: boolean; colors: ReturnType<typeof useColors> }) {
  const features = showEnglish
    ? [
        { icon: "search-outline" as const, title: "Card Search", text: "Search by German or English card name — complete card view with image, type, rarity, mana cost and format legality." },
        { icon: "camera-outline" as const, title: "Photo Recognition", text: "Point the camera at any physical MtG card and the app automatically recognizes it using AI. Best results with good lighting and a clearly readable card name." },
        { icon: "book-outline" as const, title: "95 Keywords", text: "All important keywords explained — from classics like Flying and Trample to newer ones like Freerunning or Spree. Always available offline." },
        { icon: "heart-outline" as const, title: "Favorites & History", text: "Save favorite cards for quick access. Recently searched cards are always remembered automatically." },
        { icon: "layers-outline" as const, title: "Deck Builder", text: "Create your own decks, add cards and see the mana pool analysis at a glance." },
      ]
    : [
        { icon: "search-outline" as const, title: "Kartensuche", text: "Suche mit deutschem oder englischem Kartennamen — vollständige Kartenansicht mit Bild, Typ, Seltenheit, Manakosten und Formatlegality." },
        { icon: "camera-outline" as const, title: "Foto-Erkennung", text: "Halte die Kamera auf eine physische MtG-Karte und die App erkennt sie automatisch per KI. Am besten bei guter Beleuchtung und klar lesbarem Kartenname." },
        { icon: "book-outline" as const, title: "95 Schlüsselwörter", text: "Alle wichtigen Keywords erklärt — von Klassikern wie Fliegen und Trampeln bis zu neueren wie Freies Laufen oder Streunen. Immer offline verfügbar." },
        { icon: "heart-outline" as const, title: "Favoriten & Verlauf", text: "Lieblingskarten speichern für schnellen Zugriff. Zuletzt gesuchte Karten werden immer automatisch gemerkt." },
        { icon: "layers-outline" as const, title: "Deck-Builder", text: "Eigene Decks erstellen, Karten hinzufügen und den Manapool auf einen Blick analysieren." },
      ];

  const tips = showEnglish
    ? [
        "Photo recognition works best with good lighting — the card name at the top must be clearly readable.",
        "Foil cards or heavily worn cards can be harder to recognize.",
        "Card search and photo recognition require an internet connection.",
        "All keywords are available offline at any time.",
        "The app supports both German and English card names in the search.",
      ]
    : [
        "Die Foto-Erkennung braucht gute Beleuchtung — der Kartenname oben muss klar lesbar sein.",
        "Foil-Karten oder stark abgenutzte Karten können schwerer erkannt werden.",
        "Kartensuche und Foto-Erkennung benötigen eine Internetverbindung.",
        "Alle Schlüsselwörter sind jederzeit offline verfügbar.",
        "Die App unterstützt bei der Suche sowohl deutsche als auch englische Kartennamen.",
      ];

  const introText = showEnglish
    ? "I developed this app for Magic: The Gathering players who want to quickly look up what certain card abilities mean during a game — all explained in German, with an optional English mode."
    : "Ich habe diese App für Magic: The Gathering-Spieler entwickelt, die beim Spielen schnell nachschlagen möchten, was bestimmte Kartenfähigkeiten bedeuten — alles auf Deutsch erklärt, mit optionalem Englisch-Modus.";

  const featuresTitle = showEnglish ? "What the app can do" : "Was die App kann";
  const tipsTitle = showEnglish ? "What to keep in mind" : "Worauf du achten solltest";

  return (
    <View style={styles.aboutContainer}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        {showEnglish ? "ABOUT THIS APP" : "ÜBER DIESE APP"}
      </Text>

      <Text style={[styles.introText, { color: colors.foreground }]}>{introText}</Text>

      <Text style={[styles.subheading, { color: colors.foreground }]}>{featuresTitle}</Text>
      {features.map((f, i) => (
        <View key={i} style={styles.featureRow}>
          <View style={[styles.featureIcon, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name={f.icon} size={16} color={colors.primary} />
          </View>
          <View style={styles.featureText}>
            <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
            <Text style={[styles.featureDesc, { color: colors.mutedForeground }]}>{f.text}</Text>
          </View>
        </View>
      ))}

      <Text style={[styles.subheading, { color: colors.foreground }]}>{tipsTitle}</Text>
      {tips.map((tip, i) => (
        <View key={i} style={styles.tipRow}>
          <Text style={[styles.tipBullet, { color: colors.primary }]}>•</Text>
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
        </View>
      ))}
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish, setShowEnglish } = useSettings();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  const abilityCount = MTG_KEYWORDS.filter((k) => k.category === "keyword_ability").length;
  const actionCount = MTG_KEYWORDS.filter((k) => k.category === "keyword_action").length;
  const wordCount = MTG_KEYWORDS.filter((k) => k.category === "ability_word").length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {showEnglish ? "Settings" : "Einstellungen"}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            {showEnglish ? "LANGUAGE" : "SPRACHE"}
          </Text>
          <SettingRow
            label={showEnglish ? "English Explanations" : "Englische Erklärungen"}
            subtitle={
              showEnglish
                ? "Show keywords and explanations in English"
                : "Schlüsselwörter und Erklärungen auf Englisch"
            }
            right={
              <Switch
                value={showEnglish}
                onValueChange={setShowEnglish}
                trackColor={{ false: colors.muted, true: colors.primary }}
                thumbColor={colors.card}
              />
            }
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            {showEnglish ? "DATABASE" : "DATENBANK"}
          </Text>
          <SettingRow
            label={showEnglish ? "Total Keywords" : "Schlüsselwörter gesamt"}
            right={
              <Text style={[styles.statValue, { color: colors.primary }]}>{MTG_KEYWORDS.length}</Text>
            }
          />
          <SettingRow
            label={showEnglish ? "Keyword Abilities" : "Schlüsselwort-Fähigkeiten"}
            right={<Text style={[styles.statValue, { color: colors.mutedForeground }]}>{abilityCount}</Text>}
          />
          <SettingRow
            label={showEnglish ? "Keyword Actions" : "Schlüsselwort-Aktionen"}
            right={<Text style={[styles.statValue, { color: colors.mutedForeground }]}>{actionCount}</Text>}
          />
          <SettingRow
            label={showEnglish ? "Ability Words" : "Fähigkeitswörter"}
            right={<Text style={[styles.statValue, { color: colors.mutedForeground }]}>{wordCount}</Text>}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            {showEnglish ? "ABOUT" : "INFO"}
          </Text>
          <SettingRow
            label={showEnglish ? "Data Source" : "Datenquelle"}
            subtitle="Scryfall API / MTG Comprehensive Rules"
            right={
              <TouchableOpacity onPress={() => Linking.openURL("https://scryfall.com")}>
                <Ionicons name="open-outline" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            }
          />
          <SettingRow
            label={showEnglish ? "App Version" : "App-Version"}
            right={
              <Text style={[styles.statValue, { color: colors.mutedForeground }]}>1.0.0</Text>
            }
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <AboutSection showEnglish={showEnglish} colors={colors} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  statValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  aboutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  introText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 18,
    marginTop: 4,
  },
  subheading: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    marginTop: 4,
  },
  featureRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
    alignItems: "flex-start",
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  featureDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  tipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  tipBullet: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    lineHeight: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
});
