import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/context/SettingsContext";
import { useDecks } from "@/context/DeckContext";

// ─── URL helpers ──────────────────────────────────────────────────────────────

function getApiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes(".expo.riker.replit.dev")) {
      return `https://${host.replace(".expo.riker.replit.dev", ".riker.replit.dev")}`;
    }
    if (host.includes(".riker.replit.dev")) {
      return `https://${host}`;
    }
  }
  return "https://magic-keyword-explainer.replit.app";
}

function getWsUrl(): string {
  const base = getApiBase().replace("https://", "wss://").replace("http://", "ws://");
  return `${base}/ws`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type PlayerState = {
  name: string;
  deckName: string;
  life: number;
  commanderDamageReceived: Record<string, number>;
};

type GameLogEntry = { time: number; msg: string };

type RoomState = {
  code: string;
  host: PlayerState;
  guest: PlayerState | null;
  format: string;
  startingLife: number;
  status: "waiting" | "playing" | "finished";
  turn: number;
  activePlayer: string;
  gameLog: GameLogEntry[];
  createdAt: number;
};

type PublicRoom = {
  code: string;
  host: { name: string; deckName: string };
  format: string;
  startingLife: number;
  status: string;
  createdAt: number;
};

type Screen = "home" | "waiting" | "game";

const FORMAT_OPTIONS = [
  { key: "commander", label: "Commander / EDH", life: 40 },
  { key: "standard", label: "Standard", life: 20 },
  { key: "modern", label: "Modern", life: 20 },
  { key: "pioneer", label: "Pioneer", life: 20 },
  { key: "legacy", label: "Legacy", life: 20 },
  { key: "draft", label: "Draft / Limited", life: 20 },
];

const STORAGE_PLAYER_NAME = "game_player_name";

// ─── Component ───────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function GameLobby({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();
  const { decks } = useDecks();

  // Connection
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Screen state
  const [screen, setScreen] = useState<Screen>("home");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [myRole, setMyRole] = useState<"host" | "guest" | null>(null);

  // Home screen form state
  const [playerName, setPlayerName] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const [selectedFormat, setSelectedFormat] = useState("commander");
  const [joinCode, setJoinCode] = useState("");
  const [mode, setMode] = useState<"create" | "join">("create");
  const [openRooms, setOpenRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Life button press animation
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Persist player name
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_PLAYER_NAME).then((v) => {
      if (v) setPlayerName(v);
    });
    if (decks.length > 0 && !selectedDeckId) {
      setSelectedDeckId(decks[0].id);
    }
  }, []);

  useEffect(() => {
    if (playerName) AsyncStorage.setItem(STORAGE_PLAYER_NAME, playerName);
  }, [playerName]);

  // Poll open rooms when home screen is visible
  useEffect(() => {
    if (!visible || screen !== "home") return;
    fetchOpenRooms();
    const interval = setInterval(fetchOpenRooms, 8000);
    return () => clearInterval(interval);
  }, [visible, screen]);

  // Cleanup on close
  useEffect(() => {
    if (!visible) {
      disconnectWs();
    }
  }, [visible]);

  async function fetchOpenRooms() {
    setLoadingRooms(true);
    try {
      const res = await fetch(`${getApiBase()}/api/lobby`);
      if (res.ok) {
        const data = await res.json();
        setOpenRooms(data.rooms ?? []);
      }
    } catch {}
    setLoadingRooms(false);
  }

  function connectWs(onOpen: (ws: WebSocket) => void) {
    disconnectWs();
    setConnecting(true);
    setError(null);

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnecting(false);
      onOpen(ws);
      // Ping every 25s to keep alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "room_state") {
          setRoom(msg.room);
          if (msg.room.status === "playing" && screen !== "game") {
            setScreen("game");
          }
        } else if (msg.type === "error") {
          setError(msg.message);
          setConnecting(false);
        }
      } catch {}
    };

    ws.onerror = () => {
      setError(showEnglish ? "Connection error — please try again" : "Verbindungsfehler — bitte erneut versuchen");
      setConnecting(false);
    };

    ws.onclose = () => {
      setConnecting(false);
    };
  }

  function disconnectWs() {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }

  function sendMsg(msg: object) {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function handleCreateRoom() {
    if (!playerName.trim()) { setError(showEnglish ? "Please enter your name" : "Bitte gib deinen Namen ein"); return; }
    const deckName = decks.find((d) => d.id === selectedDeckId)?.name ?? "Unbekanntes Deck";
    const format = FORMAT_OPTIONS.find((f) => f.key === selectedFormat)!;
    setMyRole("host");
    connectWs((ws) => {
      ws.send(JSON.stringify({
        type: "create",
        playerName: playerName.trim(),
        deckName,
        format: selectedFormat,
        startingLife: format.life,
      }));
      setScreen("waiting");
    });
  }

  function handleJoinRoom(code?: string) {
    const roomCode = (code ?? joinCode).trim().toUpperCase();
    if (!roomCode) { setError(showEnglish ? "Please enter a room code" : "Bitte gib einen Raumcode ein"); return; }
    if (!playerName.trim()) { setError(showEnglish ? "Please enter your name" : "Bitte gib deinen Namen ein"); return; }
    const deckName = decks.find((d) => d.id === selectedDeckId)?.name ?? "Unbekanntes Deck";
    setMyRole("guest");
    connectWs((ws) => {
      ws.send(JSON.stringify({
        type: "join",
        roomCode,
        playerName: playerName.trim(),
        deckName,
      }));
      setScreen("waiting");
    });
  }

  function handleShareCode() {
    if (!room?.code) return;
    const appUrl = getApiBase().includes("replit.dev")
      ? "magic-keyword-explainer.replit.app"
      : "magic-keyword-explainer.replit.app";
    Share.share({
      message: showEnglish
        ? `Join my MtG Master game! Room code: ${room.code}\n\nDownload MtG Master: https://${appUrl}`
        : `Tritt meinem MtG Master Spiel bei! Raumcode: ${room.code}\n\nMtG Master: https://${appUrl}`,
      title: "MtG Master — Spieleinladung",
    });
  }

  function handleLifeChange(delta: number) {
    Haptics.impactAsync(delta < 0 ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, tension: 400, friction: 4 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 6 }),
    ]).start();
    sendMsg({ type: "update_life", delta });
  }

  function handleNextTurn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    sendMsg({ type: "next_turn" });
  }

  function handleResetGame() {
    Alert.alert(
      showEnglish ? "Restart Game?" : "Spiel neu starten?",
      showEnglish ? "All life totals and the game log will be reset." : "Alle Lebenspunkte und das Spielprotokoll werden zurückgesetzt.",
      [
        { text: showEnglish ? "Cancel" : "Abbrechen", style: "cancel" },
        { text: showEnglish ? "Restart" : "Neu starten", style: "destructive", onPress: () => sendMsg({ type: "reset_game" }) },
      ]
    );
  }

  function handleLeave() {
    Alert.alert(
      showEnglish ? "Leave Game?" : "Spiel verlassen?",
      showEnglish ? "You will disconnect from the current game." : "Du trennst dich vom aktuellen Spiel.",
      [
        { text: showEnglish ? "Cancel" : "Abbrechen", style: "cancel" },
        {
          text: showEnglish ? "Leave" : "Verlassen",
          style: "destructive",
          onPress: () => {
            disconnectWs();
            setScreen("home");
            setRoom(null);
            setMyRole(null);
            setError(null);
          }
        },
      ]
    );
  }

  const myPlayer = room ? (myRole === "host" ? room.host : room.guest) : null;
  const oppPlayer = room ? (myRole === "host" ? room.guest : room.host) : null;
  const formatLabel = FORMAT_OPTIONS.find((f) => f.key === (room?.format ?? selectedFormat))?.label ?? selectedFormat;
  const isMyTurn = room?.activePlayer === myPlayer?.name;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => {
      if (screen === "home") { onClose(); }
      else { handleLeave(); }
    }}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>

        {/* ── Home Screen ── */}
        {screen === "home" && (
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.headerIcon, { backgroundColor: colors.primary + "22" }]}>
                <Ionicons name="game-controller" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Play MtG" : "MtG spielen"}
                </Text>
                <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                  {showEnglish ? "Virtual game table — real opponent" : "Virtueller Spieltisch — echter Gegner"}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="close-circle" size={26} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: "#ef444418", borderColor: "#ef4444" }]}>
                <Ionicons name="warning-outline" size={15} color="#ef4444" />
                <Text style={{ flex: 1, fontSize: 13, color: "#ef4444", fontFamily: "Inter_400Regular" }}>{error}</Text>
              </View>
            )}

            {/* Player name */}
            <Text style={[styles.label, { color: colors.foreground }]}>
              {showEnglish ? "Your name" : "Dein Name"}
            </Text>
            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder={showEnglish ? "Player name…" : "Spielername…"}
              placeholderTextColor={colors.mutedForeground}
              maxLength={24}
              autoCorrect={false}
            />

            {/* Deck selection */}
            {decks.length > 0 && (
              <>
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {showEnglish ? "Your deck" : "Dein Deck"}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {decks.map((deck) => (
                    <TouchableOpacity
                      key={deck.id}
                      style={[styles.deckChip, {
                        backgroundColor: selectedDeckId === deck.id ? colors.primary + "22" : colors.card,
                        borderColor: selectedDeckId === deck.id ? colors.primary : colors.border,
                      }]}
                      onPress={() => setSelectedDeckId(deck.id)}
                    >
                      <Ionicons name="albums-outline" size={13} color={selectedDeckId === deck.id ? colors.primary : colors.mutedForeground} />
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: selectedDeckId === deck.id ? colors.primary : colors.foreground }} numberOfLines={1}>
                        {deck.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Mode tabs */}
            <View style={[styles.modeTabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modeTab, mode === "create" && { backgroundColor: colors.primary + "22" }]}
                onPress={() => { setMode("create"); setError(null); }}
              >
                <Ionicons name="add-circle-outline" size={16} color={mode === "create" ? colors.primary : colors.mutedForeground} />
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: mode === "create" ? colors.primary : colors.mutedForeground }}>
                  {showEnglish ? "Create Room" : "Raum erstellen"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeTab, mode === "join" && { backgroundColor: colors.primary + "22" }]}
                onPress={() => { setMode("join"); setError(null); }}
              >
                <Ionicons name="enter-outline" size={16} color={mode === "join" ? colors.primary : colors.mutedForeground} />
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: mode === "join" ? colors.primary : colors.mutedForeground }}>
                  {showEnglish ? "Join Room" : "Beitreten"}
                </Text>
              </TouchableOpacity>
            </View>

            {mode === "create" ? (
              <>
                {/* Format selection */}
                <Text style={[styles.label, { color: colors.foreground }]}>Format</Text>
                {FORMAT_OPTIONS.map((f) => (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.formatRow, { backgroundColor: colors.card, borderColor: selectedFormat === f.key ? colors.primary : colors.border }]}
                    onPress={() => setSelectedFormat(f.key)}
                  >
                    <View style={[styles.radio, { borderColor: selectedFormat === f.key ? colors.primary : colors.mutedForeground }]}>
                      {selectedFormat === f.key && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, fontFamily: "Inter_500Medium", color: colors.foreground }}>{f.label}</Text>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{f.life} LP</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: connecting ? 0.7 : 1 }]}
                  onPress={handleCreateRoom}
                  disabled={connecting}
                >
                  {connecting ? (
                    <ActivityIndicator color="#0f0d0a" size="small" />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={18} color="#0f0d0a" />
                      <Text style={styles.primaryBtnText}>{showEnglish ? "Create Room" : "Raum erstellen"}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Join by code */}
                <Text style={[styles.label, { color: colors.foreground }]}>
                  {showEnglish ? "Room code" : "Raumcode"}
                </Text>
                <TextInput
                  style={[styles.input, styles.codeInput, { color: colors.primary, backgroundColor: colors.card, borderColor: colors.border }]}
                  value={joinCode}
                  onChangeText={(t) => setJoinCode(t.toUpperCase())}
                  placeholder="XXXXXX"
                  placeholderTextColor={colors.mutedForeground}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: connecting ? 0.7 : 1 }]}
                  onPress={() => handleJoinRoom()}
                  disabled={connecting}
                >
                  {connecting ? (
                    <ActivityIndicator color="#0f0d0a" size="small" />
                  ) : (
                    <>
                      <Ionicons name="enter" size={18} color="#0f0d0a" />
                      <Text style={styles.primaryBtnText}>{showEnglish ? "Join Room" : "Raum beitreten"}</Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Open lobbies */}
                <View style={styles.openRoomsHeader}>
                  <Text style={[styles.label, { color: colors.foreground, marginBottom: 0 }]}>
                    {showEnglish ? "Open Lobbies" : "Offene Lobbys"}
                  </Text>
                  <TouchableOpacity onPress={fetchOpenRooms}>
                    <Ionicons name={loadingRooms ? "sync" : "refresh-outline"} size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                {openRooms.length === 0 ? (
                  <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 6 }}>
                    {showEnglish ? "No open lobbies at the moment." : "Gerade keine offenen Lobbys."}
                  </Text>
                ) : (
                  openRooms.map((r) => (
                    <TouchableOpacity
                      key={r.code}
                      style={[styles.lobbyRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => { setJoinCode(r.code); handleJoinRoom(r.code); }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{r.host.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                          {r.host.deckName} · {FORMAT_OPTIONS.find((f) => f.key === r.format)?.label ?? r.format}
                        </Text>
                      </View>
                      <View style={[styles.codeBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                        <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primary }}>{r.code}</Text>
                      </View>
                      <Ionicons name="enter-outline" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  ))
                )}
              </>
            )}
          </ScrollView>
        )}

        {/* ── Waiting Room Screen ── */}
        {screen === "waiting" && (
          <View style={[styles.centered, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity style={styles.backBtn} onPress={handleLeave}>
              <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            {myRole === "host" && !room?.guest ? (
              <>
                <View style={[styles.waitIcon, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
                  <Ionicons name="people-outline" size={44} color={colors.primary} />
                </View>
                <Text style={[styles.waitTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Waiting for opponent…" : "Warte auf Mitspieler…"}
                </Text>
                <Text style={[styles.waitSub, { color: colors.mutedForeground }]}>
                  {showEnglish ? "Share the code or link below:" : "Teile den Code oder Link:"}
                </Text>

                {/* Room code display */}
                <View style={[styles.codeDisplay, { backgroundColor: colors.card, borderColor: colors.primary + "66" }]}>
                  <Text style={[styles.codeText, { color: colors.primary }]}>{room?.code ?? "…"}</Text>
                </View>

                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.primary }]} onPress={handleShareCode}>
                  <Ionicons name="share-outline" size={18} color="#0f0d0a" />
                  <Text style={styles.primaryBtnText}>{showEnglish ? "Share Invitation" : "Einladung teilen"}</Text>
                </TouchableOpacity>

                <View style={{ marginTop: 14, alignItems: "center" }}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                    {showEnglish ? "Format:" : "Format:"} {formatLabel} · {room?.startingLife ?? 40} LP
                  </Text>
                </View>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 20 }} />
                <Text style={[styles.waitTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Connecting…" : "Verbinde…"}
                </Text>
                {room?.code && (
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8 }}>
                    {showEnglish ? "Room" : "Raum"}: {room.code}
                  </Text>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Game Screen ── */}
        {screen === "game" && room && (
          <View style={[styles.gameRoot, { paddingBottom: insets.bottom + 8, paddingTop: insets.top + 8 }]}>
            {/* Top bar */}
            <View style={[styles.gameTopBar, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={handleLeave} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Ionicons name="exit-outline" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
              <View style={{ alignItems: "center" }}>
                <Text style={{ fontSize: 12, fontFamily: "Inter_700Bold", color: isMyTurn ? colors.primary : colors.mutedForeground }}>
                  {isMyTurn ? (showEnglish ? "YOUR TURN" : "DEIN ZUG") : (showEnglish ? "OPPONENT'S TURN" : "ZUG DES GEGNERS")}
                </Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                  {showEnglish ? `Round ${room.turn} · ${formatLabel}` : `Runde ${room.turn} · ${formatLabel}`}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity onPress={handleResetGame} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Ionicons name="refresh-outline" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Life counters */}
            <View style={styles.lifePanels}>
              {/* Opponent panel (rotated 180°) */}
              <View style={[styles.lifePanel, { backgroundColor: oppPlayer ? "#ef444408" : colors.card, borderColor: oppPlayer ? "#ef444433" : colors.border, transform: [{ rotate: "180deg" }] }]}>
                {oppPlayer ? (
                  <>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center" }}>
                      {oppPlayer.deckName}
                    </Text>
                    <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.foreground, textAlign: "center" }}>
                      {oppPlayer.name}
                    </Text>
                    <Text style={[styles.lifeNumber, { color: oppPlayer.life <= 5 ? "#ef4444" : oppPlayer.life <= 10 ? "#f59e0b" : colors.foreground }]}>
                      {oppPlayer.life}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                      {showEnglish ? "Life Points" : "Lebenspunkte"}
                    </Text>
                    {/* Commander damage received */}
                    {Object.entries(oppPlayer.commanderDamageReceived).filter(([, v]) => v > 0).map(([from, dmg]) => (
                      <Text key={from} style={{ fontSize: 10, color: "#f59e0b", fontFamily: "Inter_400Regular", textAlign: "center" }}>
                        ⚔ {from}: {dmg} CMD
                      </Text>
                    ))}
                  </>
                ) : (
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                    {showEnglish ? "Waiting for opponent…" : "Warte auf Mitspieler…"}
                  </Text>
                )}
              </View>

              {/* Center divider + turn button */}
              <View style={[styles.turnDivider, { borderColor: colors.border }]}>
                <TouchableOpacity
                  style={[styles.turnBtn, { backgroundColor: isMyTurn ? colors.primary : colors.card, borderColor: isMyTurn ? colors.primary : colors.border }]}
                  onPress={handleNextTurn}
                  disabled={!isMyTurn}
                >
                  <Ionicons name="arrow-forward-circle" size={20} color={isMyTurn ? "#0f0d0a" : colors.mutedForeground} />
                  <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: isMyTurn ? "#0f0d0a" : colors.mutedForeground }}>
                    {showEnglish ? "End Turn" : "Zug beenden"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* My panel */}
              {myPlayer && (
                <View style={[styles.lifePanel, { backgroundColor: colors.primary + "08", borderColor: colors.primary + "33" }]}>
                  <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center" }}>
                    {myPlayer.deckName}
                  </Text>
                  <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: colors.primary, textAlign: "center" }}>
                    {myPlayer.name} {showEnglish ? "(you)" : "(du)"}
                  </Text>
                  <Animated.Text style={[styles.lifeNumber, { color: myPlayer.life <= 5 ? "#ef4444" : myPlayer.life <= 10 ? "#f59e0b" : colors.foreground, transform: [{ scale: scaleAnim }] }]}>
                    {myPlayer.life}
                  </Animated.Text>
                  <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                    {showEnglish ? "Life Points" : "Lebenspunkte"}
                  </Text>

                  {/* Life buttons */}
                  <View style={styles.lifeBtns}>
                    {[-5, -1, +1, +5].map((delta) => (
                      <TouchableOpacity
                        key={delta}
                        style={[styles.lifeBtn, { backgroundColor: delta < 0 ? "#ef444420" : "#16a34a20", borderColor: delta < 0 ? "#ef4444" : "#16a34a" }]}
                        onPress={() => handleLifeChange(delta)}
                      >
                        <Text style={{ fontSize: 14, fontFamily: "Inter_700Bold", color: delta < 0 ? "#ef4444" : "#16a34a" }}>
                          {delta > 0 ? `+${delta}` : delta}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Game log */}
            <View style={[styles.logBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 10, fontFamily: "Inter_700Bold", color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                {showEnglish ? "Game Log" : "Spielprotokoll"}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 70 }}>
                {[...(room.gameLog)].reverse().map((entry, i) => (
                  <Text key={i} style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, lineHeight: 16 }}>
                    {entry.msg}
                  </Text>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  headerIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 14 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 16 },
  codeInput: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", letterSpacing: 4 },
  deckChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  modeTabs: { flexDirection: "row", borderWidth: 1, borderRadius: 10, overflow: "hidden", marginBottom: 16 },
  modeTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11 },
  formatRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  primaryBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#0f0d0a" },
  openRoomsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 10 },
  lobbyRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 8 },
  codeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },

  // Waiting screen
  centered: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  backBtn: { position: "absolute", top: 20, left: 20, padding: 8 },
  waitIcon: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", borderWidth: 2, marginBottom: 24 },
  waitTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center", marginBottom: 8 },
  waitSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 24 },
  codeDisplay: { paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, borderWidth: 2, marginBottom: 20 },
  codeText: { fontSize: 36, fontFamily: "Inter_700Bold", letterSpacing: 6, textAlign: "center" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },

  // Game screen
  gameRoot: { flex: 1 },
  gameTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  lifePanels: { flex: 1, gap: 0 },
  lifePanel: { flex: 1, alignItems: "center", justifyContent: "center", gap: 4, padding: 16, borderWidth: 1, margin: 8, borderRadius: 16 },
  lifeNumber: { fontSize: 80, fontFamily: "Inter_700Bold", lineHeight: 88, textAlign: "center" },
  lifeBtns: { flexDirection: "row", gap: 8, marginTop: 8 },
  lifeBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, minWidth: 52, alignItems: "center" },
  turnDivider: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  turnBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  logBox: { margin: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
});
