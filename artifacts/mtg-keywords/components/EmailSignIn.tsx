import { useSignIn, useSignUp, useUser, useAuth, isClerkAPIResponseError } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";

const BENEFITS_DE = [
  { icon: "sync-outline" as const, text: "Favoriten & Decks geräteübergreifend synchronisieren" },
  { icon: "cloud-outline" as const, text: "Daten sicher in der Cloud gespeichert" },
];

const BENEFITS_EN = [
  { icon: "sync-outline" as const, text: "Sync favorites & decks across all devices" },
  { icon: "cloud-outline" as const, text: "Data securely stored in the cloud" },
];

type Step = "email" | "code";
type Mode = "signin" | "signup";

function friendlyError(code: string | undefined, message: string | undefined, de: boolean): string {
  switch (code) {
    case "form_identifier_not_found":
      return de ? "Konto nicht gefunden — wir legen eines an." : "Account not found — we'll create one.";
    case "form_identifier_exists":
      return de ? "Diese E-Mail ist bereits registriert." : "This email is already registered.";
    case "form_param_format_invalid":
      return de ? "E-Mail-Adresse ungültig." : "Email address invalid.";
    case "form_code_incorrect":
    case "verification_failed":
      return de ? "Code falsch oder abgelaufen. Bitte erneut anfordern." : "Code wrong or expired. Please request again.";
    case "too_many_requests":
      return de ? "Zu viele Versuche — bitte kurz warten." : "Too many attempts — please wait a moment.";
    default:
      return message ?? (de ? "Unbekannter Fehler" : "Unknown error");
  }
}

type ErrInfo = { code?: string; message?: string; raw: string };

// Normalize an error from either a thrown exception or a Future-API
// `{ error: ClerkError }` result into a single shape we can render.
//
// Note: a thrown `ClerkAPIResponseError` ALSO has a top-level `code` field
// (usually "api_response_error"), so we MUST check the response-error shape
// FIRST and dig into `e.errors[0]` to get the meaningful inner code like
// "form_identifier_not_found". Otherwise the generic top-level code wins
// and the auto-fallback to sign-up never triggers.
function extractError(e: unknown): ErrInfo {
  if (isClerkAPIResponseError(e)) {
    const first = e.errors?.[0];
    return {
      code: first?.code,
      message: first?.longMessage ?? first?.message,
      raw: JSON.stringify(e.errors),
    };
  }
  // Future API result shape: { error: ClerkError | null }
  if (e && typeof e === "object" && "code" in (e as Record<string, unknown>)) {
    const c = e as { code?: string; message?: string; longMessage?: string };
    return {
      code: c.code,
      message: c.longMessage ?? c.message,
      raw: JSON.stringify(c, Object.getOwnPropertyNames(c)),
    };
  }
  if (e instanceof Error) {
    return { message: e.message, raw: e.message };
  }
  return { message: String(e), raw: String(e) };
}

// Wrap a promise with a hard timeout so the UI never hangs forever.
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`Timeout (${label}) nach ${ms / 1000}s`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (err) => {
        clearTimeout(t);
        reject(err);
      },
    );
  });
}

export function EmailSignIn() {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const de = !showEnglish;
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();

  const [step, setStep] = useState<Step>("email");
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [info, setInfo] = useState("");

  const reset = () => {
    setStep("email");
    setMode("signin");
    setCode("");
    setError("");
    setErrorDetail("");
    setInfo("");
  };

  const showError = (e: unknown, prefixDe: string, prefixEn: string) => {
    const x = extractError(e);
    setError((de ? prefixDe : prefixEn) + ": " + friendlyError(x.code, x.message, de));
    setErrorDetail(x.code ? `[${x.code}] ${x.raw}` : x.raw);
    // eslint-disable-next-line no-console
    console.error("[EmailSignIn]", prefixEn, x);
  };

  // Inner Clerk error code is in two possible places depending on whether the
  // SDK threw an exception or returned a Future-API `{error}` shape.
  const innerCode = (e: unknown): string | undefined => extractError(e).code;

  const doSignUp = async (identifier: string): Promise<void> => {
    try {
      const su1 = await withTimeout(
        signUp.create({ emailAddress: identifier }),
        15000,
        "signUp.create",
      );
      // Future API shape: { error }
      if (su1 && typeof su1 === "object" && "error" in su1 && (su1 as { error?: unknown }).error) {
        throw (su1 as { error: unknown }).error;
      }
    } catch (e) {
      // If user already exists in this instance, fall back to sign-in instead.
      if (innerCode(e) === "form_identifier_exists") {
        const si = await withTimeout(
          signIn.create({ identifier }),
          15000,
          "signIn.create (fallback)",
        );
        if (si && typeof si === "object" && "error" in si && (si as { error?: unknown }).error) {
          throw (si as { error: unknown }).error;
        }
        const sent = await withTimeout(
          signIn.emailCode.sendCode(),
          15000,
          "signIn.emailCode.sendCode",
        );
        if (sent && typeof sent === "object" && "error" in sent && (sent as { error?: unknown }).error) {
          throw (sent as { error: unknown }).error;
        }
        return;
      }
      throw e;
    }
    const su2 = await withTimeout(
      signUp.verifications.sendEmailCode(),
      15000,
      "signUp.verifications.sendEmailCode",
    );
    if (su2 && typeof su2 === "object" && "error" in su2 && (su2 as { error?: unknown }).error) {
      throw (su2 as { error: unknown }).error;
    }
  };

  // Try sign-in first; if the email is unknown, automatically switch to sign-up.
  // Handles BOTH the Future-API `{error}` shape and SDKs that throw.
  const startSignInOrSignUp = async (identifier: string): Promise<Mode> => {
    try {
      const created = await withTimeout(
        signIn.create({ identifier }),
        15000,
        "signIn.create",
      );
      // Future API result shape: `{ error: ClerkError | null }`.
      if (created && typeof created === "object" && "error" in created) {
        const err = (created as { error?: unknown }).error;
        if (err) {
          if (innerCode(err) === "form_identifier_not_found") {
            await doSignUp(identifier);
            return "signup";
          }
          throw err;
        }
      }
      const sent = await withTimeout(
        signIn.emailCode.sendCode(),
        15000,
        "signIn.emailCode.sendCode",
      );
      if (sent && typeof sent === "object" && "error" in sent && (sent as { error?: unknown }).error) {
        throw (sent as { error: unknown }).error;
      }
      return "signin";
    } catch (e) {
      // SDKs that throw instead of returning `{error}` end up here.
      if (innerCode(e) === "form_identifier_not_found") {
        await doSignUp(identifier);
        return "signup";
      }
      throw e;
    }
  };

  const sendCode = async () => {
    setError("");
    setErrorDetail("");
    setInfo("");
    if (!signIn || !signUp) {
      setError(de ? "Anmeldung wird noch geladen…" : "Auth still loading…");
      return;
    }
    const trimmed = email.trim();
    if (!trimmed.includes("@") || trimmed.length < 5) {
      setError(de ? "Bitte gültige E-Mail eingeben" : "Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const finalMode = await startSignInOrSignUp(trimmed);
      setMode(finalMode);
      setStep("code");
      setInfo(de ? "Code an deine E-Mail gesendet." : "Code sent to your email.");
    } catch (e) {
      showError(e, "Code-Versand fehlgeschlagen", "Send code failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError("");
    setErrorDetail("");
    setInfo("");
    if (!signIn || !signUp) return;
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError(de ? "Code muss 6-stellig sein" : "Code must be 6 digits");
      return;
    }
    setLoading(true);
    try {
      let createdSessionId: string | null = null;
      if (mode === "signup") {
        const result = await withTimeout(
          signUp.attemptEmailAddressVerification({ code: trimmed }),
          15000,
          "signUp.attemptEmailAddressVerification",
        );
        if (result.status !== "complete") {
          throw new Error("Verifizierung unvollständig (status=" + String(result.status) + ")");
        }
        createdSessionId = result.createdSessionId ?? null;
      } else {
        const result = await withTimeout(
          signIn.attemptFirstFactor({ strategy: "email_code", code: trimmed }),
          15000,
          "signIn.attemptFirstFactor",
        );
        if (result.status !== "complete") {
          throw new Error("Verifizierung unvollständig (status=" + String(result.status) + ")");
        }
        createdSessionId = result.createdSessionId ?? null;
      }
      if (createdSessionId) {
        await withTimeout(
          setActive({ session: createdSessionId }),
          15000,
          "setActive",
        );
      }
    } catch (e) {
      showError(e, "Anmeldung fehlgeschlagen", "Sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      reset();
      setEmail("");
    } catch (err) {
      console.error("Sign-Out Fehler:", err);
    }
  };

  if (isSignedIn && user) {
    const displayName =
      user.fullName ?? user.emailAddresses[0]?.emailAddress ?? (de ? "Angemeldet" : "Signed in");
    const displayEmail = user.emailAddresses[0]?.emailAddress ?? "";
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.row}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + "22" }]}>
            <Ionicons name="person" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {displayName}
            </Text>
            {displayEmail && displayEmail !== displayName && (
              <Text style={[styles.email, { color: colors.mutedForeground }]} numberOfLines={1}>
                {displayEmail}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[styles.signOutBtn, { borderColor: colors.border }]}
          onPress={handleSignOut}
          activeOpacity={0.75}
        >
          <Text style={[styles.signOutText, { color: colors.mutedForeground }]}>
            {de ? "Abmelden" : "Sign out"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const benefits = de ? BENEFITS_DE : BENEFITS_EN;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.headline, { color: colors.foreground }]}>
        {de ? "Anmelden & mehr erleben" : "Sign in for more features"}
      </Text>

      {step === "email" && (
        <>
          <View style={styles.benefits}>
            {benefits.map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <Ionicons name={b.icon} size={15} color={colors.primary} style={{ marginTop: 1 }} />
                <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>{b.text}</Text>
              </View>
            ))}
          </View>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder={de ? "E-Mail-Adresse" : "Email address"}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!loading}
            style={[
              styles.input,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {errorDetail ? (
            <Text style={[styles.errorText, { fontSize: 10, opacity: 0.6 }]} selectable>
              {errorDetail}
            </Text>
          ) : null}

          {/* Clerk renders an invisible bot-protection (Cloudflare Turnstile)
              widget into this element when bot protection is enabled in the
              Clerk dashboard. Without it, signIn.create() silently waits for
              a captcha token and never resolves — the request hangs until
              our 15s timeout fires. On native this view is a no-op. */}
          <View nativeID="clerk-captcha" style={styles.captchaSlot} />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={sendCode}
            activeOpacity={0.82}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#0f0d0a" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {de ? "Code anfordern" : "Send code"}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            {de
              ? "Optional — die App funktioniert auch ohne Konto."
              : "Optional — the app works fully without an account."}
          </Text>
        </>
      )}

      {step === "code" && (
        <>
          <Text style={[styles.subText, { color: colors.mutedForeground }]}>
            {de
              ? `Wir haben einen 6-stelligen Code an ${email} gesendet.`
              : `We've sent a 6-digit code to ${email}.`}
          </Text>

          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="number-pad"
            inputMode="numeric"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            editable={!loading}
            style={[
              styles.codeInput,
              {
                color: colors.foreground,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
          />

          {info ? <Text style={[styles.infoText, { color: colors.primary }]}>{info}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {errorDetail ? (
            <Text style={[styles.errorText, { fontSize: 10, opacity: 0.6 }]} selectable>
              {errorDetail}
            </Text>
          ) : null}

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
            onPress={verifyCode}
            activeOpacity={0.82}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#0f0d0a" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {de ? "Bestätigen & Einloggen" : "Verify & sign in"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={reset} disabled={loading} activeOpacity={0.6}>
            <Text style={[styles.linkText, { color: colors.mutedForeground }]}>
              {de ? "← Andere E-Mail verwenden" : "← Use a different email"}
            </Text>
          </TouchableOpacity>
        </>
      )}
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
  subText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
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
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  codeInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 14,
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    letterSpacing: 8,
  },
  errorText: {
    color: "#e07b6a",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  captchaSlot: {
    minHeight: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
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
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#0f0d0a",
    letterSpacing: 0.3,
  },
  linkText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  hint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    opacity: 0.7,
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
});
