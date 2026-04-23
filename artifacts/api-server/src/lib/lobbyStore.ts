import type { WebSocket } from "ws";

// ─── Card types ───────────────────────────────────────────────────────────────

export type InputCard = {
  id: string;
  name: string;
  printed_name?: string;
  mana_cost?: string;
  cmc?: number;
  type_line?: string;
  imageUri?: string;
  count?: number;
};

export type GameCard = {
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

export type Phase = "untap" | "upkeep" | "draw" | "main1" | "combat" | "main2" | "end";
export const PHASE_ORDER: Phase[] = ["untap", "upkeep", "draw", "main1", "combat", "main2", "end"];

export type PlayerBoard = {
  deck: GameCard[];
  hand: GameCard[];
  battlefield: GameCard[];
  graveyard: GameCard[];
  exile: GameCard[];
};

export type PlayerState = {
  name: string;
  deckName: string;
  life: number;
  poison: number;
  commanderDamageReceived: Record<string, number>;
  board: PlayerBoard;
};

export type GameLogEntry = { time: number; msg: string };

export type Room = {
  code: string;
  host: PlayerState;
  guest: PlayerState | null;
  format: string;
  startingLife: number;
  status: "waiting" | "playing" | "finished";
  turn: number;
  phase: Phase;
  activePlayer: string;
  gameLog: GameLogEntry[];
  createdAt: number;
  hostWs: WebSocket | null;
  guestWs: WebSocket | null;
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function expandCards(cards: InputCard[]): GameCard[] {
  const result: GameCard[] = [];
  for (const card of cards) {
    const n = card.count ?? 1;
    for (let i = 0; i < n; i++) {
      result.push({
        instanceId: `${card.id}-${Math.random().toString(36).slice(2, 9)}`,
        id: card.id,
        name: card.name,
        printed_name: card.printed_name,
        mana_cost: card.mana_cost,
        cmc: card.cmc,
        type_line: card.type_line,
        imageUri: card.imageUri,
        tapped: false,
        counters: {},
      });
    }
  }
  return result;
}

function emptyBoard(): PlayerBoard {
  return { deck: [], hand: [], battlefield: [], graveyard: [], exile: [] };
}

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function log(room: Room, msg: string) {
  room.gameLog.push({ time: Date.now(), msg });
  if (room.gameLog.length > 80) room.gameLog.shift();
}

// ─── Personalized state ───────────────────────────────────────────────────────

function viewFor(room: Room, role: "host" | "guest") {
  const me = role === "host" ? room.host : room.guest;
  const opp = role === "host" ? room.guest : room.host;
  return {
    code: room.code,
    format: room.format,
    startingLife: room.startingLife,
    status: room.status,
    turn: room.turn,
    phase: room.phase,
    activePlayer: room.activePlayer,
    gameLog: room.gameLog.slice(-30),
    createdAt: room.createdAt,
    me: me ? {
      name: me.name,
      deckName: me.deckName,
      life: me.life,
      poison: me.poison,
      commanderDamageReceived: me.commanderDamageReceived,
      deckCount: me.board.deck.length,
      hand: me.board.hand,
      battlefield: me.board.battlefield,
      graveyard: me.board.graveyard,
      exile: me.board.exile,
    } : null,
    opponent: opp ? {
      name: opp.name,
      deckName: opp.deckName,
      life: opp.life,
      poison: opp.poison,
      commanderDamageReceived: opp.commanderDamageReceived,
      deckCount: opp.board.deck.length,
      handCount: opp.board.hand.length,
      battlefield: opp.board.battlefield,
      graveyard: opp.board.graveyard,
      exile: opp.board.exile,
    } : null,
  };
}

function broadcast(room: Room) {
  const hostView = viewFor(room, "host");
  const guestView = viewFor(room, "guest");
  if (room.hostWs?.readyState === 1) {
    room.hostWs.send(JSON.stringify({ type: "game_state", state: hostView }));
  }
  if (room.guestWs?.readyState === 1) {
    room.guestWs.send(JSON.stringify({ type: "game_state", state: guestView }));
  }
}

function sendToRole(room: Room, role: "host" | "guest") {
  const ws = role === "host" ? room.hostWs : room.guestWs;
  if (ws?.readyState === 1) {
    ws.send(JSON.stringify({ type: "game_state", state: viewFor(room, role) }));
  }
}

// ─── Game helper: draw a card ─────────────────────────────────────────────────

function drawCard(player: PlayerState, room: Room): boolean {
  if (player.board.deck.length === 0) {
    log(room, `${player.name}: Deck leer! Kann nicht ziehen.`);
    return false;
  }
  const card = player.board.deck.shift()!;
  player.board.hand.push(card);
  log(room, `${player.name}: zieht eine Karte (${player.board.hand.length} auf Hand)`);
  return true;
}

// ─── Phase advancement ────────────────────────────────────────────────────────

function advancePhase(room: Room, role: "host" | "guest") {
  const player = role === "host" ? room.host : room.guest;
  if (!player || room.activePlayer !== player.name) return;

  const currentIdx = PHASE_ORDER.indexOf(room.phase);

  if (currentIdx === PHASE_ORDER.length - 1) {
    // End of END phase → switch active player
    room.activePlayer = room.activePlayer === room.host.name
      ? (room.guest?.name ?? room.host.name)
      : room.host.name;
    room.turn += 1;
    room.phase = "untap";
    const nextPlayer = room.activePlayer === room.host.name ? room.host : room.guest;
    if (nextPlayer) {
      // Auto-untap all permanents
      nextPlayer.board.battlefield.forEach(c => { c.tapped = false; });
      log(room, `Runde ${room.turn} — ${room.activePlayer} ist am Zug`);
    }
    // Skip untap phase, go straight to upkeep
    room.phase = "upkeep";
    log(room, `${room.activePlayer}: Aufklärungsphase → Vorbereitungsphase`);
  } else {
    const nextPhase = PHASE_ORDER[currentIdx + 1];

    if (room.phase === "untap") {
      player.board.battlefield.forEach(c => { c.tapped = false; });
      log(room, `${player.name}: Alle Karten bereit`);
    }

    room.phase = nextPhase;
    const phaseNames: Record<Phase, string> = {
      untap: "Aufklärung", upkeep: "Vorbereitung", draw: "Ziehphase",
      main1: "Hauptphase 1", combat: "Kampfphase", main2: "Hauptphase 2", end: "Endphase",
    };
    log(room, `${player.name}: ${phaseNames[nextPhase]}`);

    if (nextPhase === "draw") {
      drawCard(player, room);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createRoom(opts: {
  hostName: string; deckName: string; format: string; startingLife: number;
  deckCards?: InputCard[];
}): Room {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();

  const deck = opts.deckCards ? shuffle(expandCards(opts.deckCards)) : [];
  const host: PlayerState = {
    name: opts.hostName,
    deckName: opts.deckName,
    life: opts.startingLife,
    poison: 0,
    commanderDamageReceived: {},
    board: { ...emptyBoard(), deck },
  };

  const room: Room = {
    code,
    host,
    guest: null,
    format: opts.format,
    startingLife: opts.startingLife,
    status: "waiting",
    turn: 1,
    phase: "main1",
    activePlayer: opts.hostName,
    gameLog: [{ time: Date.now(), msg: `Raum erstellt von ${opts.hostName} (${opts.deckName})` }],
    createdAt: Date.now(),
    hostWs: null,
    guestWs: null,
  };

  rooms.set(code, room);
  setTimeout(() => rooms.delete(code), 2 * 60 * 60 * 1000);
  return room;
}

export function joinRoom(code: string, opts: {
  guestName: string; deckName: string; deckCards?: InputCard[];
}): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room || room.guest || room.status !== "waiting") return null;

  const deck = opts.deckCards ? shuffle(expandCards(opts.deckCards)) : [];
  room.guest = {
    name: opts.guestName,
    deckName: opts.deckName,
    life: room.startingLife,
    poison: 0,
    commanderDamageReceived: {},
    board: { ...emptyBoard(), deck },
  };
  room.status = "playing";
  room.phase = "untap";

  // Deal starting hands
  const handSize = 7;
  for (let i = 0; i < handSize; i++) drawCard(room.host, room);
  for (let i = 0; i < handSize; i++) drawCard(room.guest, room);
  room.gameLog = [];
  log(room, `${opts.guestName} (${opts.deckName}) ist beigetreten — Spiel beginnt!`);
  log(room, `Beide Spieler haben ${handSize} Karten gezogen`);
  log(room, `Runde 1 — ${room.activePlayer} beginnt (Aufklärungsphase)`);

  // Auto advance past untap
  room.host.board.battlefield.forEach(c => { c.tapped = false; });
  room.phase = "upkeep";
  log(room, `${room.activePlayer}: Vorbereitungsphase`);

  return room;
}

export function getRoom(code: string): Room | null {
  return rooms.get(code.toUpperCase()) ?? null;
}

export function listWaitingRooms() {
  return Array.from(rooms.values())
    .filter((r) => r.status === "waiting" && Date.now() - r.createdAt < 30 * 60 * 1000)
    .map((r) => ({
      code: r.code,
      host: { name: r.host.name, deckName: r.host.deckName },
      format: r.format,
      startingLife: r.startingLife,
      status: r.status,
      createdAt: r.createdAt,
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20);
}

// ─── WebSocket message handling ───────────────────────────────────────────────

type ClientMsg =
  | { type: "create"; playerName: string; deckName: string; format: string; startingLife: number; deckCards?: InputCard[] }
  | { type: "join"; roomCode: string; playerName: string; deckName: string; deckCards?: InputCard[] }
  | { type: "rejoin"; roomCode: string; playerName: string }
  | { type: "update_life"; delta: number }
  | { type: "update_poison"; delta: number }
  | { type: "commander_damage"; fromPlayer: string; delta: number }
  | { type: "draw_card" }
  | { type: "play_card"; instanceId: string; zone?: "battlefield" | "graveyard" | "exile" }
  | { type: "tap_card"; instanceId: string }
  | { type: "untap_all" }
  | { type: "discard_card"; instanceId: string }
  | { type: "move_card"; instanceId: string; from: "hand" | "battlefield" | "graveyard" | "exile"; to: "hand" | "battlefield" | "graveyard" | "exile" }
  | { type: "add_counter"; instanceId: string; counter: string; delta: number }
  | { type: "next_phase" }
  | { type: "mulligan" }
  | { type: "reset_game" }
  | { type: "ping" };

export function handleWsMessage(ws: WebSocket, raw: string) {
  let msg: ClientMsg;
  try {
    msg = JSON.parse(raw);
  } catch {
    ws.send(JSON.stringify({ type: "error", message: "Ungültige Nachricht" }));
    return;
  }

  const send = (data: object) => {
    if (ws.readyState === 1) ws.send(JSON.stringify(data));
  };

  if (msg.type === "ping") {
    send({ type: "pong" });
    return;
  }

  if (msg.type === "create") {
    const room = createRoom({
      hostName: msg.playerName,
      deckName: msg.deckName,
      format: msg.format,
      startingLife: msg.startingLife,
      deckCards: msg.deckCards,
    });
    room.hostWs = ws;
    (ws as any).__roomCode = room.code;
    (ws as any).__role = "host";
    sendToRole(room, "host");
    return;
  }

  if (msg.type === "join") {
    const room = joinRoom(msg.roomCode, {
      guestName: msg.playerName,
      deckName: msg.deckName,
      deckCards: msg.deckCards,
    });
    if (!room) {
      send({ type: "error", message: "Raum nicht gefunden oder bereits voll" });
      return;
    }
    room.guestWs = ws;
    (ws as any).__roomCode = room.code;
    (ws as any).__role = "guest";
    broadcast(room);
    return;
  }

  if (msg.type === "rejoin") {
    const room = getRoom(msg.roomCode);
    if (!room) { send({ type: "error", message: "Raum nicht mehr vorhanden" }); return; }
    const isHost = room.host.name === msg.playerName;
    const isGuest = room.guest?.name === msg.playerName;
    if (!isHost && !isGuest) { send({ type: "error", message: "Spieler nicht in diesem Raum" }); return; }
    if (isHost) room.hostWs = ws;
    if (isGuest) room.guestWs = ws;
    (ws as any).__roomCode = room.code;
    (ws as any).__role = isHost ? "host" : "guest";
    sendToRole(room, isHost ? "host" : "guest");
    return;
  }

  // All following messages require an active room
  const roomCode: string = (ws as any).__roomCode;
  const role: "host" | "guest" = (ws as any).__role;
  const room = roomCode ? rooms.get(roomCode) : null;
  if (!room) { send({ type: "error", message: "Kein aktiver Raum" }); return; }

  const player = role === "host" ? room.host : room.guest;
  if (!player) { send({ type: "error", message: "Spieler nicht initialisiert" }); return; }

  if (msg.type === "update_life") {
    player.life = Math.max(-999, player.life + msg.delta);
    const sign = msg.delta > 0 ? "+" : "";
    log(room, `${player.name}: ${sign}${msg.delta} Leben → ${player.life}`);
    broadcast(room);
    return;
  }

  if (msg.type === "update_poison") {
    player.poison = Math.max(0, player.poison + msg.delta);
    log(room, `${player.name}: ${player.poison} Giftmarken`);
    broadcast(room);
    return;
  }

  if (msg.type === "commander_damage") {
    const cur = player.commanderDamageReceived[msg.fromPlayer] ?? 0;
    const newVal = Math.max(0, cur + msg.delta);
    player.commanderDamageReceived[msg.fromPlayer] = newVal;
    if (msg.delta > 0) player.life = Math.max(-999, player.life - msg.delta);
    log(room, `${player.name}: ${msg.delta > 0 ? "+" : ""}${msg.delta} Commander-Schaden von ${msg.fromPlayer} (gesamt: ${newVal})`);
    broadcast(room);
    return;
  }

  if (msg.type === "draw_card") {
    drawCard(player, room);
    broadcast(room);
    return;
  }

  if (msg.type === "play_card") {
    const idx = player.board.hand.findIndex(c => c.instanceId === msg.instanceId);
    if (idx === -1) { send({ type: "error", message: "Karte nicht in der Hand" }); return; }
    const [card] = player.board.hand.splice(idx, 1);
    const zone = msg.zone ?? "battlefield";
    if (zone === "battlefield") {
      card.tapped = false;
      player.board.battlefield.push(card);
      log(room, `${player.name}: spielt ${card.name}`);
    } else if (zone === "graveyard") {
      player.board.graveyard.push(card);
      log(room, `${player.name}: ${card.name} → Friedhof`);
    } else {
      player.board.exile.push(card);
      log(room, `${player.name}: ${card.name} → Exil`);
    }
    broadcast(room);
    return;
  }

  if (msg.type === "tap_card") {
    const card = player.board.battlefield.find(c => c.instanceId === msg.instanceId);
    if (!card) { send({ type: "error", message: "Karte nicht auf dem Spielfeld" }); return; }
    card.tapped = !card.tapped;
    broadcast(room);
    return;
  }

  if (msg.type === "untap_all") {
    player.board.battlefield.forEach(c => { c.tapped = false; });
    log(room, `${player.name}: Alle Karten bereit gemacht`);
    broadcast(room);
    return;
  }

  if (msg.type === "discard_card") {
    const idx = player.board.hand.findIndex(c => c.instanceId === msg.instanceId);
    if (idx === -1) { send({ type: "error", message: "Karte nicht in der Hand" }); return; }
    const [card] = player.board.hand.splice(idx, 1);
    player.board.graveyard.push(card);
    log(room, `${player.name}: wirft ${card.name} ab`);
    broadcast(room);
    return;
  }

  if (msg.type === "move_card") {
    const fromZone = player.board[msg.from];
    const idx = fromZone.findIndex((c: GameCard) => c.instanceId === msg.instanceId);
    if (idx === -1) { send({ type: "error", message: "Karte nicht gefunden" }); return; }
    const [card] = fromZone.splice(idx, 1);
    card.tapped = false;
    player.board[msg.to].push(card);
    const zoneNames: Record<string, string> = { hand: "Hand", battlefield: "Spielfeld", graveyard: "Friedhof", exile: "Exil" };
    log(room, `${player.name}: ${card.name} → ${zoneNames[msg.to]}`);
    broadcast(room);
    return;
  }

  if (msg.type === "add_counter") {
    const card = [
      ...player.board.battlefield,
      ...player.board.hand,
    ].find((c: GameCard) => c.instanceId === msg.instanceId);
    if (!card) { send({ type: "error", message: "Karte nicht gefunden" }); return; }
    card.counters[msg.counter] = Math.max(0, (card.counters[msg.counter] ?? 0) + msg.delta);
    log(room, `${player.name}: ${card.name} bekommt ${msg.counter} Marker (${card.counters[msg.counter]})`);
    broadcast(room);
    return;
  }

  if (msg.type === "next_phase") {
    advancePhase(room, role);
    broadcast(room);
    return;
  }

  if (msg.type === "mulligan") {
    // Return hand to deck, shuffle, draw one fewer
    const handSize = player.board.hand.length;
    if (handSize === 0) { send({ type: "error", message: "Hand leer" }); return; }
    player.board.deck.push(...player.board.hand);
    player.board.hand = [];
    player.board.deck = shuffle(player.board.deck);
    const newSize = Math.max(1, handSize - 1);
    for (let i = 0; i < newSize; i++) drawCard(player, room);
    log(room, `${player.name}: Mull auf ${newSize} Karten`);
    broadcast(room);
    return;
  }

  if (msg.type === "reset_game") {
    const resetPlayer = (p: PlayerState) => {
      const allCards = [...p.board.deck, ...p.board.hand, ...p.board.battlefield, ...p.board.graveyard, ...p.board.exile];
      allCards.forEach(c => { c.tapped = false; c.counters = {}; });
      p.board.deck = shuffle(allCards);
      p.board.hand = [];
      p.board.battlefield = [];
      p.board.graveyard = [];
      p.board.exile = [];
      p.life = room.startingLife;
      p.poison = 0;
      p.commanderDamageReceived = {};
    };
    resetPlayer(room.host);
    if (room.guest) resetPlayer(room.guest);
    room.turn = 1;
    room.phase = "untap";
    room.activePlayer = room.host.name;
    room.gameLog = [];
    // Deal hands
    for (let i = 0; i < 7; i++) drawCard(room.host, room);
    if (room.guest) for (let i = 0; i < 7; i++) drawCard(room.guest, room);
    room.phase = "upkeep";
    log(room, "Spiel neu gestartet");
    broadcast(room);
    return;
  }
}

export function handleWsClose(ws: WebSocket) {
  const roomCode: string = (ws as any).__roomCode;
  const role: string = (ws as any).__role;
  const room = roomCode ? rooms.get(roomCode) : null;
  if (!room) return;
  if (role === "host") room.hostWs = null;
  if (role === "guest") room.guestWs = null;
}
