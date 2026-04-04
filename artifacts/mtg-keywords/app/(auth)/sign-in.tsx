import { Ionicons } from "@expo/vector-icons";
import { useSSO } from "@clerk/expo";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();

  const [loadingProvider, setLoadingProvider] = useState<"google" | "apple" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSSO(provider: "oauth_google" | "oauth_apple") {
    const key = provider === "oauth_google" ? "google" : "apple";
    setLoadingProvider(key);
    setErrorMsg(null);

    try {
      const redirectUrl = Linking.createURL("/");
      const { createdSessionId, setActive } = await startSSOFlow({ strategy: provider, redirectUrl });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        if (Platform.OS === "web") {
          window.location.replace("/");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        setErrorMsg(showEnglish
          ? "Sign-in was cancelled. Please try again."
          : "Anmeldung wurde abgebrochen. Bitte erneut versuchen.");
      }
    } catch (err: any) {
      console.error("[SSO]", JSON.stringify(err));
      const code = err?.errors?.[0]?.code ?? "";
      if (code.includes("oauth") || code.includes("callback")) {
        setErrorMsg(showEnglish
          ? "OAuth error. Please check your internet connection and try again."
          : "OAuth-Fehler. Bitte Internetverbindung prüfen und erneut versuchen.");
      } else {
        setErrorMsg(showEnglish ? "An error occurred." : "Ein Fehler ist aufgetreten.");
      }
    } finally {
      setLoadingProvider(null);
    }
  }

  const isLoading = loadingProvider !== null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="shield-checkmark-outline" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {showEnglish ? "Sign In" : "Anmelden"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {showEnglish
              ? "Sign in to sync your decks and favorites across all devices."
              : "Melde dich an, um Decks und Favoriten auf allen Geräten zu synchronisieren."}
          </Text>
        </View>

        {/* Social Buttons */}
        <View style={styles.btnGroup}>
          {/* Google */}
          <TouchableOpacity
            style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleSSO("oauth_google")}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {loadingProvider === "google" ? (
              <ActivityIndicator size="small" color={colors.foreground} style={{ width: 22 }} />
            ) : (
              <Text style={styles.googleG}>G</Text>
            )}
            <Text style={[styles.socialBtnText, { color: colors.foreground }]}>
              {showEnglish ? "Continue with Google" : "Mit Google anmelden"}
            </Text>
          </TouchableOpacity>

          {/* Apple — iOS + web only */}
          {(Platform.OS === "ios" || Platform.OS === "web") && (
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: "#000", borderColor: "#333" }]}
              onPress={() => handleSSO("oauth_apple")}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {loadingProvider === "apple" ? (
                <ActivityIndicator size="small" color="#fff" style={{ width: 22 }} />
              ) : (
                <Ionicons name="logo-apple" size={20} color="#fff" style={{ width: 22, textAlign: "center" }} />
              )}
              <Text style={[styles.socialBtnText, { color: "#fff" }]}>
                {showEnglish ? "Continue with Apple" : "Mit Apple anmelden"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Error */}
        {errorMsg && (
          <Text style={[styles.error, { color: "#ef4444" }]}>{errorMsg}</Text>
        )}

        {/* Info note */}
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          {showEnglish
            ? "A new account is created automatically on first sign-in."
            : "Ein Konto wird beim ersten Anmelden automatisch erstellt."}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24, flexGrow: 1 },
  backBtn: { marginBottom: 28, alignSelf: "flex-start" },
  header: { alignItems: "center", marginBottom: 36 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 10 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, maxWidth: 300 },
  btnGroup: { gap: 12, marginBottom: 20 },
  socialBtn: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingVertical: 15, paddingHorizontal: 20, gap: 12 },
  socialBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  googleG: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#4285F4", width: 22, textAlign: "center" },
  error: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 16 },
  note: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8, lineHeight: 18 },
});
