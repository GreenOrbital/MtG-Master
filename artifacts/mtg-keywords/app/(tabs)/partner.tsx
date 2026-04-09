import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { ShopNearbyModal, getPartnerApiBase } from "@/components/ShopNearbyModal";
import { COUNTRIES_DE, COUNTRIES_EN, getContinent } from "@/utils/continentMap";
import { LanguageToggle } from "@/components/LanguageToggle";

const CONTACT_EMAIL = "info@greenorbital.de";

// ── Registration Form Modal ──────────────────────────────────────────────────

function RegisterModal({ visible, onClose, showEnglish }: { visible: boolean; onClose: () => void; showEnglish: boolean }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const t = (de: string, en: string) => (showEnglish ? en : de);
  const countries = showEnglish ? COUNTRIES_EN : COUNTRIES_DE;

  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const reset = () => {
    setShopName(""); setOwnerName(""); setEmail(""); setPhone("");
    setAddress(""); setCity(""); setCountry(""); setWebsite("");
    setDescription(""); setErrorMsg(""); setSuccess(false); setCountrySearch("");
  };

  const handleClose = () => { reset(); onClose(); };

  const filteredCountries = countries.filter((c) =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!shopName.trim() || !ownerName.trim() || !email.trim() || !city.trim() || !country.trim()) {
      setErrorMsg(t("Bitte alle Pflichtfelder ausfüllen.", "Please fill in all required fields."));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg(t("Ungültige E-Mail-Adresse.", "Invalid email address."));
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    try {
      const continent = getContinent(country);
      const res = await fetch(`${getPartnerApiBase()}/partner/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shopName.trim(),
          ownerName: ownerName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim(),
          country,
          continent,
          website: website.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? t("Ein Fehler ist aufgetreten.", "An error occurred."));
      } else {
        setSuccess(true);
      }
    } catch {
      setErrorMsg(t("Verbindungsfehler. Bitte versuche es später.", "Connection error. Please try again later."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 16) }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>
            {t("Shop anmelden", "Register Shop")}
          </Text>
          <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
            <Ionicons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {success ? (
          <View style={styles.successWrap}>
            <View style={[styles.successIcon, { backgroundColor: "#16a34a22" }]}>
              <Ionicons name="checkmark-circle" size={52} color="#16a34a" />
            </View>
            <Text style={[styles.successTitle, { color: colors.foreground }]}>
              {t("Anfrage gesendet!", "Request Sent!")}
            </Text>
            <Text style={[styles.successText, { color: colors.mutedForeground }]}>
              {t(
                "Wir haben deine Anfrage erhalten und werden uns in Kürze per E-Mail bei dir melden. Du erhältst dann deinen Partnervertrag.",
                "We have received your request and will contact you by email shortly. You will then receive your partner contract."
              )}
            </Text>
            <TouchableOpacity
              style={[styles.successBtn, { backgroundColor: colors.primary }]}
              onPress={handleClose}
            >
              <Text style={styles.successBtnText}>{t("Schließen", "Close")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.formScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Info */}
            <View style={[styles.formInfoBox, { backgroundColor: colors.primary + "14", borderColor: colors.primary + "44" }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
              <Text style={[styles.formInfoText, { color: colors.foreground }]}>
                {t(
                  "Nach der Registrierung erhältst du per E-Mail deinen Partnervertrag. Erst nach Vertragsunterzeichnung wird dein Shop freigeschaltet.",
                  "After registration you will receive your partner contract by email. Your shop will only be activated after signing the contract."
                )}
              </Text>
            </View>

            {/* Fields */}
            <Field label={t("Shopname *", "Shop Name *")} value={shopName} onChange={setShopName} placeholder={t("z.B. Magic Corner Berlin", "e.g. Magic Corner Berlin")} colors={colors} />
            <Field label={t("Inhaber / Kontaktperson *", "Owner / Contact Person *")} value={ownerName} onChange={setOwnerName} placeholder={t("Vollständiger Name", "Full name")} colors={colors} />
            <Field label={t("E-Mail-Adresse *", "Email Address *")} value={email} onChange={setEmail} placeholder="shop@beispiel.de" colors={colors} keyboard="email-address" autoCapitalize="none" />
            <Field label={t("Telefon", "Phone")} value={phone} onChange={setPhone} placeholder="+49 30 12345678" colors={colors} keyboard="phone-pad" />
            <Field label={t("Adresse (Straße & Nr.)", "Address (Street & No.)")} value={address} onChange={setAddress} placeholder={t("Musterstraße 1", "123 Main Street")} colors={colors} />
            <Field label={t("Stadt *", "City *")} value={city} onChange={setCity} placeholder={t("Berlin", "Berlin")} colors={colors} />

            {/* Country picker */}
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{t("Land *", "Country *")}</Text>
            <TouchableOpacity
              style={[styles.countryPicker, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text style={[styles.countryPickerText, { color: country ? colors.foreground : colors.mutedForeground }]}>
                {country || t("Land auswählen…", "Select country…")}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>

            <Field label={t("Website", "Website")} value={website} onChange={setWebsite} placeholder="https://meinshop.de" colors={colors} autoCapitalize="none" keyboard="url" />
            <Field label={t("Kurzbeschreibung", "Short Description")} value={description} onChange={setDescription} placeholder={t("Öffnungszeiten, Sortiment, besondere Angebote…", "Opening hours, inventory, special offers…")} colors={colors} multiline />

            {errorMsg ? (
              <View style={[styles.errorBox, { backgroundColor: "#ef444418", borderColor: "#ef444444" }]}>
                <Ionicons name="alert-circle-outline" size={15} color="#ef4444" />
                <Text style={{ color: "#ef4444", fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 }}>{errorMsg}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: submitting ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.submitBtnText}>{t("Anmeldung absenden", "Submit Registration")}</Text>
              }
            </TouchableOpacity>

            <Text style={[styles.legalNote, { color: colors.mutedForeground }]}>
              {t(
                "Mit dem Absenden stimmst du zu, dass GreenOrbital deine Daten zur Bearbeitung deiner Anfrage verwendet. Es gelten unsere Datenschutzbestimmungen.",
                "By submitting you agree that GreenOrbital uses your data to process your request. Our privacy policy applies."
              )}
            </Text>
          </ScrollView>
        )}
      </View>

      {/* Country picker modal */}
      <Modal visible={showCountryPicker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCountryPicker(false)}>
        <View style={[styles.root, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>{t("Land wählen", "Select Country")}</Text>
            <TouchableOpacity onPress={() => setShowCountryPicker(false)} style={[styles.closeBtn, { backgroundColor: colors.card }]}>
              <Ionicons name="close" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchWrap, { borderBottomColor: colors.border }]}>
            <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder={t("Suchen…", "Search…")}
              placeholderTextColor={colors.mutedForeground}
              value={countrySearch}
              onChangeText={setCountrySearch}
              autoFocus
            />
          </View>
          <ScrollView>
            {filteredCountries.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.countryItem, { borderBottomColor: colors.border, backgroundColor: c === country ? colors.primary + "18" : "transparent" }]}
                onPress={() => { setCountry(c); setShowCountryPicker(false); setCountrySearch(""); }}
              >
                <Text style={[styles.countryItemText, { color: c === country ? colors.primary : colors.foreground }]}>{c}</Text>
                {c === country && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}

function Field({ label, value, onChange, placeholder, colors, keyboard, autoCapitalize, multiline }: any) {
  return (
    <>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, height: multiline ? 80 : undefined, textAlignVertical: multiline ? "top" : "center" }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboard ?? "default"}
        autoCapitalize={autoCapitalize ?? "words"}
        multiline={multiline}
      />
    </>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

export default function PartnerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 + 34 : insets.bottom + 84;

  const [showRegister, setShowRegister] = useState(false);
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

        {/* CTAs */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{t("MITMACHEN", "GET STARTED")}</Text>

        <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: colors.primary }]} activeOpacity={0.82} onPress={() => setShowRegister(true)}>
          <Ionicons name="storefront" size={20} color="#fff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaBtnTitle}>{t("Meinen Shop anmelden", "Register My Shop")}</Text>
            <Text style={styles.ctaBtnSub}>{t("Anmeldeformular ausfüllen & Vertrag erhalten", "Fill in registration form & receive contract")}</Text>
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
              "Die Aufnahme ins Netzwerk kostet eine kleine monatliche Gebühr — kein Jahresvertrag, jederzeit kündbar. GreenOrbital prüft jede Anfrage individuell.",
              "Joining the network costs a small monthly fee — no annual contract, cancel any time. GreenOrbital reviews each application individually."
            )}
          </Text>
        </View>
      </ScrollView>

      <RegisterModal visible={showRegister} onClose={() => setShowRegister(false)} showEnglish={showEnglish} />
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
  { title: t("Formular ausfüllen", "Fill in the form"), text: t("Registriere deinen Shop über das Anmeldeformular in der App.", "Register your shop using the in-app registration form.") },
  { title: t("Vertrag erhalten", "Receive contract"), text: t("GreenOrbital prüft deine Anfrage und schickt dir deinen Partnervertrag per E-Mail.", "GreenOrbital reviews your request and sends you the partner contract by email.") },
  { title: t("Vertrag unterzeichnen", "Sign the contract"), text: t("Unterzeichne den Vertrag und sende ihn zurück.", "Sign the contract and return it.") },
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

  // Modal styles
  modalHeader: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 20 },
  modalTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold" },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  formScroll: { padding: 16, paddingBottom: 48 },
  formInfoBox: { flexDirection: "row", gap: 8, alignItems: "flex-start", borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 16 },
  formInfoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.3, marginBottom: 6, marginTop: 14 },
  fieldInput: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular" },
  countryPicker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11 },
  countryPickerText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  errorBox: { flexDirection: "row", gap: 8, alignItems: "flex-start", borderRadius: 8, borderWidth: 1, padding: 10, marginTop: 16 },
  submitBtn: { borderRadius: 12, padding: 15, alignItems: "center", marginTop: 20 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  legalNote: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, marginTop: 12, textAlign: "center" },

  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  successIcon: { width: 88, height: 88, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  successText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  successBtn: { borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 8 },
  successBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#fff" },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  countryItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  countryItemText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
