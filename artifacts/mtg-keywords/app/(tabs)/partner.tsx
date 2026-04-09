import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { ShopNearbyModal } from "@/components/ShopNearbyModal";
import { LanguageToggle } from "@/components/LanguageToggle";

const CONTACT_EMAIL = "info@greenorbital.de";

// ── Registration email ────────────────────────────────────────────────────────

function buildRegistrationMailto(showEnglish: boolean) {
  const subject = showEnglish
    ? "Partner Network Registration – Master of MtG"
    : "Anmeldung Partnernetzwerk – Master of MtG";

  const body = showEnglish
    ? [
        "Partner Network Registration Form – Master of MtG",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "Shop Name:          ",
        "Owner / Contact:    ",
        "Email:              ",
        "Phone:              ",
        "Address:            ",
        "City:               ",
        "Country:            ",
        "Website:            ",
        "",
        "Short Description (opening hours, inventory, special offers):",
        "",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "Please fill in all fields and send this email to info@greenorbital.de.",
        "GreenOrbital will get back to you with the partner contract after receiving your registration.",
      ].join("\n")
    : [
        "Anmeldeformular – Partnernetzwerk Master of MtG",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "Shopname:           ",
        "Inhaber / Kontakt:  ",
        "E-Mail:             ",
        "Telefon:            ",
        "Adresse:            ",
        "Stadt:              ",
        "Land:               ",
        "Website:            ",
        "",
        "Kurzbeschreibung (Öffnungszeiten, Sortiment, besondere Angebote):",
        "",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "Bitte alle Felder ausfüllen und diese E-Mail an info@greenorbital.de senden.",
        "GreenOrbital meldet sich nach Eingang der Anmeldung mit dem Partnervertrag.",
      ].join("\n");

  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function PartnerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  const [showDirectory, setShowDirectory] = useState(false);

  const t = (de: string, en: string) => (showEnglish ? en : de);

  const bodyDE = [
    `Hallo,`,
    ``,
    `ich nutze die App "Master of MtG" – ein kostenloses Tool für Magic: The Gathering-Spieler, das weit mehr kann als ein einfaches Kartenlexikon:`,
    ``,
    `- Kartensuche auf Deutsch & Englisch mit allen Details`,
    `- Schlüsselwörter & Regeln einfach erklärt`,
    `- Format-Legalität für Standard, Modern, Commander & mehr`,
    `- Deck-Builder mit Manapool-Berechnung`,
    `- Deck-Ideen mit Kartenvorschlägen nach Spielstil`,
    `- Commander-Combos über die Spellbook-Datenbank`,
    `- Booster-Pack-Verfügbarkeit je Karte`,
    `- Favoriten zum schnellen Nachschlagen`,
    ``,
    `Die App hat außerdem ein Partnernetzwerk, über das lokale Spieleläden direkt in der App angezeigt werden – genau dann, wenn Spieler eine Karte suchen oder ein Deck bauen. Das könnte gezielt mehr Laufkundschaft in deinen Laden bringen.`,
    ``,
    `Mehr Infos oder Anmeldung: info@greenorbital.de`,
    ``,
    `Viele Grüße`,
  ].join("\n");

  const bodyEN = [
    `Hi,`,
    ``,
    `I use the app "Master of MtG" – a free tool for Magic: The Gathering players that goes well beyond a simple card encyclopedia:`,
    ``,
    `- Card search in German & English with full details`,
    `- Keywords & rules explained in plain language`,
    `- Format legality for Standard, Modern, Commander & more`,
    `- Deck builder with mana pool calculation`,
    `- Deck ideas with card suggestions based on play style`,
    `- Commander combos via the Spellbook database`,
    `- Booster pack availability per card`,
    `- Favorites for quick lookups`,
    ``,
    `The app also features a partner network where local game stores are shown directly in the app – right when players are searching for cards or building decks. This could bring targeted foot traffic to your store.`,
    ``,
    `More info or sign-up: info@greenorbital.de`,
    ``,
    `Best regards`,
  ].join("\n");

  const subjectDE = "Eine App, die deinen Shop interessieren könnte – Master of MtG";
  const subjectEN = "An App That Might Interest Your Store – Master of MtG";

  const handleRecommend = async () => {
    const subject = showEnglish ? subjectEN : subjectDE;
    const body = showEnglish ? bodyEN : bodyDE;
    if (Platform.OS === "web") {
      Linking.openURL(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    } else {
      try {
        await Share.share({ message: `${subject}\n\n${body}` });
      } catch {
        Linking.openURL(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
      }
    }
  };

  const handleRegister = () => {
    const url = buildRegistrationMailto(showEnglish);
    Linking.openURL(url).catch(() => {
      if (Platform.OS === "web") {
        Alert.alert(
          t("E-Mail-App nicht gefunden", "Email App Not Found"),
          t(
            `Bitte sende das Anmeldeformular manuell an:\n\n${CONTACT_EMAIL}`,
            `Please send the registration form manually to:\n\n${CONTACT_EMAIL}`
          )
        );
      }
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              {t("Partnernetzwerk", "Partner Network")}
            </Text>
            <LanguageToggle />
          </View>
          <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="storefront-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {t(
              "Bringe deinen Spieleladen näher zu Magic: The Gathering-Spielern",
              "Bring your local game store closer to Magic: The Gathering players"
            )}
          </Text>
        </View>

        {/* Directory CTA */}
        <TouchableOpacity
          style={[styles.directoryCta, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setShowDirectory(true)}
          activeOpacity={0.82}
        >
          <Ionicons name="map-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.directoryCtaTitle, { color: colors.foreground }]}>
              {t("Shop-Verzeichnis ansehen", "Browse Shop Directory")}
            </Text>
            <Text style={[styles.directoryCtaSub, { color: colors.mutedForeground }]}>
              {t("Freigeschaltete Partner-Shops nach Land & Kontinent", "Approved partner shops by country & continent")}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Benefits */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {t("VORTEILE FÜR SHOPS", "BENEFITS FOR SHOPS")}
        </Text>
        <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {BENEFITS(t).map((b, i) => (
            <View key={b.title} style={[styles.benefitRow, i < 3 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={[styles.benefitIcon, { backgroundColor: colors.primary + "1a" }]}>
                <Ionicons name={b.icon as any} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.benefitTitle, { color: colors.foreground }]}>{b.title}</Text>
                <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>{b.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* How it works */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {t("SO FUNKTIONIERT ES", "HOW IT WORKS")}
        </Text>
        <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {STEPS(t).map((step, i) => (
            <View key={i} style={[styles.stepRow, i < 3 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
              <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.foreground }]}>{step.title}</Text>
                <Text style={[styles.stepText, { color: colors.mutedForeground }]}>{step.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {t("KONDITIONEN", "PRICING")}
        </Text>
        <View style={[styles.pricingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Early Bird */}
          <View style={[styles.pricingRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[styles.pricingLabel, { color: colors.foreground }]}>
                  {t("Early Bird – erste 50 Shops", "Early Bird – First 50 Shops")}
                </Text>
                <View style={[styles.badgeEarly, { backgroundColor: "#f59e0b22", borderColor: "#f59e0b55" }]}>
                  <Text style={[styles.badgeText, { color: "#f59e0b" }]}>{t("Begrenzt", "Limited")}</Text>
                </View>
              </View>
              <Text style={[styles.pricingDesc, { color: colors.mutedForeground }]}>
                {t("1. Monat kostenlos · danach monatlich kündbar", "1st month free · then cancel any time")}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.pricingAmount, { color: colors.primary }]}>€ 9,99</Text>
              <Text style={[styles.pricingPer, { color: colors.mutedForeground }]}>{t("/ Monat", "/ month")}</Text>
            </View>
          </View>
          {/* Standard */}
          <View style={styles.pricingRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.pricingLabel, { color: colors.foreground }]}>
                {t("Standard – ab Shop 51", "Standard – from Shop 51")}
              </Text>
              <Text style={[styles.pricingDesc, { color: colors.mutedForeground }]}>
                {t("Kein Jahresvertrag · jederzeit kündbar", "No annual contract · cancel any time")}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={[styles.pricingAmount, { color: colors.foreground }]}>€ 24,99</Text>
              <Text style={[styles.pricingPer, { color: colors.mutedForeground }]}>{t("/ Monat", "/ month")}</Text>
            </View>
          </View>
        </View>

        {/* CTAs */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{t("MITMACHEN", "GET STARTED")}</Text>

        <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: colors.primary }]} activeOpacity={0.82} onPress={handleRegister}>
          <Ionicons name="mail" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaBtnTitle}>{t("Meinen Shop anmelden", "Register My Shop")}</Text>
            <Text style={styles.ctaBtnSub}>{t("Anmeldeformular per E-Mail ausfüllen & senden", "Fill in the registration form by email & send")}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaBtnAlt, { backgroundColor: colors.card, borderColor: colors.primary + "55" }]}
          activeOpacity={0.82}
          onPress={handleRecommend}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctaBtnTitleAlt, { color: colors.foreground }]}>{t("Shop weiterempfehlen", "Recommend a Shop")}</Text>
            <Text style={[styles.ctaBtnSubAlt, { color: colors.mutedForeground }]}>
              {t("Fertige E-Mail an einen Spieleladen senden", "Send a pre-written email to a game store")}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={[styles.footerNote, { borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={15} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {t(
              "GreenOrbital prüft jede Anfrage individuell. Early-Bird-Konditionen gelten für die ersten 50 angemeldeten Shops — sichere dir jetzt deinen Platz.",
              "GreenOrbital reviews each application individually. Early Bird pricing applies to the first 50 registered shops — secure your spot now."
            )}
          </Text>
        </View>
      </ScrollView>

      <ShopNearbyModal visible={showDirectory} onClose={() => setShowDirectory(false)} />
    </View>
  );
}

const BENEFITS = (t: (de: string, en: string) => string) => [
  { icon: "people-outline", title: t("Mehr Laufkundschaft", "More Walk-In Customers"), text: t("MtG-Spieler aus deiner Region entdecken deinen Shop direkt beim Kartennachschlagen.", "MTG players in your region discover your shop right when they're looking up cards.") },
  { icon: "search-outline", title: t("Sichtbarkeit in der App", "App Visibility"), text: t("Dein Shop erscheint bei relevanten Karten- und Deck-Suchen.", "Your shop appears during relevant card and deck searches.") },
  { icon: "trending-up-outline", title: t("Wachsende Community", "Growing Community"), text: t("Master of MtG wird täglich von MtG-Spielern genutzt. Dein Shop profitiert direkt.", "Master of MtG is used daily by MTG players. Your shop benefits directly.") },
  { icon: "star-outline", title: t("Faire Konditionen", "Fair Pricing"), text: t("Kleine monatliche Gebühr, kein Jahresvertrag, jederzeit kündbar.", "Small monthly fee, no annual contract, cancel any time.") },
];

const STEPS = (t: (de: string, en: string) => string) => [
  { title: t("Anmeldeformular per E-Mail öffnen", "Open registration form by email"), text: t("Tippe auf den Button – deine Mail-App öffnet sich mit dem vorausgefüllten Formular.", "Tap the button – your email app opens with the pre-filled registration form.") },
  { title: t("Formular ausfüllen & absenden", "Fill in the form & send"), text: t("Trage deine Shop-Daten in die Felder ein und sende die E-Mail direkt an GreenOrbital.", "Enter your shop details in the fields and send the email directly to GreenOrbital.") },
  { title: t("Vertrag erhalten & unterzeichnen", "Receive & sign the contract"), text: t("GreenOrbital prüft deine Anfrage und schickt dir deinen Partnervertrag per E-Mail.", "GreenOrbital reviews your request and sends you the partner contract by email.") },
  { title: t("Shop wird freigeschaltet", "Shop goes live"), text: t("Nach Eingang des unterschriebenen Vertrags schalten wir deinen Shop im Netzwerk frei.", "After receiving the signed contract, we activate your shop in the network.") },
];

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, gap: 10 },
  headerTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "100%" },
  headerIconWrap: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", flex: 1 },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },

  directoryCta: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginBottom: 20, borderRadius: 14, borderWidth: 1, padding: 14 },
  directoryCtaTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  directoryCtaSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginHorizontal: 16, marginBottom: 8, marginTop: 4 },

  benefitsCard: { marginHorizontal: 16, marginBottom: 20, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  benefitRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 14 },
  benefitIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  benefitTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  benefitText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  stepsCard: { marginHorizontal: 16, marginBottom: 20, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  stepRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 14 },
  stepNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 },
  stepNumText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  stepTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  stepText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  ctaBtn: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  ctaBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },
  ctaBtnSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
  ctaBtnAlt: { flexDirection: "row", alignItems: "center", gap: 12, marginHorizontal: 16, marginBottom: 12, borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 14 },
  ctaBtnTitleAlt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  ctaBtnSubAlt: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  footerNote: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginHorizontal: 16, marginTop: 4, marginBottom: 8, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16 },
  footerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  pricingCard: { marginHorizontal: 16, marginBottom: 20, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  pricingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  pricingLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", flexShrink: 1 },
  pricingDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  pricingAmount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  pricingPer: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  badgeEarly: { borderRadius: 6, borderWidth: 1, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3 },
});
