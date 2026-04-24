import { useOAuth, useSignIn, useUser, useAuth } from "@clerk/expo";
import * as Linking from "expo-linking";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

const BENEFITS_DE = [
  { icon: "sync-outline" as const,  text: "Favoriten & Decks geräteübergreifend synchronisieren" },
  { icon: "cloud-outline" as const, text: "Daten sicher in der Cloud gespeichert" },
];

const BENEFITS_EN = [
  { icon: "sync-outline" as const,  text: "Sync favorites & decks across all devices" },
  { icon: "cloud-outline" as const, text: "Data securely stored in the cloud" },
];

export function GoogleSignIn() {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setLoading(true);

      if (Platform.OS === "web") {
        // Mobile browsers block OAuth popups. Use a full-page redirect via
        // Clerk's signIn.authenticateWithRedirect so the browser navigates
        // to Google directly and returns to /sso-callback to finalize.
        if (!signInLoaded || !signIn) return;
        const origin =
          typeof window !== "undefined" ? window.location.origin : "";
        await signIn.authenticateWithRedirect({
          strategy: "oauth_google",
          redirectUrl: origin + "/sso-callback",
          redirectUrlComplete: origin + "/",
        });
        return;
      }

      // Native iOS/Android — use the in-app browser flow.
      const { createdSessionId, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL("/", { scheme: "mtg-keywords" }),
      });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (err) {
      console.error("Google Sign-In Fehler:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign-Out Fehler:", err);
    }
  };

  if (isSignedIn && user) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {user.fullName ?? user.emailAddresses[0]?.emailAddress}
            </Text>
            <Text style={[styles.email, { color: colors.mutedForeground }]} numberOfLines={1}>
              {user.emailAddresses[0]?.emailAddress}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: colors.border }]}
          onPress={handleSignOut}
          activeOpacity={0.75}
        >
          <Text style={[styles.signOutText, { color: colors.mutedForeground }]}>
            {showEnglish ? "Sign out" : "Abmelden"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const benefits = showEnglish ? BENEFITS_EN : BENEFITS_DE;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.headline, { color: colors.foreground }]}>
        {showEnglish ? "Sign in for more features" : "Anmelden & mehr erleben"}
      </Text>

      <View style={styles.benefits}>
        {benefits.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Ionicons name={b.icon} size={15} color={colors.primary} style={{ marginTop: 1 }} />
            <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>{b.text}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.googleBtn, { backgroundColor: colors.primary }]}
        onPress={handleSignIn}
        activeOpacity={0.82}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#0f0d0a" />
        ) : (
          <>
            <View style={styles.googleIconBadge}>
              <Ionicons name="logo-google" size={17} color="#4285F4" />
            </View>
            <Text style={styles.googleBtnText}>
              {showEnglish ? "Sign in with Google" : "Mit Google anmelden"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        {showEnglish
          ? "Optional — the app works fully without an account."
          : "Optional — die App funktioniert auch ohne Konto."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  headline: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  benefits: { gap: 8 },
  benefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  email: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  signOutBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  signOutText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#c8a96e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  googleIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  googleBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#0f0d0a",
    letterSpacing: 0.3,
  },
  hint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    opacity: 0.7,
  },
});
