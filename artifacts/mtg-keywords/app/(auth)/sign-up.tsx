import { Ionicons } from "@expo/vector-icons";
import { useSignUp } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);

  async function handleSignUp() {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        (showEnglish ? "An error occurred." : "Ein Fehler ist aufgetreten.");
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        if (Platform.OS === "web") {
          window.location.replace("/");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        setErrorMsg(showEnglish ? "Verification could not be completed." : "Bestätigung konnte nicht abgeschlossen werden.");
      }
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ??
        err?.errors?.[0]?.message ??
        (showEnglish ? "Invalid or expired code." : "Ungültiger oder abgelaufener Code.");
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    if (!isLoaded || !signUp) return;
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
    } catch {
    }
  }

  if (pendingVerification) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <View style={[styles.iconCircle, { backgroundColor: "#22c55e22" }]}>
                <Ionicons name="mail-outline" size={32} color="#22c55e" />
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>
                {showEnglish ? "Verify Email" : "E-Mail bestätigen"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {showEnglish
                  ? `We sent a 6-digit code to ${email}. Enter it below.`
                  : `Wir haben einen 6-stelligen Code an ${email} gesendet.`}
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>
                {showEnglish ? "Verification Code" : "Bestätigungscode"}
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground, textAlign: "center", fontSize: 28, letterSpacing: 10 }]}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                placeholder="000000"
                placeholderTextColor={colors.mutedForeground}
                maxLength={6}
                onSubmitEditing={handleVerify}
                returnKeyType="go"
              />

              {errorMsg && (
                <Text style={[styles.errorText, { color: "#ef4444" }]}>{errorMsg}</Text>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading || code.length < 6 ? 0.6 : 1 }]}
                onPress={handleVerify}
                disabled={loading || code.length < 6}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {showEnglish ? "Verify & Create Account" : "Bestätigen & Registrieren"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendBtn} onPress={resendCode}>
                <Text style={[styles.resendText, { color: colors.primary }]}>
                  {showEnglish ? "Resend code" : "Code erneut senden"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "22" }]}>
              <Ionicons name="person-add-outline" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {showEnglish ? "Create Account" : "Konto erstellen"}
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {showEnglish
                ? "Free account to sync your data everywhere"
                : "Kostenloses Konto für Daten-Sync auf allen Geräten"}
            </Text>
          </View>

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
                placeholder={showEnglish ? "Min. 8 characters" : "Mind. 8 Zeichen"}
                placeholderTextColor={colors.mutedForeground}
                autoComplete="new-password"
                onSubmitEditing={handleSignUp}
                returnKeyType="go"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {errorMsg && (
              <Text style={[styles.errorText, { color: "#ef4444" }]}>{errorMsg}</Text>
            )}

            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading || !email || !password ? 0.6 : 1 }]}
              onPress={handleSignUp}
              disabled={loading || !email || !password}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>
                  {showEnglish ? "Create Account" : "Konto erstellen"}
                </Text>
              )}
            </TouchableOpacity>

            <View nativeID="clerk-captcha" />
          </View>

          <View style={styles.linkRow}>
            <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
              {showEnglish ? "Already have an account? " : "Schon ein Konto? "}
            </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={[styles.linkText, { color: colors.primary }]}>
                  {showEnglish ? "Sign In" : "Anmelden"}
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
  header: { alignItems: "center", marginBottom: 28 },
  iconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
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
  resendBtn: { marginTop: 12, alignItems: "center" },
  resendText: { fontSize: 14, fontFamily: "Inter_400Regular" },
});
