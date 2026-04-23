import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

const STORAGE_KEY = "disclaimer_accepted_v1";

export function DisclaimerModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) setVisible(true);
    });
  }, []);

  const handleAccept = () => {
    AsyncStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const t = (de: string, en: string) => (showEnglish ? en : de);

  const sections = [
    {
      icon: "shield-checkmark-outline" as const,
      color: "#4ade80",
      title: t("Inoffizielles Fan-Projekt", "Unofficial Fan Project"),
      text: t(
        "MtG Master ist ein unabhängiges Fan-Projekt und steht in keiner Verbindung zu Wizards of the Coast LLC. Magic: The Gathering® ist eine eingetragene Marke von Wizards of the Coast. Alle Rechte liegen beim jeweiligen Rechteinhaber.",
        "MtG Master is an independent fan project and is not affiliated with Wizards of the Coast LLC. Magic: The Gathering® is a registered trademark of Wizards of the Coast. All rights belong to their respective owners."
      ),
    },
    {
      icon: "pricetag-outline" as const,
      color: "#fb923c",
      title: t("Affiliate-Hinweis (Werbung)", "Affiliate Disclosure (Advertisement)"),
      text: t(
        'Diese App enthält Affiliate-Links zu Amazon.de und Amazon.com. Wenn du über diese Links einkaufst, erhalten wir eine kleine Provision — ohne Mehrkosten für dich. Werbeanzeigen sind klar als "Werbung" bzw. "Amazon-Affiliate-Link" gekennzeichnet.',
        "This app contains affiliate links to Amazon.de and Amazon.com. If you make a purchase through these links, we receive a small commission at no extra cost to you. All advertisements are clearly labeled as 'Advertisement' or 'Amazon Affiliate Link'."
      ),
    },
    {
      icon: "information-circle-outline" as const,
      color: colors.primary,
      title: t("Datengenauigkeit", "Data Accuracy"),
      text: t(
        "Kartendaten stammen von Scryfall. Alle Angaben sind ohne Gewähr — Preise, Legality und Verfügbarkeiten können fehlerhaft oder veraltet sein.",
        "Card data is sourced from Scryfall. All information is provided without guarantee — prices, legality and availability may be incorrect or outdated."
      ),
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom + 16, 24),
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "1a" }]}>
              <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {t("Wichtige Hinweise", "Important Notices")}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {t("Bitte einmal kurz lesen", "Please read once before continuing")}
              </Text>
            </View>
          </View>

          <ScrollView
            style={{ maxHeight: Platform.OS === "web" ? 340 : 320 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.section,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  i < sections.length - 1 && { marginBottom: 10 },
                ]}
              >
                <View style={[styles.sectionIcon, { backgroundColor: s.color + "1a" }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{s.title}</Text>
                  <Text style={[styles.sectionText, { color: colors.mutedForeground }]}>{s.text}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Accept button */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={handleAccept}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={18} color="#0f0d0a" />
            <Text style={styles.btnText}>
              {t("Verstanden & Fortfahren", "Understood & Continue")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    maxWidth: 520,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 14,
    marginBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  section: {
    flexDirection: "row",
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: "flex-start",
  },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
  },
  btnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#0f0d0a",
  },
});
