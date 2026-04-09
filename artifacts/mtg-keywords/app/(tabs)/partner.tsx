import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

const CONTACT_EMAIL = "info@greenorbital.de";

const BENEFITS_DE = [
  {
    icon: "people-outline" as const,
    title: "Mehr Laufkundschaft",
    text: "MtG-Spieler aus deiner Region entdecken deinen Shop direkt in der App — genau dann, wenn sie auf der Suche nach Karten oder Boostern sind.",
  },
  {
    icon: "search-outline" as const,
    title: "Sichtbarkeit bei Suchanfragen",
    text: "Dein Shop wird bei relevanten Kartensuchen empfohlen. So erreichst du Spieler genau in dem Moment, in dem sie kaufbereit sind.",
  },
  {
    icon: "star-outline" as const,
    title: "Kostenloser Eintrag",
    text: "Die Aufnahme ins Partnernetzwerk ist für Shops vollständig kostenlos. Kein Abo, keine versteckten Gebühren.",
  },
  {
    icon: "trending-up-outline" as const,
    title: "Wachsende Community",
    text: "Master of MtG wird von einer aktiven MtG-Spieler-Community genutzt. Dein Shop profitiert direkt von diesem Wachstum.",
  },
];

const BENEFITS_EN = [
  {
    icon: "people-outline" as const,
    title: "More Walk-In Customers",
    text: "MTG players in your region discover your shop directly in the app — right when they're looking for cards or booster packs.",
  },
  {
    icon: "search-outline" as const,
    title: "Visibility in Card Searches",
    text: "Your shop gets recommended during relevant card searches. You reach players exactly when they're ready to buy.",
  },
  {
    icon: "star-outline" as const,
    title: "Free Listing",
    text: "Joining the partner network is completely free for shops. No subscription, no hidden fees.",
  },
  {
    icon: "trending-up-outline" as const,
    title: "Growing Community",
    text: "Master of MtG is used by an active MTG player community. Your shop benefits directly from this growth.",
  },
];

export default function PartnerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  const benefits = showEnglish ? BENEFITS_EN : BENEFITS_DE;

  // ── Email: Operator kontaktieren ────────────────────────────────────────
  const contactSubject = showEnglish
    ? "Partner Network Request – Master of MtG"
    : "Partnernetzwerk-Anfrage – Master of MtG";
  const contactBody = showEnglish
    ? "Hello Master of MtG Team,\n\nI am interested in listing my shop in the Partner Network.\n\nShop name: \nCity: \nWebsite: \n\nBest regards,"
    : "Hallo Master of MtG Team,\n\nIch möchte meinen Shop ins Partnernetzwerk aufnehmen lassen.\n\nShopname: \nStadt: \nWebsite: \n\nViele Grüße,";

  const contactHref = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(contactSubject)}&body=${encodeURIComponent(contactBody)}`;

  // ── Email: Shop empfehlen ────────────────────────────────────────────────
  const recommendSubject = showEnglish
    ? "An app that might interest your store – Master of MtG"
    : "Eine App, die deinen Shop interessieren könnte – Master of MtG";
  const recommendBody = showEnglish
    ? `Hi,

I recently discovered the free app "Master of MtG" — a handy card lookup tool for Magic: The Gathering players. I thought it might be interesting for your store!

The app has a partner network where local game stores can be found by nearby players. Getting listed could bring more customers through your door.

You can contact the developer directly to join the network:
📧 ${CONTACT_EMAIL}
🌐 https://magic-keyword-explainer.replit.app

Best regards`
    : `Hallo,

ich nutze die kostenlose App „Master of MtG" — ein praktisches Kartenlexikon für Magic: The Gathering-Spieler. Ich dachte, das könnte auch für deinen Shop interessant sein!

Die App hat ein Partnernetzwerk, über das lokale Shops von Spielern in der Umgebung entdeckt werden können. Eine Aufnahme könnte mehr Kundschaft in deinen Laden bringen.

Du kannst den Entwickler direkt kontaktieren, um beizutreten:
📧 ${CONTACT_EMAIL}
🌐 https://magic-keyword-explainer.replit.app

Viele Grüße`;

  const recommendHref = `mailto:?subject=${encodeURIComponent(recommendSubject)}&body=${encodeURIComponent(recommendBody)}`;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={[styles.headerIconWrap, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="storefront-outline" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {showEnglish ? "Partner Network" : "Partnernetzwerk"}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {showEnglish
              ? "Bring your local game store closer to Magic: The Gathering players"
              : "Bringe deinen Spieleladen näher zu Magic: The Gathering-Spielern"}
          </Text>
        </View>

        {/* ── Intro-Box ───────────────────────────────────────────────────── */}
        <View style={[styles.introBox, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "44" }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
          <Text style={[styles.introText, { color: colors.foreground }]}>
            {showEnglish
              ? "Master of MtG connects Magic: The Gathering players with local game stores. As a partner, your shop appears directly in the app — completely free."
              : "Master of MtG verbindet Magic: The Gathering-Spieler mit lokalen Spieleläden. Als Partner erscheint dein Shop direkt in der App — vollständig kostenlos."}
          </Text>
        </View>

        {/* ── Benefits ───────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {showEnglish ? "WHY JOIN?" : "VORTEILE"}
        </Text>
        <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {benefits.map((b, i) => (
            <View
              key={b.title}
              style={[
                styles.benefitRow,
                i < benefits.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <View style={[styles.benefitIcon, { backgroundColor: colors.primary + "1a" }]}>
                <Ionicons name={b.icon} size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.benefitTitle, { color: colors.foreground }]}>{b.title}</Text>
                <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>{b.text}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── CTA Buttons ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          {showEnglish ? "GET STARTED" : "MITMACHEN"}
        </Text>

        {/* Shop anmelden */}
        <TouchableOpacity
          style={[styles.ctaBtn, styles.ctaBtnPrimary, { backgroundColor: colors.primary }]}
          activeOpacity={0.82}
          onPress={() => Linking.openURL(contactHref)}
        >
          <Ionicons name="storefront" size={20} color="#ffffff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaBtnTitle}>
              {showEnglish ? "Register My Shop" : "Meinen Shop anmelden"}
            </Text>
            <Text style={styles.ctaBtnSub}>
              {showEnglish ? "Contact GreenOrbital to join the network" : "GreenOrbital kontaktieren & Netzwerk beitreten"}
            </Text>
          </View>
          <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* Shop empfehlen */}
        <TouchableOpacity
          style={[styles.ctaBtn, styles.ctaBtnSecondary, { backgroundColor: colors.card, borderColor: colors.primary + "66" }]}
          activeOpacity={0.82}
          onPress={() => Linking.openURL(recommendHref)}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctaBtnTitleAlt, { color: colors.foreground }]}>
              {showEnglish ? "Recommend a Shop" : "Shop weiterempfehlen"}
            </Text>
            <Text style={[styles.ctaBtnSubAlt, { color: colors.mutedForeground }]}>
              {showEnglish
                ? "Send a pre-written recommendation email to a shop you know"
                : "Fertige E-Mail-Vorlage an einen Shop deiner Wahl senden"}
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* ── Footer Note ─────────────────────────────────────────────────── */}
        <View style={[styles.footerNote, { borderColor: colors.border }]}>
          <Ionicons name="checkmark-circle-outline" size={15} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            {showEnglish
              ? "Listings are free. GreenOrbital reviews each application individually."
              : "Die Aufnahme ist kostenlos. GreenOrbital prüft jede Anfrage individuell."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, gap: 10 },
  headerIconWrap: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 26, fontFamily: "Inter_700Bold", textAlign: "center" },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },

  introBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    marginHorizontal: 16, marginBottom: 20, borderRadius: 12,
    borderWidth: 1, padding: 14,
  },
  introText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  sectionTitle: {
    fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8,
    marginHorizontal: 16, marginBottom: 8, marginTop: 4,
  },

  benefitsCard: {
    marginHorizontal: 16, marginBottom: 20, borderRadius: 14,
    borderWidth: 1, overflow: "hidden",
  },
  benefitRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", padding: 14 },
  benefitIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  benefitTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 3 },
  benefitText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  ctaBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginHorizontal: 16, marginBottom: 12, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  ctaBtnPrimary: {},
  ctaBtnSecondary: { borderWidth: 1.5 },
  ctaBtnTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#ffffff" },
  ctaBtnSub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.75)", marginTop: 2 },
  ctaBtnTitleAlt: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  ctaBtnSubAlt: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },

  footerNote: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    marginHorizontal: 16, marginTop: 4, marginBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16,
  },
  footerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
