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
        { icon: "search-outline" as const, title: "Card Search (DE + EN)", text: "Search by German or English card name — full card view with image, type, rarity, mana cost and format legality (Standard, Pioneer, Modern, Legacy, Commander)." },
        { icon: "book-outline" as const, title: "95+ Keywords Offline", text: "All important keywords explained — from classics like Flying and Trample to newer ones like Freerunning or Spree. Always available offline, no internet needed." },
        { icon: "heart-outline" as const, title: "Favorites & History", text: "Save favorite cards for quick access. Recently searched cards are automatically remembered — accessible without re-searching." },
        { icon: "layers-outline" as const, title: "Deck Builder + Import", text: "Create decks, add cards and view the mana analysis: average CMC, color distribution and mana curve. Import decks from TXT files (MTGA / Moxfield format: '4 Lightning Bolt' per line) or JSON." },
        { icon: "bulb-outline" as const, title: "Deck Ideas (31+ Archetypes)", text: "Ready-made decklists for Commander, Standard, Pioneer, Modern and Draft — including 5 fully built 100-card Commander decks. Tap any card to search it directly." },
        { icon: "git-merge-outline" as const, title: "Commander Combos", text: "Shows known combo interactions for each card via Commander Spellbook — great for finding synergies in Commander decks." },
        { icon: "albums-outline" as const, title: "Similar Cards (EDHREC)", text: "Displays cards with similar abilities or synergies based on EDHREC data — helpful for deckbuilding and finding replacements." },
        { icon: "gift-outline" as const, title: "Booster Pack Availability", text: "Shows which booster sets each card appears in — tapping opens an Amazon search so you can order the pack directly." },
        { icon: "desktop-outline" as const, title: "PC / Desktop Support", text: "The app is fully usable in the PC browser too — with a sidebar navigation instead of bottom tabs." },
      ]
    : [
        { icon: "search-outline" as const, title: "Kartensuche (DE + EN)", text: "Suche mit deutschem oder englischem Kartennamen — vollständige Kartenansicht mit Bild, Typ, Seltenheit, Manakosten und Formatlegality (Standard, Pioneer, Modern, Legacy, Commander)." },
        { icon: "book-outline" as const, title: "95+ Schlüsselwörter Offline", text: "Alle wichtigen Keywords erklärt — von Klassikern wie Fliegen und Trampeln bis zu neueren wie Freies Laufen oder Streunen. Jederzeit offline verfügbar, ohne Internet." },
        { icon: "heart-outline" as const, title: "Favoriten & Verlauf", text: "Lieblingskarten speichern für schnellen Zugriff. Zuletzt gesuchte Karten werden automatisch gemerkt — kein erneutes Suchen nötig." },
        { icon: "layers-outline" as const, title: "Deck-Builder + Import", text: "Decks erstellen, Karten hinzufügen und die Mana-Analyse einsehen: Ø Manakosten, Farbverteilung und Manakurve. Decks importieren aus TXT-Dateien (MTGA/Moxfield-Format: '4 Blitz' pro Zeile) oder JSON." },
        { icon: "bulb-outline" as const, title: "Deck-Ideen (31+ Archetypen)", text: "Fertige Decklisten für Commander, Standard, Pioneer, Modern und Draft — darunter 5 vollständige 100-Karten-Commander-Decks. Tippe auf eine Karte um sie direkt zu suchen." },
        { icon: "git-merge-outline" as const, title: "Commander-Kombos", text: "Zeigt bekannte Kombo-Interaktionen für jede Karte via Commander Spellbook — ideal zum Finden von Synergien im Commander-Format." },
        { icon: "albums-outline" as const, title: "Ähnliche Karten (EDHREC)", text: "Zeigt Karten mit ähnlichen Fähigkeiten oder Synergien basierend auf EDHREC-Daten — hilfreich beim Deck-Bau und für Ersatzoptionen." },
        { icon: "gift-outline" as const, title: "Booster-Pack-Verfügbarkeit", text: "Zeigt, in welchen Booster-Sets eine Karte enthalten ist — Tippen öffnet eine Amazon-Suche damit du das Pack direkt bestellen kannst." },
        { icon: "desktop-outline" as const, title: "PC / Desktop-Unterstützung", text: "Die App ist auch vollständig im PC-Browser nutzbar — mit Seitenleiste statt Bottom-Navigation." },
      ];

  const tips = showEnglish
    ? [
        "Card search requires an internet connection. All keywords work offline at any time.",
        "The app supports both German and English card names — just type and search.",
        "Decks can be imported from TXT files (MTGA / Moxfield format) or from app-exported JSON.",
        "Deck ideas show complete ready-to-play decklists — tap any card to look it up immediately.",
        "Combo and similar card data come from external sources and may not always be complete or up to date.",
        "Booster pack links open Amazon — search results may vary depending on availability.",
      ]
    : [
        "Die Kartensuche benötigt eine Internetverbindung. Alle Schlüsselwörter funktionieren jederzeit offline.",
        "Die App unterstützt sowohl deutsche als auch englische Kartennamen — einfach eingeben und suchen.",
        "Decks können aus TXT-Dateien importiert werden (MTGA/Moxfield-Format) oder als App-JSON.",
        "Deck-Ideen zeigen fertige, spielfertige Decklisten — tippe auf eine Karte um sie sofort nachzuschlagen.",
        "Kombo- und ähnliche Kartendaten stammen von externen Quellen und sind möglicherweise nicht vollständig oder aktuell.",
        "Booster-Pack-Links öffnen Amazon — Suchergebnisse können je nach Verfügbarkeit variieren.",
      ];

  const introText = showEnglish
    ? "I developed this app for Magic: The Gathering players who want to quickly look up what certain card abilities mean during a game — all explained in German, with an optional English mode."
    : "Ich habe diese App für Magic: The Gathering-Spieler entwickelt, die beim Spielen schnell nachschlagen möchten, was bestimmte Kartenfähigkeiten bedeuten — alles auf Deutsch erklärt, mit optionalem Englisch-Modus.";

  const featuresTitle = showEnglish ? "What the app can do" : "Was die App kann";
  const tipsTitle = showEnglish ? "What to keep in mind" : "Worauf du achten solltest";
  const disclaimerTitle = showEnglish ? "Disclaimer" : "Hinweis";
  const disclaimerText = showEnglish
    ? "All information in this app is provided without guarantee. Card data, prices, combo entries, format legalities and availability may be incorrect or outdated. The app is an independent fan project and is not affiliated with Wizards of the Coast."
    : "Alle Angaben in dieser App sind ohne Gewähr. Kartendaten, Preise, Kombo-Einträge, Formatlegality und Verfügbarkeiten können fehlerhaft oder veraltet sein. Die App ist ein unabhängiges Fan-Projekt und steht in keiner Verbindung zu Wizards of the Coast.";

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

      <View style={[styles.disclaimerBox, { backgroundColor: colors.muted + "40", borderColor: colors.border }]}>
        <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} style={{ marginRight: 6, marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.disclaimerTitle, { color: colors.mutedForeground }]}>{disclaimerTitle}</Text>
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>{disclaimerText}</Text>
        </View>
      </View>
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

        {/* Impressum & Datenschutz */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            {showEnglish ? "LEGAL" : "RECHTLICHES"}
          </Text>
          <TouchableOpacity
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => Linking.openURL("https://magic-keyword-explainer.replit.app/impressum")}
          >
            <View style={styles.rowLeft}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                {showEnglish ? "Legal Notice (Impressum)" : "Impressum"}
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {showEnglish ? "Operator & contact" : "Betreiber & Kontakt"}
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0, borderBottomColor: colors.border }]}
            onPress={() => Linking.openURL("https://magic-keyword-explainer.replit.app/datenschutz")}
          >
            <View style={styles.rowLeft}>
              <Text style={[styles.rowLabel, { color: colors.foreground }]}>
                {showEnglish ? "Privacy Policy" : "Datenschutzerklärung"}
              </Text>
              <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                {showEnglish ? "Data usage & your rights" : "Datennutzung & deine Rechte"}
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Feedback */}
        <TouchableOpacity
          style={[styles.feedbackBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
          activeOpacity={0.75}
          onPress={() =>
            Linking.openURL(
              `mailto:info@greenorbital.de?subject=${encodeURIComponent(
                showEnglish ? "Master of MtG — Feedback" : "Master of MtG — Feedback"
              )}&body=${encodeURIComponent(
                showEnglish
                  ? "Hello,\n\nI have the following feedback for Master of MtG:\n\n"
                  : "Hallo,\n\nIch habe folgendes Feedback zu Master of MtG:\n\n"
              )}`
            )
          }
        >
          <View style={[styles.feedbackIconWrap, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="mail-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.feedbackTitle, { color: colors.foreground }]}>
              {showEnglish ? "Send Feedback" : "Feedback senden"}
            </Text>
            <Text style={[styles.feedbackSub, { color: colors.mutedForeground }]}>
              info@greenorbital.de
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

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
  disclaimerBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 20,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  disclaimerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  feedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  feedbackIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  feedbackSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
