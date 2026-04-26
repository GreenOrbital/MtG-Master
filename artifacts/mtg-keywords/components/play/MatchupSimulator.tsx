import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { useDecks, type Deck } from "@/context/DeckContext";
import { simulateMatchup, type MatchupResult } from "@/utils/playSim";
import { listFriends, getFriendDecks, type Friend } from "@/lib/friendsApi";
import { EmailSignIn } from "@/components/EmailSignIn";

import { MatchupResultPanel } from "./MatchupResult";

// Lightweight inline picker — opens an absolutely-positioned overlay listing
// all options. Avoids pulling in a picker dependency.
type PickerOption = { id: string; label: string; subtitle?: string; [k: string]: unknown };
function Picker({
  value,
  options,
  placeholder,
  onChange,
  disabled,
}: {
  value: { id: string; label: string; subtitle?: string } | null;
  options: PickerOption[];
  placeholder: string;
  onChange: (v: PickerOption) => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  return (
    <View style={{ position: "relative", zIndex: open ? 5 : 1 }}>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setOpen((v) => !v)}
        style={[
          styles.pickerHead,
          {
            backgroundColor: colors.input,
            borderColor: open ? colors.primary : colors.border,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.pickerLabel, { color: value ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
            {value ? value.label : placeholder}
          </Text>
          {value?.subtitle && (
            <Text style={[styles.pickerSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {value.subtitle}
            </Text>
          )}
        </View>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
      {open && (
        <View style={[styles.pickerSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {options.length === 0 ? (
            <Text style={[styles.pickerEmpty, { color: colors.mutedForeground }]}>—</Text>
          ) : (
            <ScrollView style={{ maxHeight: 220 }}>
              {options.map((o) => (
                <Pressable
                  key={o.id}
                  onPress={() => { onChange(o); setOpen(false); }}
                  style={({ pressed }) => [
                    styles.pickerItem,
                    { backgroundColor: pressed ? colors.muted : "transparent", borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.pickerLabel, { color: colors.foreground }]} numberOfLines={1}>{o.label}</Text>
                  {o.subtitle && (
                    <Text style={[styles.pickerSub, { color: colors.mutedForeground }]} numberOfLines={1}>{o.subtitle}</Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      )}
    </View>
  );
}

export function MatchupSimulator() {
  const colors = useColors();
  const { showEnglish } = useSettings();
  const { decks } = useDecks();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const t = (de: string, en: string) => (showEnglish ? en : de);

  const [myDeck, setMyDeck] = useState<Deck | null>(null);
  const [friend, setFriend] = useState<Friend | null>(null);
  const [friendDecks, setFriendDecks] = useState<Deck[]>([]);
  const [friendDeck, setFriendDeck] = useState<Deck | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingFriendDecks, setLoadingFriendDecks] = useState(false);
  const [friendsError, setFriendsError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MatchupResult | null>(null);

  // Auto-select first own deck.
  useEffect(() => {
    if (!myDeck && decks.length > 0) setMyDeck(decks[0]);
  }, [decks, myDeck]);

  // Load friends list (only if signed in).
  const refreshFriends = useCallback(async () => {
    if (!isSignedIn) return;
    setLoadingFriends(true);
    setFriendsError(null);
    try {
      const r = await listFriends();
      setFriends(r.friends);
    } catch (e) {
      setFriendsError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingFriends(false);
    }
  }, [isSignedIn]);

  useEffect(() => { void refreshFriends(); }, [refreshFriends]);

  // Load friend's shared decks when one is picked.
  useEffect(() => {
    if (!friend) { setFriendDecks([]); setFriendDeck(null); return; }
    setLoadingFriendDecks(true);
    setFriendDeck(null);
    getFriendDecks(friend.userId)
      .then((r) => {
        setFriendDecks(r.decks);
        if (r.decks.length > 0) setFriendDeck(r.decks[0]);
      })
      .catch((e) => setFriendsError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingFriendDecks(false));
  }, [friend]);

  const myOptions = useMemo(
    () => decks.map((d) => ({ id: d.id, label: d.name, subtitle: `${d.cards.reduce((s, c) => s + c.count, 0)} ${t("Karten", "cards")}`, deck: d })),
    [decks, showEnglish],
  );
  const friendOptions = useMemo(
    () => friends.map((f) => ({ id: f.userId, label: f.displayName, subtitle: undefined, friend: f })),
    [friends],
  );
  const friendDeckOptions = useMemo(
    () => friendDecks.map((d) => ({ id: d.id, label: d.name, subtitle: `${d.cards.reduce((s, c) => s + c.count, 0)} ${t("Karten", "cards")}`, deck: d })),
    [friendDecks, showEnglish],
  );

  const canRun = !!myDeck && !!friendDeck && !running;

  const onRun = useCallback(async () => {
    if (!myDeck || !friendDeck) return;
    setRunning(true);
    setResult(null);
    // Yield so the spinner can render before we hammer the JS thread.
    await new Promise((r) => setTimeout(r, 16));
    try {
      const r = simulateMatchup(myDeck, friendDeck, 500);
      setResult(r);
    } finally {
      setRunning(false);
    }
  }, [myDeck, friendDeck]);

  // ── Empty / signed-out states ─────────────────────────────────────────
  if (!isSignedIn) {
    // Embed the sign-in form directly so the user can authenticate without
    // navigating away (and without hitting a non-existent /(auth) route).
    return (
      <View style={{ gap: 12 }}>
        <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="lock-closed-outline" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {t("Anmeldung nötig", "Sign in required")}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
            {t(
              "Um gegen die Decks deiner Freunde zu testen, melde dich an.",
              "Sign in to play against your friends' decks.",
            )}
          </Text>
        </View>
        <EmailSignIn />
      </View>
    );
  }

  if (decks.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="layers-outline" size={32} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          {t("Noch kein eigenes Deck", "No deck of your own yet")}
        </Text>
        <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
          {t(
            "Bau im Reiter „Manapool“ ein Deck, dann kannst du es hier gegen deine Freunde testen.",
            "Build a deck in the Manapool tab — then you can test it against your friends here.",
          )}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* ── Friends shortcut ── */}
      <View style={styles.friendsHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.friendsCount, { color: colors.foreground }]}>
            {loadingFriends
              ? t("Lade Freunde …", "Loading friends …")
              : t(`${friends.length} Freund${friends.length === 1 ? "" : "e"}`, `${friends.length} friend${friends.length === 1 ? "" : "s"}`)}
          </Text>
          {friendsError && (
            <Text style={[styles.errorText, { color: colors.destructive }]}>{friendsError}</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.linkBtn, { borderColor: colors.border }]}
          onPress={() => router.push("/friends" as never)}
        >
          <Ionicons name="people-outline" size={16} color={colors.foreground} />
          <Text style={[styles.linkBtnText, { color: colors.foreground }]}>
            {t("Freunde verwalten", "Manage friends")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Deck pickers ── */}
      <View style={styles.pickerGroup}>
        <Text style={[styles.pickerHead2, { color: colors.mutedForeground }]}>{t("Dein Deck", "Your deck")}</Text>
        <Picker
          value={myDeck ? { id: myDeck.id, label: myDeck.name } : null}
          options={myOptions}
          placeholder={t("Eigenes Deck wählen", "Pick your deck")}
          onChange={(o) => { setMyDeck((o as unknown as { deck: Deck }).deck); setResult(null); }}
        />
      </View>

      <View style={styles.pickerGroup}>
        <Text style={[styles.pickerHead2, { color: colors.mutedForeground }]}>{t("Freund", "Friend")}</Text>
        <Picker
          value={friend ? { id: friend.userId, label: friend.displayName } : null}
          options={friendOptions}
          placeholder={friends.length === 0
            ? t("Noch keine Freunde — füge welche hinzu", "No friends yet — add some")
            : t("Freund wählen", "Pick a friend")}
          onChange={(o) => { setFriend((o as unknown as { friend: Friend }).friend); setResult(null); }}
          disabled={friends.length === 0}
        />
      </View>

      <View style={styles.pickerGroup}>
        <Text style={[styles.pickerHead2, { color: colors.mutedForeground }]}>{t("Deck des Freundes", "Friend's deck")}</Text>
        <Picker
          value={friendDeck ? { id: friendDeck.id, label: friendDeck.name } : null}
          options={friendDeckOptions}
          placeholder={
            !friend
              ? t("Erst Freund wählen", "Pick a friend first")
              : loadingFriendDecks
              ? t("Lade …", "Loading …")
              : friendDecks.length === 0
              ? t("Dieser Freund teilt noch keine Decks", "This friend isn't sharing any decks yet")
              : t("Geteiltes Deck wählen", "Pick a shared deck")
          }
          onChange={(o) => { setFriendDeck((o as unknown as { deck: Deck }).deck); setResult(null); }}
          disabled={!friend || loadingFriendDecks || friendDecks.length === 0}
        />
      </View>

      {/* ── Run button ── */}
      <TouchableOpacity
        style={[styles.runBtn, { backgroundColor: canRun ? colors.primary : colors.muted, opacity: canRun ? 1 : 0.6 }]}
        disabled={!canRun}
        onPress={onRun}
      >
        {running ? (
          <>
            <ActivityIndicator color={colors.primaryForeground} />
            <Text style={[styles.runBtnText, { color: colors.primaryForeground }]}>
              {t("Simuliere …", "Simulating …")}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="flash" size={18} color={canRun ? colors.primaryForeground : colors.mutedForeground} />
            <Text style={[styles.runBtnText, { color: canRun ? colors.primaryForeground : colors.mutedForeground }]}>
              {t("Matchup simulieren", "Simulate matchup")}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* ── Result ── */}
      {result && myDeck && friendDeck && friend && (
        <MatchupResultPanel
          myDeck={myDeck}
          friendDeck={friendDeck}
          friendName={friend.displayName}
          result={result}
        />
      )}

      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        {t(
          "Hinweis: Die Simulation ist eine Schätzung — kein Ersatz für ein echtes Spiel. Sie berücksichtigt Manakurve, Manabase, Synergien und ein vereinfachtes Probespiel.",
          "Note: The simulation is an estimate — not a substitute for a real game. It considers mana curve, mana base, synergies and a simplified mock playthrough.",
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { padding: 24, borderRadius: 14, borderWidth: 1, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginTop: 6 },
  emptyBody: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  primaryBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 6 },
  primaryBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  friendsHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  friendsCount: { fontSize: 13, fontFamily: "Inter_500Medium" },
  errorText: { fontSize: 11, marginTop: 2 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  linkBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  pickerGroup: { gap: 6 },
  pickerHead2: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.6 },
  pickerHead: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10, borderWidth: 1, gap: 8, ...(Platform.OS === "web" ? ({ cursor: "pointer" } as object) : {}) },
  pickerLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  pickerSub: { fontSize: 11, marginTop: 2 },
  pickerSheet: { position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, borderRadius: 10, borderWidth: 1, overflow: "hidden", elevation: 4, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  pickerItem: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  pickerEmpty: { padding: 12, fontSize: 12, textAlign: "center" },
  runBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 12 },
  runBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  disclaimer: { fontSize: 11, fontStyle: "italic", lineHeight: 16, marginTop: 4 },
});
