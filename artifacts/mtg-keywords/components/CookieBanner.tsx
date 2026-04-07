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

const STORAGE_KEY = "cookie_consent_v1";

export function CookieBanner({ showEnglish }: { showEnglish: boolean }) {
  const [visible, setVisible] = useState(false);
  const [anim] = useState(new Animated.Value(0));

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (!val) setVisible(true);
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
            {showEnglish ? "Privacy & Data" : "Datenschutz & Cookies"}
          </Text>
        </View>

        <Text style={styles.body}>
          {showEnglish
            ? "This app loads card images and data from Scryfall (external API). No personal data is collected by us. Amazon affiliate links are used when you open purchase links — Amazon may set cookies on their site. Your app settings are stored locally on your device only.\n\nFor details, see our Privacy Policy."
            : "Diese App lädt Kartenbilder und -daten von Scryfall (externe API). Wir selbst erheben keine personenbezogenen Daten. Bei Klick auf Kauflinks werden Amazon-Affiliate-Links genutzt — Amazon kann auf der eigenen Seite Cookies setzen. Deine App-Einstellungen werden ausschließlich lokal auf deinem Gerät gespeichert.\n\nDetails findest du in unserer Datenschutzerklärung."}
        </Text>

        <TouchableOpacity onPress={() => Linking.openURL("https://magic-keyword-explainer.replit.app/datenschutz")} style={styles.link}>
          <Text style={styles.linkText}>
            {showEnglish ? "Privacy Policy" : "Datenschutzerklärung"}
          </Text>
          <Ionicons name="open-outline" size={12} color="#7c3aed" />
        </TouchableOpacity>

        <View style={styles.buttons}>
          <TouchableOpacity style={styles.btnAccept} onPress={() => dismiss(true)}>
            <Text style={styles.btnAcceptText}>
              {showEnglish ? "Understood" : "Verstanden"}
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
