import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import {
  listFriends,
  sendFriendRequest,
  respondFriendRequest,
  removeFriend,
  type FriendsResponse,
} from "@/lib/friendsApi";

export default function FriendsScreen() {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = (de: string, en: string) => (showEnglish ? en : de);

  const [data, setData] = useState<FriendsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [identifier, setIdentifier] = useState("");
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const refresh = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const r = await listFriends();
      setData(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => { void refresh(); }, [refresh]);

  const onSend = async () => {
    const ident = identifier.trim();
    if (!ident) return;
    setSending(true);
    setSendStatus(null);
    try {
      const r = await sendFriendRequest(ident);
      setSendStatus({
        ok: true,
        message: r.accepted
          ? t(`${r.sentTo ?? ident} ist jetzt dein Freund.`, `${r.sentTo ?? ident} is now your friend.`)
          : t(`Anfrage an ${r.sentTo ?? ident} verschickt.`, `Request sent to ${r.sentTo ?? ident}.`),
      });
      setIdentifier("");
      await refresh();
    } catch (e) {
      setSendStatus({ ok: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setSending(false);
    }
  };

  const onRespond = async (requestId: number, accept: boolean) => {
    try {
      await respondFriendRequest(requestId, accept);
      await refresh();
    } catch (e) {
      Alert.alert(t("Fehler", "Error"), e instanceof Error ? e.message : String(e));
    }
  };

  const onRemove = async (userId: string, name: string) => {
    const confirmed = Platform.OS === "web"
      ? window.confirm(t(`${name} aus Freundesliste entfernen?`, `Remove ${name} from friends?`))
      : await new Promise<boolean>((resolve) => {
          Alert.alert(
            t("Freund entfernen?", "Remove friend?"),
            name,
            [
              { text: t("Abbrechen", "Cancel"), style: "cancel", onPress: () => resolve(false) },
              { text: t("Entfernen", "Remove"), style: "destructive", onPress: () => resolve(true) },
            ],
          );
        });
    if (!confirmed) return;
    try {
      await removeFriend(userId);
      await refresh();
    } catch (e) {
      Alert.alert(t("Fehler", "Error"), e instanceof Error ? e.message : String(e));
    }
  };

  if (!isSignedIn) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Stack.Screen options={{ title: t("Freunde", "Friends") }} />
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border, margin: 16 }]}>
          <Ionicons name="lock-closed-outline" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {t("Anmeldung nötig", "Sign in required")}
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(auth)" as never)}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
              {t("Anmelden", "Sign in")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Stack.Screen options={{ title: t("Freunde", "Friends") }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color={colors.foreground} />
            <Text style={[styles.backTxt, { color: colors.foreground }]}>{t("Zurück", "Back")}</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {t("Freunde", "Friends")}
          </Text>
        </View>

        {/* ── Send request ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {t("Freund hinzufügen", "Add a friend")}
          </Text>
          <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>
            {t(
              "E-Mail oder Benutzername des Freundes — er muss ein Konto in der App haben.",
              "Friend's email or username — they need an account in the app.",
            )}
          </Text>
          <View style={styles.formRow}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }]}
              placeholder={t("E-Mail oder Benutzername", "Email or username")}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
              value={identifier}
              onChangeText={setIdentifier}
              onSubmitEditing={onSend}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: sending || !identifier.trim() ? 0.6 : 1 }]}
              disabled={sending || !identifier.trim()}
              onPress={onSend}
            >
              {sending
                ? <ActivityIndicator color={colors.primaryForeground} size="small" />
                : <Text style={[styles.sendBtnText, { color: colors.primaryForeground }]}>{t("Senden", "Send")}</Text>}
            </TouchableOpacity>
          </View>
          {sendStatus && (
            <Text style={[styles.statusText, { color: sendStatus.ok ? colors.green : colors.destructive }]}>
              {sendStatus.message}
            </Text>
          )}
        </View>

        {/* ── Loading / error ── */}
        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        {error && !loading && (
          <Text style={[styles.errorBox, { color: colors.destructive, borderColor: colors.destructive }]}>
            {error}
          </Text>
        )}

        {/* ── Incoming requests ── */}
        {data && data.incoming.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {t("Eingehende Anfragen", "Incoming requests")}
            </Text>
            {data.incoming.map((r) => (
              <View key={r.requestId} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{r.fromDisplayName}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: colors.primary }]}
                  onPress={() => onRespond(r.requestId, true)}
                >
                  <Text style={[styles.smallBtnText, { color: colors.primaryForeground }]}>
                    {t("Annehmen", "Accept")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: "transparent", borderColor: colors.border, borderWidth: 1 }]}
                  onPress={() => onRespond(r.requestId, false)}
                >
                  <Text style={[styles.smallBtnText, { color: colors.foreground }]}>
                    {t("Ablehnen", "Decline")}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── Outgoing requests ── */}
        {data && data.outgoing.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {t("Verschickte Anfragen", "Sent requests")}
            </Text>
            {data.outgoing.map((r) => (
              <View key={r.requestId} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.itemName, { color: colors.foreground, flex: 1 }]}>{r.toDisplayName}</Text>
                <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>
                  {t("Wartet …", "Pending …")}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Friends ── */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>
            {t("Deine Freunde", "Your friends")}
          </Text>
          {!data || data.friends.length === 0 ? (
            <Text style={[styles.cardHint, { color: colors.mutedForeground }]}>
              {t("Noch keine Freunde hinzugefügt.", "No friends added yet.")}
            </Text>
          ) : (
            data.friends.map((f) => (
              <View key={f.userId} style={[styles.itemRow, { borderTopColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{f.displayName}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.smallBtn, { backgroundColor: "transparent", borderColor: colors.destructive, borderWidth: 1 }]}
                  onPress={() => onRemove(f.userId, f.displayName)}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                  <Text style={[styles.smallBtnText, { color: colors.destructive }]}>
                    {t("Entfernen", "Remove")}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* ── Sharing reminder ── */}
        <View style={[styles.infoBox, { borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {t(
              "Damit deine Freunde gegen ein Deck antreten können, schalte das Deck im Manapool-Reiter über „Mit Freunden teilen“ frei.",
              "So your friends can play against a deck of yours, enable “Share with friends” on the deck in the Manapool tab.",
            )}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  backTxt: { fontSize: 14 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  card: { padding: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  cardTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  cardHint: { fontSize: 12, lineHeight: 16 },
  formRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  input: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, fontSize: 14 },
  sendBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, justifyContent: "center" },
  sendBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  statusText: { fontSize: 12, marginTop: 4 },
  itemRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth },
  itemName: { fontSize: 14, fontFamily: "Inter_500Medium" },
  itemSub: { fontSize: 12 },
  smallBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  smallBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  empty: { padding: 24, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  primaryBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  primaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  center: { paddingVertical: 24 },
  errorBox: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 12 },
  infoBox: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12, lineHeight: 16 },
});
