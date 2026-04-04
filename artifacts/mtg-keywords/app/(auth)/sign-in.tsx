import { Ionicons } from "@expo/vector-icons";
import { isClerkAPIResponseError, useSSO, useSignIn } from "@clerk/expo";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

// Required for iOS to close the browser after OAuth
WebBrowser.maybeCompleteAuthSession();

type Step = "form" | "otp";

export default function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { startSSOFlow } = useSSO();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();
  const { email: emailParam } = useLocalSearchParams<{ email?: string }>();

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState(emailParam ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState<"google" | "apple" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  const signInRef = useRef(signIn);
  const setActiveRef = useRef(setActive);
  useEffect(() => {
    signInRef.current = signIn;
    setActiveRef.current = setActive;
  }, [isLoaded, signIn, setActive]);

  function clerkErrorToGerman(err: any): string {
    if (isClerkAPIResponseError(err)) {
      const code = err.errors?.[0]?.code ?? "";
      const longMsg = err.errors?.[0]?.longMessage ?? "";
      const shortMsg = err.errors?.[0]?.message ?? "";
      if (code === "form_password_incorrect") return "Passwort ist falsch.";
      if (code === "form_code_incorrect") return "Code ist falsch oder abgelaufen.";
      if (code === "form_identifier_not_found") return "Es wurde kein Konto mit dieser E-Mail gefunden.";
      if (code === "form_identifier_exists") return "Diese E-Mail ist bereits registriert.";
      if (code === "session_exists") return "Du bist bereits angemeldet.";
      if (code === "oauth_callback_verification_failed") return "OAuth-Verifizierung fehlgeschlagen. Bitte erneut versuchen.";
      if (code.includes("unverified") || code === "not_allowed_to_sign_in") {
        setShowResend(true);
        return "E-Mail-Adresse noch nicht bestätigt. Bitte zuerst registrieren und den Code eingeben.";
      }
      if (code.includes("locked")) return "Konto gesperrt. Bitte versuche es später erneut.";
      if (code.includes("rate_limit")) return "Zu viele Versuche. Bitte warte einen Moment.";
      return longMsg || shortMsg || `Fehler (${code})`;
    }
    const msg = err?.message ?? "";
    if (msg.includes("Network") || msg.includes("fetch")) return "Keine Verbindung. Bitte Internetverbindung prüfen.";
    return msg || (showEnglish ? "An error occurred." : "Ein Fehler ist aufgetreten.");
  }

  async function waitForClerk(): Promise<boolean> {
    const deadline = Date.now() + 15000;
    while (!signInRef.current) {
      if (Date.now() >= deadline) return false;
      await new Promise(r => setTimeout(r, 300));
    }
    return true;
  }

  async function completeSignIn(result: any) {
    if (result.status === "complete") {
      await setActiveRef.current!({ session: result.createdSessionId });
      if (Platform.OS === "web") {
        window.location.replace("/");
      } else {
        router.replace("/(tabs)");
      }
      return;
    }

    if (result.status === "needs_second_factor") {
      try {
        await signInRef.current!.prepareSecondFactor({ strategy: "email_code" });
      } catch {
        // May already be prepared
      }
      setStep("otp");
      setLoading(false);
      return;
    }

    console.warn("[SignIn] unexpected status:", result.status);
    setErrorMsg(showEnglish
      ? "Sign-in could not be completed. Please try again."
      : "Anmeldung konnte nicht abgeschlossen werden. Bitte erneut versuchen.");
    setLoading(false);
  }

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    setErrorMsg(null);
    setShowResend(false);

    const ready = await waitForClerk();
    if (!ready) {
      setErrorMsg(showEnglish
        ? "Authentication service unavailable. Please reload the page."
        : "Anmeldedienst nicht verfügbar. Bitte die Seite neu laden.");
      setLoading(false);
      return;
    }

    try {
      let result = await signInRef.current!.create({
        identifier: email.trim(),
        strategy: "password",
        password,
      });

      if (result.status === "needs_first_factor") {
        result = await signInRef.current!.attemptFirstFactor({
          strategy: "password",
          password,
        });
      }

      await completeSignIn(result);
    } catch (err: any) {
      console.error("[SignIn] error:", JSON.stringify(err));
      setErrorMsg(clerkErrorToGerman(err));
      setLoading(false);
    }
  }

  async function handleSSOSignIn(provider: "oauth_google" | "oauth_apple") {
    setSsoLoading(provider === "oauth_google" ? "google" : "apple");
    setErrorMsg(null);

    try {
      const redirectUrl = Linking.createURL("/");
      const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
        strategy: provider,
        redirectUrl,
      });

      if (createdSessionId) {
        await ssoSetActive!({ session: createdSessionId });
        if (Platform.OS === "web") {
          window.location.replace("/");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        setErrorMsg(showEnglish
          ? "Sign-in was cancelled or failed. Please try again."
          : "Anmeldung wurde abgebrochen oder ist fehlgeschlagen.");
      }
    } catch (err: any) {
      console.error("[SSO] error:", JSON.stringify(err));
      setErrorMsg(clerkErrorToGerman(err));
    } finally {
      setSsoLoading(null);
    }
  }

  async function handleOtp() {
    if (!otpCode || otpCode.length < 4) return;
    setLoading(true);
    setErrorMsg(null);

    const ready = await waitForClerk();
    if (!ready) {
      setErrorMsg(showEnglish ? "Auth service unavailable." : "Anmeldedienst nicht verfügbar.");
      setLoading(false);
      return;
    }

    try {
      const result = await signInRef.current!.attemptSecondFactor({
        strategy: "email_code",
        code: otpCode.trim(),
      });
      await completeSignIn(result);
    } catch (err: any) {
      console.error("[SignIn OTP] error:", JSON.stringify(err));
      setErrorMsg(clerkErrorToGerman(err));
      setLoading(false);
    }
  }

  async function resendOtp() {
    try {
      await signInRef.current?.prepareSecondFactor({ strategy: "email_code" });
      setErrorMsg(showEnglish ? "New code sent." : "Neuer Code wurde gesendet.");
    } catch {
      setErrorMsg(showEnglish ? "Could not resend code." : "Code konnte nicht erneut gesendet werden.");
    }
  }

  // ── OTP step ──────────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity style={styles.backBtn} onPress={() => { setStep("form"); setOtpCode(""); setErrorMsg(null); }}>
              <Ionicons name="arrow-back" size={22} color={colors.foreground} />
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
                <Ionicons name="mail-outline" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {showEnglish ? "Verification Code" : "Bestätigungscode"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? `We sent a 6-digit code to ${email}`
                  : `Wir haben einen 6-stelligen Code an ${email} gesendet`}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                {showEnglish ? "Verification Code" : "Code aus der E-Mail"}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, letterSpacing: 6, textAlign: "center", fontSize: 22, fontFamily: "Inter_600SemiBold" }]}
                value={otpCode}
                onChangeText={(t) => setOtpCode(t.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                autoFocus
                onSubmitEditing={handleOtp}
                returnKeyType="go"
              />

              {errorMsg && (
                <Text style={[styles.errorText, { color: "#ef4444" }]}>{errorMsg}</Text>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading || otpCode.length < 4 ? 0.6 : 1 }]}
                onPress={handleOtp}
                disabled={loading || otpCode.length < 4}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {showEnglish ? "Verify" : "Bestätigen"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={{ marginTop: 14, alignItems: "center" }} onPress={resendOtp}>
                <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", color: colors.primary }}>
                  {showEnglish ? "Resend code" : "Code erneut senden"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  // ── Form step ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
              <Ionicons name="person-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {showEnglish ? "Sign In" : "Anmelden"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {showEnglish
                ? "Sync your decks and favorites across all devices"
                : "Decks und Favoriten auf allen Geräten synchronisieren"}
            </Text>
          </View>

          {/* ── Social Sign-In ──────────────────────────────────────────────── */}
          <View style={styles.socialGroup}>
            {/* Google */}
            <TouchableOpacity
              style={[styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleSSOSignIn("oauth_google")}
              disabled={ssoLoading !== null || loading}
              activeOpacity={0.8}
            >
              {ssoLoading === "google" ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Text style={styles.googleG}>G</Text>
              )}
              <Text style={[styles.socialBtnText, { color: colors.foreground }]}>
                {showEnglish ? "Continue with Google" : "Mit Google anmelden"}
              </Text>
            </TouchableOpacity>

            {/* Apple — show on iOS and on web */}
            {(Platform.OS === "ios" || Platform.OS === "web") && (
              <TouchableOpacity
                style={[styles.socialBtn, { backgroundColor: "#000", borderColor: "#333" }]}
                onPress={() => handleSSOSignIn("oauth_apple")}
                disabled={ssoLoading !== null || loading}
                activeOpacity={0.8}
              >
                {ssoLoading === "apple" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="logo-apple" size={18} color="#fff" />
                )}
                <Text style={[styles.socialBtnText, { color: "#fff" }]}>
                  {showEnglish ? "Continue with Apple" : "Mit Apple anmelden"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Divider ─────────────────────────────────────────────────────── */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>
              {showEnglish ? "or sign in with email" : "oder mit E-Mail"}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* ── Email/Password form ──────────────────────────────────────────── */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              {showEnglish ? "Email" : "E-Mail"}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              value={email}
              onChangeText={setEmail}
              placeholder="name@example.com"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text style={[styles.label, { color: colors.mutedForeground, marginTop: 14 }]}>
              {showEnglish ? "Password" : "Passwort"}
            </Text>
            <View style={[styles.pwRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.pwInput, { color: colors.foreground }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                placeholder={showEnglish ? "Your password" : "Dein Passwort"}
                placeholderTextColor={colors.mutedForeground}
                autoComplete="password"
                onSubmitEditing={handleSignIn}
                returnKeyType="go"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {errorMsg && (
              <View style={{ marginTop: 10, gap: 6 }}>
                <Text style={[styles.errorText, { color: "#ef4444" }]}>{errorMsg}</Text>
                {showResend && (
                  <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.primary }}>
                      → Jetzt neu registrieren &amp; E-Mail bestätigen
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading || !email || !password ? 0.6 : 1 }]}
              onPress={handleSignIn}
              disabled={loading || !email || !password}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {showEnglish ? "Sign In" : "Anmelden"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.linkRow}>
            <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
              {showEnglish ? "Don't have an account? " : "Noch kein Konto? "}
            </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {showEnglish ? "Sign Up" : "Registrieren"}
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 20, flexGrow: 1 },
  backBtn: { marginBottom: 24, alignSelf: "flex-start" },
  header: { alignItems: "center", marginBottom: 24 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },

  socialGroup: { gap: 10, marginBottom: 20 },
  socialBtn: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 18, gap: 10 },
  socialBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "center" },
  googleG: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#4285F4", width: 22, textAlign: "center" },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  card: { borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 20 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 6 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" },
  pwRow: { flexDirection: "row", alignItems: "center", borderRadius: 10, borderWidth: 1, paddingLeft: 14, paddingRight: 8 },
  pwInput: { flex: 1, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular" },
  eyeBtn: { padding: 6 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 10 },
  primaryBtn: { marginTop: 20, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  linkRow: { flexDirection: "row", justifyContent: "center" },
  linkText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
