import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
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
import { useDecks, type DeckCard } from "@/context/DeckContext";

// ─── URL helpers ──────────────────────────────────────────────────────────────

function getApiBase(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    // Dev: Expo preview domain → strip .expo to reach the API server domain
    if (host.includes(".expo.riker.replit.dev")) {
      return `https://${host.replace(".expo.riker.replit.dev", ".riker.replit.dev")}`;
    }
    // Dev or prod on riker / replit.app → same origin, path routing handles /api/*
    if (host.includes(".riker.replit.dev") || host.endsWith(".replit.app")) {
      return `https://${host}`;
    }
  }
  // Local fallback
  return "https://57d2c256-8628-427d-8d8a-603da6b0641d-00-3mfkn8k0aya4z.riker.replit.dev";
}

function getWsUrl(): string {
  return getApiBase().replace("https://", "wss://").replace("http://", "ws://") + "/api/ws";
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type Phase = "untap" | "upkeep" | "draw" | "main1" | "combat" | "main2" | "end";

const PHASE_ORDER: Phase[] = ["untap", "upkeep", "draw", "main1", "combat", "main2", "end"];

const PHASE_LABELS_DE: Record<Phase, string> = {
  untap: "Aufklärung", upkeep: "Vorbereitung", draw: "Ziehen",
  main1: "Hauptphase 1", combat: "Kampf", main2: "Hauptphase 2", end: "Endphase",
};
const PHASE_LABELS_EN: Record<Phase, string> = {
  untap: "Untap", upkeep: "Upkeep", draw: "Draw",
  main1: "Main 1", combat: "Combat", main2: "Main 2", end: "End",
};
const PHASE_ICONS: Record<Phase, string> = {
  untap: "refresh-circle-outline", upkeep: "time-outline", draw: "layers-outline",
  main1: "construct-outline", combat: "flash-outline", main2: "construct-outline", end: "moon-outline",
};

type GameCard = {
  instanceId: string;
  id: string;
  name: string;
  printed_name?: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  imageUri?: string;
  tapped: boolean;
  counters: Record<string, number>;
};

type MyState = {
  name: string; deckName: string; life: number; poison: number;
  commanderDamageReceived: Record<string, number>;
  deckCount: number; hand: GameCard[]; battlefield: GameCard[];
  graveyard: GameCard[]; exile: GameCard[];
};

type OppState = {
  name: string; deckName: string; life: number; poison: number;
  commanderDamageReceived: Record<string, number>;
  deckCount: number; handCount: number; battlefield: GameCard[];
  graveyard: GameCard[]; exile: GameCard[];
};

type GameState = {
  code: string; format: string; startingLife: number;
  status: "waiting" | "playing" | "finished";
  turn: number; phase: Phase; activePlayer: string;
  gameLog: { time: number; msg: string }[];
  createdAt: number;
  isPublic?: boolean;
  me: MyState | null;
  opponent: OppState | null;
};

type PublicRoom = {
  code: string; host: { name: string; deckName: string };
  format: string; startingLife: number; status: string; createdAt: number;
};

type Screen = "home" | "waiting" | "game";

const FORMAT_OPTIONS = [
  { key: "commander",  label: "Commander / EDH",  labelEn: "Commander / EDH",  life: 40, handSize: 7 },
  { key: "standard",   label: "Standard",           labelEn: "Standard",          life: 20, handSize: 7 },
  { key: "modern",     label: "Modern",              labelEn: "Modern",             life: 20, handSize: 7 },
  { key: "pioneer",    label: "Pioneer",             labelEn: "Pioneer",            life: 20, handSize: 7 },
  { key: "legacy",     label: "Legacy",              labelEn: "Legacy",             life: 20, handSize: 7 },
  { key: "vintage",    label: "Vintage",             labelEn: "Vintage",            life: 20, handSize: 7 },
  { key: "pauper",     label: "Pauper",              labelEn: "Pauper",             life: 20, handSize: 7 },
  { key: "draft",      label: "Draft / Limited",     labelEn: "Draft / Limited",    life: 20, handSize: 7 },
  { key: "brawl",      label: "Brawl",               labelEn: "Brawl",              life: 25, handSize: 7 },
  { key: "oathbreaker", label: "Oathbreaker",        labelEn: "Oathbreaker",        life: 20, handSize: 7 },
];

const STORAGE_PLAYER_NAME = "game_player_name";
const STORAGE_ACTIVE_LOBBY = "game_active_lobby_v1";

type SavedLobby = { code: string; playerName: string; role: "host" | "guest"; format: string; isPublic: boolean };

// ─── Mini sub-components ──────────────────────────────────────────────────────

function ManaCost({ cost, size = 11 }: { cost?: string; size?: number }) {
  if (!cost) return null;
  const symbols = cost.replace(/[{}]/g, " ").trim().split(" ").filter(Boolean);
  const COLOR_MAP: Record<string, string> = {
    W: "#fffbd5", U: "#aae0fa", B: "#cac5c0", R: "#f9aa8f", G: "#9bd3ae",
    C: "#d3d3d3",
  };
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
      {symbols.map((s, i) => {
        const bg = COLOR_MAP[s] ?? "#888";
        const isNum = /^\d+$/.test(s) || s === "X";
        return (
          <View key={i} style={{
            width: size + 2, height: size + 2, borderRadius: (size + 2) / 2,
            backgroundColor: isNum ? "#999" : bg,
            alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ fontSize: size - 3, fontFamily: "Inter_700Bold", color: "#000" }}>{s}</Text>
          </View>
        );
      })}
    </View>
  );
}

function CardBack({ width = 44, height = 62 }: { width?: number; height?: number }) {
  return (
    <View style={{
      width, height, borderRadius: 4, backgroundColor: "#1a1060",
      borderWidth: 1, borderColor: "#3a2a90",
      alignItems: "center", justifyContent: "center",
    }}>
      <Ionicons name="sparkles" size={width * 0.35} color="#5a4aaa" />
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props { visible: boolean; onClose: () => void; asScreen?: boolean; }

export default function GameLobby({ visible, onClose, asScreen = false }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showEnglish } = useSettings();
  const { decks } = useDecks();

  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const screenRef = useRef<Screen>("home");
  const myRoleRef = useRef<"host" | "guest" | null>(null);

  const [screen, setScreen] = useState<Screen>("home");
  function goScreen(s: Screen) { screenRef.current = s; setScreen(s); }
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myRole, setMyRole] = useState<"host" | "guest" | null>(null);
  function setRole(r: "host" | "guest" | null) { myRoleRef.current = r; setMyRole(r); }

  // Home form
  const [playerName, setPlayerName] = useState("");
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("commander");
  const [isPublic, setIsPublic] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [homeMode, setHomeMode] = useState<"create" | "join">("create");
  const [openRooms, setOpenRooms] = useState<PublicRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLobby, setSavedLobby] = useState<SavedLobby | null>(null);

  // Game UI state
  const [showLog, setShowLog] = useState(false);
  const [selectedHandCard, setSelectedHandCard] = useState<string | null>(null);
  const [selectedBfCard, setSelectedBfCard] = useState<string | null>(null);
  const [showZone, setShowZone] = useState<"graveyard" | "exile" | "oppGraveyard" | "oppExile" | null>(null);
  const [showLifeMenu, setShowLifeMenu] = useState(false);
  const [showCounterMenu, setShowCounterMenu] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_PLAYER_NAME).then(v => { if (v) setPlayerName(v); });
    AsyncStorage.getItem(STORAGE_ACTIVE_LOBBY).then(v => {
      if (v) { try { setSavedLobby(JSON.parse(v)); } catch {} }
    });
    if (decks.length > 0 && !selectedDeckId) setSelectedDeckId(decks[0].id);
  }, []);

  function saveLobby(lobby: SavedLobby) {
    setSavedLobby(lobby);
    AsyncStorage.setItem(STORAGE_ACTIVE_LOBBY, JSON.stringify(lobby));
  }

  function clearSavedLobby() {
    setSavedLobby(null);
    AsyncStorage.removeItem(STORAGE_ACTIVE_LOBBY);
  }

  useEffect(() => {
    if (playerName) AsyncStorage.setItem(STORAGE_PLAYER_NAME, playerName);
  }, [playerName]);

  useEffect(() => {
    if (!visible || screen !== "home") return;
    fetchOpenRooms();
    const interval = setInterval(fetchOpenRooms, 8000);
    return () => clearInterval(interval);
  }, [visible, screen]);

  useEffect(() => {
    if (!visible) disconnectWs();
  }, [visible]);

  async function fetchOpenRooms() {
    setLoadingRooms(true);
    try {
      const res = await fetch(`${getApiBase()}/api/lobby`);
      if (res.ok) { const d = await res.json(); setOpenRooms(d.rooms ?? []); }
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
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
      }, 25000);
    };
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "game_state") {
          const state: GameState = msg.state;
          setGameState(state);
          // Save lobby code for reconnection whenever we have a waiting room
          if (state.status === "waiting") {
            saveLobby({
              code: state.code,
              playerName: (state.me?.name ?? ""),
              role: myRoleRef.current ?? "host",
              format: state.format,
              isPublic: state.isPublic ?? true,
            });
          }
          // Clear saved lobby once game is playing or finished
          if (state.status === "playing" || state.status === "finished") clearSavedLobby();
          if (state.status === "playing" && screenRef.current !== "game") goScreen("game");
          else if (state.status === "waiting" && screenRef.current !== "waiting") goScreen("waiting");
        } else if (msg.type === "error") {
          // Clear saved lobby on any rejoin-related error
          if (
            msg.message?.includes("nicht mehr vorhanden") ||
            msg.message?.includes("no longer") ||
            msg.message?.includes("nicht in diesem Raum") ||
            msg.message?.includes("not in this room")
          ) clearSavedLobby();
          setError(msg.message);
          setConnecting(false);
          // Only navigate home if we're still on waiting screen (e.g. rejoin failed)
          if (screenRef.current === "waiting") goScreen("home");
        }
      } catch {}
    };
    ws.onerror = () => {
      setError(showEnglish ? "Connection error — please try again" : "Verbindungsfehler — bitte erneut versuchen");
      setConnecting(false);
    };
    ws.onclose = () => { setConnecting(false); };
  }

  function disconnectWs() {
    if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
  }

  function send(msg: object) {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
  }

  function getDeckCards(): DeckCard[] {
    const deck = decks.find(d => d.id === selectedDeckId);
    if (!deck) return [];
    const basicLandNames: Record<string, string> = { W: "Plains", U: "Island", B: "Swamp", R: "Mountain", G: "Forest" };
    const basicLandIds: Record<string, string> = { W: "plains", U: "island", B: "swamp", R: "mountain", G: "forest" };
    const basicLandTypes: Record<string, string> = { W: "Basic Land — Plains", U: "Basic Land — Island", B: "Basic Land — Swamp", R: "Basic Land — Mountain", G: "Basic Land — Forest" };
    const landCards: DeckCard[] = (Object.entries(deck.lands ?? {}) as [string, number][])
      .filter(([, n]) => n > 0)
      .map(([color, n]) => ({
        id: basicLandIds[color] ?? color.toLowerCase(),
        name: basicLandNames[color] ?? color,
        type_line: basicLandTypes[color],
        count: n,
      }));
    return [...deck.cards, ...landCards];
  }

  function handleCreate() {
    if (!playerName.trim()) { setError(showEnglish ? "Please enter your name" : "Bitte Namen eingeben"); return; }
    const fmt = FORMAT_OPTIONS.find(f => f.key === selectedFormat)!;
    const deckName = decks.find(d => d.id === selectedDeckId)?.name ?? "—";
    setRole("host");
    connectWs(ws => {
      ws.send(JSON.stringify({
        type: "create",
        playerName: playerName.trim(),
        deckName,
        format: selectedFormat,
        startingLife: fmt.life,
        deckCards: getDeckCards(),
        isPublic,
      }));
      goScreen("waiting");
    });
  }

  function handleRejoin(lobby: SavedLobby) {
    setRole(lobby.role);
    connectWs(ws => {
      ws.send(JSON.stringify({
        type: "rejoin",
        roomCode: lobby.code,
        playerName: lobby.playerName,
      }));
      goScreen("waiting");
    });
  }

  function handleJoin(code?: string) {
    const roomCode = (code ?? joinCode).trim().toUpperCase();
    if (!roomCode) { setError(showEnglish ? "Please enter a room code" : "Bitte Raumcode eingeben"); return; }
    if (!playerName.trim()) { setError(showEnglish ? "Please enter your name" : "Bitte Namen eingeben"); return; }
    const deckName = decks.find(d => d.id === selectedDeckId)?.name ?? "—";
    setRole("guest");
    connectWs(ws => {
      ws.send(JSON.stringify({
        type: "join",
        roomCode,
        playerName: playerName.trim(),
        deckName,
        deckCards: getDeckCards(),
      }));
      goScreen("waiting");
    });
  }

  function handleShare() {
    if (!gameState?.code) return;
    Share.share({
      message: showEnglish
        ? `Join my MtG Master game! Room code: ${gameState.code}\n\nhttps://magic-keyword-explainer.replit.app`
        : `Tritt meinem MtG Master Spiel bei! Raumcode: ${gameState.code}\n\nhttps://magic-keyword-explainer.replit.app`,
    });
  }

  function doLeave() {
    disconnectWs();
    clearSavedLobby();
    goScreen("home");
    setGameState(null);
    setRole(null);
    setError(null);
    setSelectedHandCard(null);
    setSelectedBfCard(null);
  }

  function handleLeave() {
    // On the waiting screen: just navigate home — lobby stays alive on the server
    if (screenRef.current === "waiting") { goScreen("home"); return; }
    Alert.alert(
      showEnglish ? "Leave Game?" : "Spiel verlassen?",
      showEnglish ? "You will disconnect." : "Du trennst dich vom Spiel.",
      [
        { text: showEnglish ? "Cancel" : "Abbrechen", style: "cancel" },
        { text: showEnglish ? "Leave" : "Verlassen", style: "destructive", onPress: doLeave },
      ]
    );
  }

  function handleReset() {
    Alert.alert(
      showEnglish ? "Restart Game?" : "Spiel neu starten?",
      showEnglish ? "All life totals, cards and log will be reset." : "Alle Lebenspunkte, Karten und das Protokoll werden zurückgesetzt.",
      [
        { text: showEnglish ? "Cancel" : "Abbrechen", style: "cancel" },
        { text: showEnglish ? "Restart" : "Neu starten", style: "destructive", onPress: () => send({ type: "reset_game" }) },
      ]
    );
  }

  function haptic(style: "light" | "medium" | "heavy" = "light") {
    Haptics.impactAsync(
      style === "light" ? Haptics.ImpactFeedbackStyle.Light
        : style === "medium" ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Heavy
    ).catch(() => {});
  }

  const fmt = FORMAT_OPTIONS.find(f => f.key === (gameState?.format ?? selectedFormat));
  const isMyTurn = gameState?.activePlayer === gameState?.me?.name;
  const isCommander = gameState?.format === "commander";
  const phaseLabels = showEnglish ? PHASE_LABELS_EN : PHASE_LABELS_DE;
  const currentPhaseLabel = phaseLabels[gameState?.phase ?? "main1"];

  // ── Render ────────────────────────────────────────────────────────────────

  const content = (
      <View style={[s.root, { backgroundColor: colors.background }]}>

        {/* ── HOME SCREEN ── */}
        {screen === "home" && (
          <View style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 12, paddingTop: asScreen ? 8 : insets.top + 8 }}
            keyboardShouldPersistTaps="handled"
          >
            {!asScreen && (
              <View style={s.header}>
                <View style={[s.headerIcon, { backgroundColor: colors.primary + "22" }]}>
                  <Ionicons name="game-controller" size={22} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.headerTitle, { color: colors.foreground }]}>
                    {showEnglish ? "Play MtG" : "MtG spielen"}
                  </Text>
                  <Text style={[s.headerSub, { color: colors.mutedForeground }]}>
                    {showEnglish ? "Virtual game table — real opponent" : "Virtueller Spieltisch — echter Gegner"}
                  </Text>
                </View>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close-circle" size={26} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            )}

            {/* ── Reconnect banner ── */}
            {savedLobby && screen === "home" && (
              <View style={[s.rejoinBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "55" }]}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}
                  onPress={() => handleRejoin(savedLobby)}
                  activeOpacity={0.8}
                >
                  <View style={[s.rejoinIconWrap, { backgroundColor: colors.primary + "22" }]}>
                    <Ionicons name="arrow-redo-circle" size={22} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primary }}>
                      {showEnglish ? "Rejoin open lobby" : "Zur offenen Lobby zurückkehren"}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.mutedForeground, marginTop: 1 }}>
                      {savedLobby.code}  ·  {savedLobby.format}  ·  {savedLobby.isPublic ? (showEnglish ? "Public" : "Öffentlich") : (showEnglish ? "Private" : "Privat")}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={clearSavedLobby}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={{ marginLeft: 4 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            )}

            {error && (
              <View style={[s.errorBox, { backgroundColor: "#ef444418", borderColor: "#ef4444" }]}>
                <Ionicons name="warning-outline" size={15} color="#ef4444" />
                <Text style={{ flex: 1, fontSize: 13, color: "#ef4444", fontFamily: "Inter_400Regular" }}>{error}</Text>
              </View>
            )}

            <Text style={[s.label, { color: colors.foreground }]}>{showEnglish ? "Your name" : "Dein Name"}</Text>
            <TextInput
              style={[s.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
              value={playerName} onChangeText={setPlayerName}
              placeholder={showEnglish ? "Player name…" : "Spielername…"}
              placeholderTextColor={colors.mutedForeground} maxLength={24} autoCorrect={false}
            />

            {decks.length > 0 && (
              <>
                <Text style={[s.label, { color: colors.foreground }]}>{showEnglish ? "Your deck" : "Dein Deck"}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {decks.map(deck => (
                    <TouchableOpacity
                      key={deck.id}
                      style={[s.deckChip, {
                        backgroundColor: selectedDeckId === deck.id ? colors.primary + "22" : colors.card,
                        borderColor: selectedDeckId === deck.id ? colors.primary : colors.border,
                      }]}
                      onPress={() => setSelectedDeckId(deck.id)}
                    >
                      <Ionicons name="albums-outline" size={13} color={selectedDeckId === deck.id ? colors.primary : colors.mutedForeground} />
                      <Text style={{ fontSize: 12, fontFamily: "Inter_500Medium", color: selectedDeckId === deck.id ? colors.primary : colors.foreground }} numberOfLines={1}>
                        {deck.name}
                      </Text>
                      <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                        {deck.cards.reduce((sum, c) => sum + (c.count ?? 1), 0) + Object.values(deck.lands ?? {}).reduce((s: number, n) => s + (n as number), 0)} Karten
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Mode tabs */}
            <View style={[s.modeTabs, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {(["create", "join"] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.modeTab, homeMode === m && { backgroundColor: colors.primary + "22" }]}
                  onPress={() => { setHomeMode(m); setError(null); }}
                >
                  <Ionicons name={m === "create" ? "add-circle-outline" : "enter-outline"} size={16}
                    color={homeMode === m ? colors.primary : colors.mutedForeground} />
                  <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: homeMode === m ? colors.primary : colors.mutedForeground }}>
                    {m === "create" ? (showEnglish ? "Create" : "Erstellen") : (showEnglish ? "Join" : "Beitreten")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {homeMode === "create" ? (
              <>
                {/* Public / Private toggle */}
                <View style={[s.visibilityRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={[s.visibilityBtn, isPublic && { backgroundColor: colors.primary + "22" }]}
                    onPress={() => setIsPublic(true)}
                  >
                    <Ionicons name="globe-outline" size={14} color={isPublic ? colors.primary : colors.mutedForeground} />
                    <View>
                      <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: isPublic ? colors.primary : colors.mutedForeground }}>
                        {showEnglish ? "Public" : "Öffentlich"}
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
                        {showEnglish ? "Listed — first joiner in" : "Gelistet — erster tritt ein"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.visibilityBtn, !isPublic && { backgroundColor: colors.primary + "22" }]}
                    onPress={() => setIsPublic(false)}
                  >
                    <Ionicons name="lock-closed-outline" size={14} color={!isPublic ? colors.primary : colors.mutedForeground} />
                    <View>
                      <Text style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: !isPublic ? colors.primary : colors.mutedForeground }}>
                        {showEnglish ? "Private" : "Privat"}
                      </Text>
                      <Text style={{ fontSize: 10, fontFamily: "Inter_400Regular", color: colors.mutedForeground }}>
                        {showEnglish ? "Invite link required" : "Nur per Einladungslink"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Text style={[s.label, { color: colors.foreground }]}>Format</Text>
                <View style={s.formatGrid}>
                  {FORMAT_OPTIONS.map(f => {
                    const sel = selectedFormat === f.key;
                    return (
                      <TouchableOpacity
                        key={f.key}
                        style={[s.formatChip, {
                          backgroundColor: sel ? colors.primary + "22" : colors.card,
                          borderColor: sel ? colors.primary : colors.border,
                        }]}
                        onPress={() => setSelectedFormat(f.key)}
                      >
                        <Text numberOfLines={1} style={{ fontSize: 12, fontFamily: "Inter_600SemiBold", color: sel ? colors.primary : colors.foreground }}>
                          {showEnglish ? f.labelEn : f.label}
                        </Text>
                        <Text style={{ fontSize: 10, color: sel ? colors.primary + "cc" : colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                          {f.life} LP
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : (
              <>
                <Text style={[s.label, { color: colors.foreground }]}>{showEnglish ? "Room code" : "Raumcode"}</Text>
                <TextInput
                  style={[s.input, s.codeInput, { color: colors.primary, backgroundColor: colors.card, borderColor: colors.border }]}
                  value={joinCode} onChangeText={t => setJoinCode(t.toUpperCase())}
                  placeholder="XXXXXX" placeholderTextColor={colors.mutedForeground}
                  maxLength={6} autoCapitalize="characters" autoCorrect={false}
                />
                <TouchableOpacity
                  style={[s.primaryBtn, { backgroundColor: colors.primary, opacity: connecting ? 0.7 : 1 }]}
                  onPress={() => handleJoin()} disabled={connecting}
                >
                  {connecting ? <ActivityIndicator color="#0f0d0a" size="small" /> : (
                    <>
                      <Ionicons name="enter" size={18} color="#0f0d0a" />
                      <Text style={s.primaryBtnText}>{showEnglish ? "Join Room" : "Beitreten"}</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={s.openRoomsHeader}>
                  <Text style={[s.label, { color: colors.foreground, marginBottom: 0 }]}>
                    {showEnglish ? "Open Lobbies" : "Offene Lobbys"}
                  </Text>
                  <TouchableOpacity onPress={fetchOpenRooms}>
                    <Ionicons name={loadingRooms ? "sync" : "refresh-outline"} size={16} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
                {openRooms.length === 0 ? (
                  <Text style={{ fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 6 }}>
                    {showEnglish ? "No open lobbies." : "Keine offenen Lobbys."}
                  </Text>
                ) : openRooms.map(r => (
                  <TouchableOpacity
                    key={r.code}
                    style={[s.lobbyRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => { setJoinCode(r.code); handleJoin(r.code); }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>{r.host.name}</Text>
                      <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                        {r.host.deckName} · {FORMAT_OPTIONS.find(f => f.key === r.format)?.label ?? r.format} · {r.startingLife} LP
                      </Text>
                    </View>
                    <View style={[s.codeBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}>
                      <Text style={{ fontSize: 13, fontFamily: "Inter_700Bold", color: colors.primary }}>{r.code}</Text>
                    </View>
                    <Ionicons name="enter-outline" size={18} color={colors.primary} />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </ScrollView>

          {/* ── Sticky create button ── */}
          {homeMode === "create" && (
            <View style={[s.stickyFooter, { borderTopColor: colors.border, paddingBottom: asScreen ? 10 : 16, backgroundColor: colors.background }]}>
              <TouchableOpacity
                style={[s.primaryBtn, { backgroundColor: colors.primary, opacity: connecting ? 0.7 : 1, marginTop: 0 }]}
                onPress={handleCreate} disabled={connecting}
              >
                {connecting ? <ActivityIndicator color="#0f0d0a" size="small" /> : (
                  <>
                    <Ionicons name="add-circle" size={18} color="#0f0d0a" />
                    <Text style={s.primaryBtnText}>{showEnglish ? "Create Room" : "Lobby erstellen"}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
          </View>
        )}

        {/* ── WAITING SCREEN ── */}
        {screen === "waiting" && (
          <View style={[s.centered, { paddingBottom: insets.bottom + 20, paddingTop: insets.top + 20 }]}>
            <TouchableOpacity style={s.backBtn} onPress={handleLeave}>
              <Ionicons name="arrow-back" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>

            {myRole === "host" && gameState?.status !== "playing" ? (
              <>
                <View style={[s.waitIcon, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
                  <Ionicons name={gameState?.isPublic ? "globe-outline" : "lock-closed-outline"} size={44} color={colors.primary} />
                </View>
                <Text style={[s.waitTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Waiting for opponent…" : "Warte auf Mitspieler…"}
                </Text>

                {gameState?.isPublic ? (
                  /* ── Public lobby ── */
                  <>
                    <View style={[s.publicBadge, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
                      <Ionicons name="globe-outline" size={15} color={colors.primary} />
                      <Text style={{ fontSize: 13, color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                        {showEnglish ? "Public — visible in lobby list" : "Öffentlich — in der Lobby-Liste sichtbar"}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8 }}>
                      {showEnglish
                        ? "The lobby closes automatically when a player joins."
                        : "Die Lobby schließt automatisch, sobald ein Spieler beitritt."}
                    </Text>
                  </>
                ) : (
                  /* ── Private lobby ── */
                  <>
                    <Text style={[s.waitSub, { color: colors.mutedForeground }]}>
                      {showEnglish ? "Share the room code:" : "Teile den Raumcode:"}
                    </Text>
                    <View style={[s.codeDisplay, { backgroundColor: colors.card, borderColor: colors.primary + "66" }]}>
                      <Text style={[s.codeText, { color: colors.primary }]}>{gameState?.code ?? "…"}</Text>
                    </View>
                    <TouchableOpacity style={[s.shareBtn, { backgroundColor: colors.primary }]} onPress={handleShare}>
                      <Ionicons name="share-outline" size={18} color="#0f0d0a" />
                      <Text style={s.primaryBtnText}>{showEnglish ? "Share Invite Link" : "Einladungslink teilen"}</Text>
                    </TouchableOpacity>
                  </>
                )}

                <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 16 }}>
                  Format: {fmt?.label ?? gameState?.format}  ·  {gameState?.startingLife} LP
                </Text>
              </>
            ) : (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[s.waitTitle, { color: colors.foreground }]}>
                  {showEnglish ? "Joining…" : "Trete bei…"}
                </Text>
              </>
            )}
          </View>
        )}

        {/* ── GAME SCREEN ── */}
        {screen === "game" && gameState && (
          <GameBoard
            gs={gameState}
            isMyTurn={isMyTurn}
            isCommander={isCommander}
            phaseLabels={phaseLabels}
            showEnglish={showEnglish}
            colors={colors}
            insets={insets}
            selectedHandCard={selectedHandCard}
            setSelectedHandCard={setSelectedHandCard}
            selectedBfCard={selectedBfCard}
            setSelectedBfCard={setSelectedBfCard}
            showLog={showLog}
            setShowLog={setShowLog}
            showZone={showZone}
            setShowZone={setShowZone}
            showLifeMenu={showLifeMenu}
            setShowLifeMenu={setShowLifeMenu}
            showCounterMenu={showCounterMenu}
            setShowCounterMenu={setShowCounterMenu}
            onLeave={handleLeave}
            onReset={handleReset}
            onSend={send}
            haptic={haptic}
          />
        )}
      </View>
  );

  if (asScreen) return content;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={screen === "game" ? "fullScreen" : "pageSheet"}
      onRequestClose={() => screen === "home" ? onClose() : handleLeave()}
    >
      {content}
    </Modal>
  );
}

// ─── Game Board ───────────────────────────────────────────────────────────────

interface GameBoardProps {
  gs: GameState;
  isMyTurn: boolean;
  isCommander: boolean;
  phaseLabels: Record<Phase, string>;
  showEnglish: boolean;
  colors: any;
  insets: any;
  selectedHandCard: string | null;
  setSelectedHandCard: (v: string | null) => void;
  selectedBfCard: string | null;
  setSelectedBfCard: (v: string | null) => void;
  showLog: boolean;
  setShowLog: (v: boolean) => void;
  showZone: "graveyard" | "exile" | "oppGraveyard" | "oppExile" | null;
  setShowZone: (v: "graveyard" | "exile" | "oppGraveyard" | "oppExile" | null) => void;
  showLifeMenu: boolean;
  setShowLifeMenu: (v: boolean) => void;
  showCounterMenu: string | null;
  setShowCounterMenu: (v: string | null) => void;
  onLeave: () => void;
  onReset: () => void;
  onSend: (msg: object) => void;
  haptic: (s?: "light" | "medium" | "heavy") => void;
}

function GameBoard({
  gs, isMyTurn, isCommander, phaseLabels, showEnglish,
  colors, insets,
  selectedHandCard, setSelectedHandCard,
  selectedBfCard, setSelectedBfCard,
  showLog, setShowLog,
  showZone, setShowZone,
  showLifeMenu, setShowLifeMenu,
  showCounterMenu, setShowCounterMenu,
  onLeave, onReset, onSend, haptic,
}: GameBoardProps) {

  const me = gs.me;
  const opp = gs.opponent;

  function lifeBtn(delta: number, who: "me" | "opp") {
    haptic(delta < 0 ? "medium" : "light");
    if (who === "me") {
      onSend({ type: "update_life", delta });
    } else {
      // Change opponent's life via commander damage
      onSend({ type: "commander_damage", fromPlayer: me?.name ?? "", delta: -delta });
    }
  }

  function drawCard() {
    haptic("medium");
    onSend({ type: "draw_card" });
  }

  function nextPhase() {
    haptic("heavy");
    onSend({ type: "next_phase" });
  }

  function tapCard(instanceId: string) {
    haptic("light");
    onSend({ type: "tap_card", instanceId });
    setSelectedBfCard(null);
  }

  function playCard(instanceId: string, zone: "battlefield" | "graveyard" | "exile" = "battlefield") {
    haptic("medium");
    onSend({ type: "play_card", instanceId, zone });
    setSelectedHandCard(null);
  }

  function discardCard(instanceId: string) {
    haptic("medium");
    onSend({ type: "discard_card", instanceId });
    setSelectedHandCard(null);
  }

  function moveCard(instanceId: string, from: string, to: string) {
    haptic("medium");
    onSend({ type: "move_card", instanceId, from, to });
    setSelectedBfCard(null);
  }

  function mulligan() {
    onSend({ type: "mulligan" });
  }

  const phaseIdx = PHASE_ORDER.indexOf(gs.phase);

  // Zone modal content
  const zoneCards = showZone === "graveyard" ? (me?.graveyard ?? [])
    : showZone === "exile" ? (me?.exile ?? [])
    : showZone === "oppGraveyard" ? (opp?.graveyard ?? [])
    : showZone === "oppExile" ? (opp?.exile ?? [])
    : [];

  const zoneName = showZone === "graveyard" ? (showEnglish ? "Graveyard" : "Friedhof")
    : showZone === "exile" ? "Exil"
    : showZone === "oppGraveyard" ? (showEnglish ? "Opponent's Graveyard" : "Friedhof Gegner")
    : "Exil Gegner";

  if (showZone) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.zoneHeader, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowZone(null)}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground, marginLeft: 12 }}>{zoneName}</Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{zoneCards.length} Karten</Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 14, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {zoneCards.length === 0 && (
            <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 20 }}>
              {showEnglish ? "Empty" : "Leer"}
            </Text>
          )}
          {zoneCards.map(card => (
            <View key={card.instanceId}>
              <MiniCard card={card} colors={colors} width={80} height={112} />
              {(showZone === "graveyard" || showZone === "exile") && (
                <View style={{ flexDirection: "row", gap: 4, marginTop: 4 }}>
                  <TouchableOpacity
                    style={[s.zoneActionBtn, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "55" }]}
                    onPress={() => { moveCard(card.instanceId, showZone === "graveyard" ? "graveyard" : "exile", "hand"); setShowZone(null); }}
                  >
                    <Text style={{ fontSize: 10, color: colors.primary, fontFamily: "Inter_600SemiBold" }}>→ Hand</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.zoneActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => { moveCard(card.instanceId, showZone === "graveyard" ? "graveyard" : "exile", "battlefield"); setShowZone(null); }}
                  >
                    <Text style={{ fontSize: 10, color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>→ Feld</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (showLog) {
    return (
      <View style={[s.root, { backgroundColor: colors.background }]}>
        <View style={[s.zoneHeader, { paddingTop: insets.top + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => setShowLog(false)}>
            <Ionicons name="arrow-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 16, fontFamily: "Inter_700Bold", color: colors.foreground, marginLeft: 12 }}>
            {showEnglish ? "Game Log" : "Spielprotokoll"}
          </Text>
        </View>
        <ScrollView contentContainerStyle={{ padding: 14, gap: 6 }}>
          {[...gs.gameLog].reverse().map((e, i) => (
            <View key={i} style={[s.logEntry, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                {new Date(e.time).toLocaleTimeString()}
              </Text>
              <Text style={{ fontSize: 13, color: colors.foreground, fontFamily: "Inter_400Regular" }}>{e.msg}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: "#0a0808" }]}>

      {/* ── Top bar ── */}
      <View style={[s.gameTopBar, { paddingTop: insets.top + 4, backgroundColor: "#14110e", borderBottomColor: "#2a2520" }]}>
        <TouchableOpacity onPress={onLeave} style={s.gameTopBtn}>
          <Ionicons name="arrow-back-outline" size={20} color="#c8a96e" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={s.gameTopFormat}>
            {FORMAT_OPTIONS.find(f => f.key === gs.format)?.label ?? gs.format}
          </Text>
          <Text style={s.gameTopTurn}>
            {showEnglish ? `Round ${gs.turn}` : `Runde ${gs.turn}`}
            {" · "}
            {isMyTurn
              ? (showEnglish ? "Your Turn" : "Dein Zug")
              : `${gs.opponent?.name ?? "…"}${showEnglish ? "'s Turn" : "s Zug"}`
            }
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity onPress={() => setShowLog(true)} style={s.gameTopBtn}>
            <Ionicons name="list-outline" size={20} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onReset} style={s.gameTopBtn}>
            <Ionicons name="refresh-outline" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Phase bar ── */}
      <View style={[s.phaseBar, { backgroundColor: "#100d0a" }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8, gap: 4 }}>
          {PHASE_ORDER.map((ph, i) => {
            const isActive = gs.phase === ph;
            const isPast = i < phaseIdx;
            return (
              <View
                key={ph}
                style={[s.phaseChip, {
                  backgroundColor: isActive ? "#c8a96e22" : "transparent",
                  borderColor: isActive ? "#c8a96e" : isPast ? "#3a3530" : "#2a2520",
                }]}
              >
                <Ionicons name={PHASE_ICONS[ph] as any} size={11} color={isActive ? "#c8a96e" : isPast ? "#4a4540" : "#555"} />
                <Text style={{ fontSize: 9, fontFamily: isActive ? "Inter_700Bold" : "Inter_400Regular", color: isActive ? "#c8a96e" : "#555" }}>
                  {phaseLabels[ph]}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Opponent section ── */}
      <View style={[s.oppSection, { borderBottomColor: "#1e1a16" }]}>
        {/* Opponent battlefield */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.bfScroll}
          contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6, gap: 6, alignItems: "center" }}>
          {(opp?.battlefield ?? []).length === 0 ? (
            <Text style={s.emptyBf}>{showEnglish ? "Empty battlefield" : "Spielfeld leer"}</Text>
          ) : (opp?.battlefield ?? []).map(card => (
            <View key={card.instanceId} style={{ transform: [{ rotate: card.tapped ? "90deg" : "0deg" }] }}>
              <MiniCard card={card} colors={colors} width={44} height={62} dimmed />
            </View>
          ))}
        </ScrollView>

        {/* Opponent info bar */}
        <View style={[s.playerBar, { backgroundColor: "#16120f" }]}>
          <View style={s.playerBarLeft}>
            <Text style={s.playerName} numberOfLines={1}>{opp?.name ?? "…"}</Text>
            <Text style={s.deckNameSmall} numberOfLines={1}>{opp?.deckName}</Text>
          </View>
          <View style={s.statChips}>
            <TouchableOpacity
              style={s.lifeChip}
              onPress={() => { haptic("medium"); onSend({ type: "commander_damage", fromPlayer: me?.name ?? "", delta: 1 }); }}
            >
              <Ionicons name="heart" size={11} color="#ef4444" />
              <Text style={s.lifeNum}>{opp?.life ?? "—"}</Text>
            </TouchableOpacity>
            {isCommander && <View style={s.statChip}><Text style={s.statLabel}>Cmd</Text><Text style={s.statVal}>{Object.values(opp?.commanderDamageReceived ?? {}).reduce((a, b) => a + b, 0)}</Text></View>}
            <TouchableOpacity style={s.statChip} onPress={() => setShowZone("oppGraveyard")}>
              <Ionicons name="trash-outline" size={10} color="#888" /><Text style={s.statVal}>{opp?.graveyard?.length ?? 0}</Text>
            </TouchableOpacity>
            <View style={s.statChip}><Ionicons name="hand-left-outline" size={10} color="#888" /><Text style={s.statVal}>{opp?.handCount ?? 0}</Text></View>
            <View style={s.statChip}><Ionicons name="layers-outline" size={10} color="#888" /><Text style={s.statVal}>{opp?.deckCount ?? 0}</Text></View>
          </View>
        </View>
      </View>

      {/* ── Turn / Phase control ── */}
      <View style={[s.phaseControl, { backgroundColor: "#12100e", borderTopColor: "#1e1a16", borderBottomColor: "#1e1a16" }]}>
        <Text style={s.phaseControlLabel}>
          {phaseLabels[gs.phase]}
          {" · "}
          {isMyTurn ? (showEnglish ? "Your Turn" : "Dein Zug") : (opp?.name ?? "…")}
        </Text>
        {isMyTurn && (
          <TouchableOpacity style={[s.nextPhaseBtn, { backgroundColor: "#c8a96e" }]} onPress={nextPhase}>
            <Text style={s.nextPhaseBtnText}>
              {phaseIdx === PHASE_ORDER.length - 1
                ? (showEnglish ? "End Turn →" : "Zug beenden →")
                : `${phaseLabels[PHASE_ORDER[phaseIdx + 1]]} →`
              }
            </Text>
          </TouchableOpacity>
        )}
        {!isMyTurn && (
          <View style={[s.waitingPill, { borderColor: "#2a2520" }]}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={{ fontSize: 11, color: "#666", fontFamily: "Inter_400Regular" }}>
              {showEnglish ? "Waiting…" : "Warte…"}
            </Text>
          </View>
        )}
      </View>

      {/* ── My section ── */}
      <View style={[s.mySection, { borderTopColor: "#1e1a16" }]}>
        {/* My info bar */}
        <View style={[s.playerBar, { backgroundColor: "#16120f" }]}>
          <View style={s.playerBarLeft}>
            <Text style={[s.playerName, { color: "#c8a96e" }]} numberOfLines={1}>{me?.name ?? "…"}</Text>
            <Text style={s.deckNameSmall} numberOfLines={1}>{me?.deckName}</Text>
          </View>
          <View style={s.statChips}>
            <View style={s.lifeChips}>
              <TouchableOpacity onPress={() => lifeBtn(-1, "me")} style={s.lifeAdjBtn}>
                <Text style={s.lifeAdjText}>−1</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => lifeBtn(-5, "me")} style={s.lifeAdjBtn}>
                <Text style={s.lifeAdjText}>−5</Text>
              </TouchableOpacity>
              <View style={s.lifeChip}>
                <Ionicons name="heart" size={11} color="#ef4444" />
                <Text style={s.lifeNum}>{me?.life ?? "—"}</Text>
              </View>
              <TouchableOpacity onPress={() => lifeBtn(1, "me")} style={s.lifeAdjBtn}>
                <Text style={s.lifeAdjText}>+1</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => lifeBtn(5, "me")} style={s.lifeAdjBtn}>
                <Text style={s.lifeAdjText}>+5</Text>
              </TouchableOpacity>
            </View>
            {isCommander && <View style={s.statChip}><Text style={s.statLabel}>Cmd</Text><Text style={s.statVal}>{Object.values(me?.commanderDamageReceived ?? {}).reduce((a, b) => a + b, 0)}</Text></View>}
            <TouchableOpacity style={s.statChip} onPress={() => setShowZone("graveyard")}>
              <Ionicons name="trash-outline" size={10} color="#888" /><Text style={s.statVal}>{me?.graveyard?.length ?? 0}</Text>
            </TouchableOpacity>
            <View style={s.statChip}><Ionicons name="layers-outline" size={10} color="#888" /><Text style={s.statVal}>{me?.deckCount ?? 0}</Text></View>
          </View>
        </View>

        {/* My battlefield */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.bfScroll}
          contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6, gap: 6, alignItems: "center" }}>
          {(me?.battlefield ?? []).length === 0 ? (
            <Text style={s.emptyBf}>{showEnglish ? "Play cards here" : "Karten hier ausspielen"}</Text>
          ) : (me?.battlefield ?? []).map(card => (
            <View key={card.instanceId}>
              <TouchableOpacity
                onPress={() => {
                  if (selectedBfCard === card.instanceId) {
                    setSelectedBfCard(null);
                  } else {
                    setSelectedBfCard(card.instanceId);
                    setSelectedHandCard(null);
                  }
                }}
                style={{ transform: [{ rotate: card.tapped ? "90deg" : "0deg" }] }}
              >
                <MiniCard card={card} colors={colors} width={44} height={62}
                  selected={selectedBfCard === card.instanceId} />
              </TouchableOpacity>
              {Object.entries(card.counters).filter(([, v]) => v > 0).map(([k, v]) => (
                <View key={k} style={s.counterBadge}>
                  <Text style={s.counterBadgeText}>{k}:{v}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>

        {/* Battlefield card actions */}
        {selectedBfCard && (
          <View style={[s.bfActions, { backgroundColor: "#1a1610", borderTopColor: "#2a2520" }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
              <TouchableOpacity style={[s.bfActionBtn, { backgroundColor: "#c8a96e22", borderColor: "#c8a96e55" }]}
                onPress={() => tapCard(selectedBfCard)}>
                <Ionicons name="sync-outline" size={13} color="#c8a96e" />
                <Text style={{ fontSize: 11, color: "#c8a96e", fontFamily: "Inter_600SemiBold" }}>
                  {(me?.battlefield.find(c => c.instanceId === selectedBfCard)?.tapped) ? (showEnglish ? "Untap" : "Bereit") : (showEnglish ? "Tap" : "Tap")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.bfActionBtn, { backgroundColor: "#ef444422", borderColor: "#ef444455" }]}
                onPress={() => moveCard(selectedBfCard, "battlefield", "graveyard")}>
                <Ionicons name="trash-outline" size={13} color="#ef4444" />
                <Text style={{ fontSize: 11, color: "#ef4444", fontFamily: "Inter_600SemiBold" }}>
                  {showEnglish ? "Graveyard" : "Friedhof"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.bfActionBtn, { backgroundColor: "#33333322", borderColor: "#44444455" }]}
                onPress={() => moveCard(selectedBfCard, "battlefield", "hand")}>
                <Ionicons name="hand-left-outline" size={13} color="#aaa" />
                <Text style={{ fontSize: 11, color: "#aaa", fontFamily: "Inter_600SemiBold" }}>
                  {showEnglish ? "Return" : "Zurück"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.bfActionBtn, { backgroundColor: "#88229922", borderColor: "#88229955" }]}
                onPress={() => moveCard(selectedBfCard, "battlefield", "exile")}>
                <Ionicons name="infinite-outline" size={13} color="#cc66ee" />
                <Text style={{ fontSize: 11, color: "#cc66ee", fontFamily: "Inter_600SemiBold" }}>Exil</Text>
              </TouchableOpacity>
              {["+1/+1", "-1/-1", "Marke", "Gift"].map(ctr => (
                <TouchableOpacity key={ctr} style={[s.bfActionBtn, { backgroundColor: "#22334422", borderColor: "#33445555" }]}
                  onPress={() => { onSend({ type: "add_counter", instanceId: selectedBfCard, counter: ctr, delta: 1 }); haptic("light"); }}>
                  <Text style={{ fontSize: 11, color: "#88ccff", fontFamily: "Inter_600SemiBold" }}>+{ctr}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={[s.bfActionBtn, { backgroundColor: "#33333322", borderColor: "#33333344" }]}
                onPress={() => setSelectedBfCard(null)}>
                <Ionicons name="close-outline" size={13} color="#666" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>

      {/* ── My hand ── */}
      <View style={[s.handSection, { backgroundColor: "#0e0c0a", borderTopColor: "#2a2520", paddingBottom: insets.bottom + 4 }]}>
        <View style={s.handHeader}>
          <Text style={s.handLabel}>
            {showEnglish ? "Hand" : "Hand"} ({me?.hand?.length ?? 0})
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={drawCard} style={[s.drawBtn, { backgroundColor: "#1e1a16", borderColor: "#3a3530" }]}>
              <Ionicons name="layers-outline" size={13} color="#c8a96e" />
              <Text style={{ fontSize: 11, color: "#c8a96e", fontFamily: "Inter_600SemiBold" }}>
                {showEnglish ? "Draw" : "Ziehen"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onSend({ type: "untap_all" })} style={[s.drawBtn, { backgroundColor: "#1e1a16", borderColor: "#3a3530" }]}>
              <Ionicons name="refresh-circle-outline" size={13} color="#aaa" />
              <Text style={{ fontSize: 11, color: "#aaa", fontFamily: "Inter_600SemiBold" }}>
                {showEnglish ? "Untap All" : "Alle bereit"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={mulligan} style={[s.drawBtn, { backgroundColor: "#1e1a16", borderColor: "#3a3530" }]}>
              <Ionicons name="dice-outline" size={13} color="#aaa" />
              <Text style={{ fontSize: 11, color: "#aaa", fontFamily: "Inter_600SemiBold" }}>Mull</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 6, gap: 8, alignItems: "flex-end" }}>
          {(me?.hand ?? []).length === 0 && (
            <Text style={[s.emptyBf, { fontSize: 12 }]}>
              {showEnglish ? "Hand is empty" : "Hand leer"}
            </Text>
          )}
          {(me?.hand ?? []).map(card => {
            const isSelected = selectedHandCard === card.instanceId;
            return (
              <View key={card.instanceId}>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedHandCard(isSelected ? null : card.instanceId);
                    setSelectedBfCard(null);
                  }}
                  style={{ transform: [{ translateY: isSelected ? -12 : 0 }] }}
                >
                  <MiniCard card={card} colors={colors} width={54} height={76} selected={isSelected} />
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>

        {/* Hand card actions */}
        {selectedHandCard && (
          <View style={[s.handActions, { backgroundColor: "#1a1610", borderTopColor: "#2a2520" }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 10, paddingVertical: 6 }}>
              <TouchableOpacity style={[s.bfActionBtn, { backgroundColor: "#c8a96e22", borderColor: "#c8a96e55" }]}
                onPress={() => playCard(selectedHandCard, "battlefield")}>
                <Ionicons name="play-outline" size={13} color="#c8a96e" />
                <Text style={{ fontSize: 11, color: "#c8a96e", fontFamily: "Inter_600SemiBold" }}>
                  {showEnglish ? "Play" : "Ausspielen"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.bfActionBtn, { backgroundColor: "#ef444422", borderColor: "#ef444455" }]}
                onPress={() => discardCard(selectedHandCard)}>
                <Ionicons name="trash-outline" size={13} color="#ef4444" />
                <Text style={{ fontSize: 11, color: "#ef4444", fontFamily: "Inter_600SemiBold" }}>
                  {showEnglish ? "Discard" : "Abwerfen"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.bfActionBtn, { backgroundColor: "#88229922", borderColor: "#88229955" }]}
                onPress={() => playCard(selectedHandCard, "exile")}>
                <Ionicons name="infinite-outline" size={13} color="#cc66ee" />
                <Text style={{ fontSize: 11, color: "#cc66ee", fontFamily: "Inter_600SemiBold" }}>Exil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.bfActionBtn, { backgroundColor: "#33333322", borderColor: "#33333344" }]}
                onPress={() => setSelectedHandCard(null)}>
                <Ionicons name="close-outline" size={13} color="#666" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Mini Card ────────────────────────────────────────────────────────────────

function MiniCard({ card, colors, width, height, selected = false, dimmed = false }: {
  card: GameCard; colors: any; width: number; height: number; selected?: boolean; dimmed?: boolean;
}) {
  const borderColor = selected ? "#c8a96e" : "#2a2520";
  return (
    <View style={{
      width, height, borderRadius: 5, overflow: "hidden",
      borderWidth: selected ? 2 : 1, borderColor,
      opacity: dimmed ? 0.75 : 1,
      ...(Platform.OS === "ios" && selected ? { shadowColor: "#c8a96e", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6 } : {}),
      ...(Platform.OS === "android" && selected ? { elevation: 8 } : {}),
    }}>
      {card.imageUri ? (
        <Image source={{ uri: card.imageUri }} style={{ width, height }} resizeMode="cover" />
      ) : (
        <View style={{ width, height, backgroundColor: "#1a1810", alignItems: "center", justifyContent: "center", padding: 3 }}>
          {card.mana_cost && <ManaCost cost={card.mana_cost} size={9} />}
          <Text style={{ fontSize: 8, fontFamily: "Inter_600SemiBold", color: "#c8a96e", textAlign: "center", marginTop: 2 }} numberOfLines={3}>
            {card.name}
          </Text>
          {card.type_line && (
            <Text style={{ fontSize: 7, fontFamily: "Inter_400Regular", color: "#888", textAlign: "center", marginTop: 2 }} numberOfLines={2}>
              {card.type_line}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1 },

  // Home
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  headerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 22, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, marginBottom: 14 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 8, marginTop: 4 },
  input: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 16 },
  codeInput: { textAlign: "center", fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: 8 },
  deckChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  modeTabs: { flexDirection: "row", borderRadius: 12, borderWidth: 1, marginBottom: 18, overflow: "hidden" },
  modeTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11 },
  formatGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  formatChip: { width: "48%", flexDirection: "column", alignItems: "flex-start", gap: 2, padding: 10, borderRadius: 10, borderWidth: 1 },
  rejoinBanner: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  rejoinIconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  visibilityRow: { flexDirection: "row", borderRadius: 12, borderWidth: 1, marginBottom: 14, overflow: "hidden" },
  visibilityBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  publicBadge: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  stickyFooter: { paddingHorizontal: 16, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, marginTop: 10 },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#0f0d0a" },
  openRoomsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 12 },
  lobbyRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  codeBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },

  // Waiting
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  backBtn: { position: "absolute", top: 60, left: 20, padding: 8 },
  waitIcon: { width: 90, height: 90, borderRadius: 45, alignItems: "center", justifyContent: "center", borderWidth: 1, marginBottom: 20 },
  waitTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 8, textAlign: "center" },
  waitSub: { fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 24, textAlign: "center" },
  codeDisplay: { paddingHorizontal: 32, paddingVertical: 20, borderRadius: 18, borderWidth: 2, marginBottom: 20 },
  codeText: { fontSize: 40, fontFamily: "Inter_700Bold", letterSpacing: 12, textAlign: "center" },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },

  // Game board
  gameTopBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingBottom: 8, borderBottomWidth: 1 },
  gameTopBtn: { padding: 6 },
  gameTopFormat: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#c8a96e", textAlign: "center" },
  gameTopTurn: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#888", textAlign: "center" },

  phaseBar: { paddingVertical: 5, borderBottomWidth: 0 },
  phaseChip: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },

  oppSection: { borderBottomWidth: 1 },
  bfScroll: { height: 88 },
  emptyBf: { fontSize: 11, color: "#3a3530", fontFamily: "Inter_400Regular", paddingHorizontal: 8 },
  playerBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6 },
  playerBarLeft: { flex: 1, marginRight: 8 },
  playerName: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#ddd" },
  deckNameSmall: { fontSize: 9, fontFamily: "Inter_400Regular", color: "#555" },
  statChips: { flexDirection: "row", alignItems: "center", gap: 5, flexWrap: "wrap" },
  lifeChips: { flexDirection: "row", alignItems: "center", gap: 3 },
  lifeChip: { flexDirection: "row", alignItems: "center", gap: 3 },
  lifeNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  lifeAdjBtn: { paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6, backgroundColor: "#1e1a16" },
  lifeAdjText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#c8a96e" },
  statChip: { flexDirection: "row", alignItems: "center", gap: 2, backgroundColor: "#1a1610", paddingHorizontal: 5, paddingVertical: 3, borderRadius: 6 },
  statLabel: { fontSize: 9, color: "#666", fontFamily: "Inter_400Regular" },
  statVal: { fontSize: 10, color: "#aaa", fontFamily: "Inter_700Bold" },

  phaseControl: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderBottomWidth: 1 },
  phaseControlLabel: { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#aaa" },
  nextPhaseBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10 },
  nextPhaseBtnText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#0f0d0a" },
  waitingPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },

  mySection: { flex: 1, borderTopWidth: 0 },
  bfActions: { flexDirection: "row", borderTopWidth: 1 },
  bfActionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },

  handSection: { borderTopWidth: 1 },
  handHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 10, paddingTop: 6, paddingBottom: 4 },
  handLabel: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#888" },
  drawBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  handActions: { borderTopWidth: 1 },

  counterBadge: { position: "absolute", top: 2, right: 2, backgroundColor: "#7755aa", borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1 },
  counterBadgeText: { fontSize: 7, color: "#fff", fontFamily: "Inter_700Bold" },

  // Zone modal
  zoneHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 1 },
  zoneActionBtn: { flex: 1, alignItems: "center", paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  logEntry: { padding: 8, borderRadius: 8, borderWidth: 1 },
});
