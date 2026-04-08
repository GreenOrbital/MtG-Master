import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const STORAGE_KEY = "cookie_consent_v2";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function grantAnalytics() {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.gtag) {
    window.gtag("consent", "update", { analytics_storage: "granted" });
    window.gtag("config", "G-JN3SH0Y1VB", { send_page_view: true });
  }
}

function denyAnalytics() {
  if (Platform.OS === "web" && typeof window !== "undefined" && window.gtag) {
    window.gtag("consent", "update", { analytics_storage: "denied" });
  }
}

export function CookieBanner({ showEnglish }: { showEnglish: boolean }) {
  const [visible, setVisible] = useState(false);
  const [anim] = useState(new Animated.Value(0));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) {
        setVisible(true);
      } else if (val === "accepted") {
        grantAnalytics();
      } else {
        denyAnalytics();
      }
    });
  }, []);

  useEffect(() => {
    if (visible) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }
  }, [visible]);

  const dismiss = (accepted: boolean) => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== "web",
    }).start(() => setVisible(false));
    AsyncStorage.setItem(STORAGE_KEY, accepted ? "accepted" : "declined");
    if (accepted) {
      grantAnalytics();
    } else {
      denyAnalytics();
    }
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.banner}>
        <View style={styles.top}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#7c3aed" style={{ marginRight: 8 }} />
          <Text style={styles.title}>
            {showEnglish ? "Privacy & Cookies" : "Datenschutz & Cookies"}
          </Text>
        </View>

        <Text style={styles.body}>
          {showEnglish
            ? "This app loads card images and data from Scryfall (external API). We use Google Analytics to understand how the app is used — this requires your consent. Amazon affiliate links may set cookies on Amazon's site. Your app data is stored locally only."
            : "Diese App lädt Kartendaten von Scryfall (externe API). Wir nutzen Google Analytics, um die App-Nutzung besser zu verstehen — dafür benötigen wir deine Einwilligung. Bei Amazon-Affiliate-Links können auf Amazon's Seite Cookies gesetzt werden. Deine App-Daten werden ausschließlich lokal gespeichert."}
        </Text>

        <View style={styles.analyticsRow}>
          <Ionicons name="bar-chart-outline" size={13} color="#06b6d4" />
          <Text style={styles.analyticsText}>
            {showEnglish ? "Google Analytics (anonymous usage data)" : "Google Analytics (anonyme Nutzungsdaten)"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => Linking.openURL("https://masterofmtg.replit.app/datenschutz")}
          style={styles.link}
        >
          <Text style={styles.linkText}>
            {showEnglish ? "Privacy Policy" : "Datenschutzerklärung"}
          </Text>
          <Ionicons name="open-outline" size={12} color="#7c3aed" />
        </TouchableOpacity>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btnDecline} onPress={() => dismiss(false)}>
            <Text style={styles.btnDeclineText}>
              {showEnglish ? "Decline" : "Ablehnen"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnAccept} onPress={() => dismiss(true)}>
            <Text style={styles.btnAcceptText}>
              {showEnglish ? "Accept" : "Zustimmen"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    padding: 12,
  },
  banner: {
    backgroundColor: "#0d0d1f",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#7c3aed55",
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 20,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  body: {
    color: "#a0a0b8",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 10,
  },
  analyticsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#06b6d411",
    borderWidth: 1,
    borderColor: "#06b6d433",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  analyticsText: {
    color: "#06b6d4",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 14,
  },
  linkText: {
    color: "#7c3aed",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline",
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
  },
  btnDecline: {
    flex: 1,
    backgroundColor: "transparent",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#444466",
    paddingVertical: 11,
    alignItems: "center",
  },
  btnDeclineText: {
    color: "#a0a0b8",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  btnAccept: {
    flex: 1,
    backgroundColor: "#7c3aed",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  btnAcceptText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
});
