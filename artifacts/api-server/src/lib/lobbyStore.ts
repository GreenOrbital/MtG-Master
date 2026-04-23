import type { WebSocket } from "ws";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PlayerState = {
  name: string;
  deckName: string;
  life: number;
  commanderDamageReceived: Record<string, number>;
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
  activePlayer: string;
  gameLog: GameLogEntry[];
  createdAt: number;
  hostWs: WebSocket | null;
  guestWs: WebSocket | null;
};

export type PublicRoom = Omit<Room, "hostWs" | "guestWs">;

// ─── Store ───────────────────────────────────────────────────────────────────

const rooms = new Map<string, Room>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function toPublic(room: Room): PublicRoom {
  const { hostWs: _h, guestWs: _g, ...pub } = room;
  return pub;
}

function broadcast(room: Room, msg: object) {
  const data = JSON.stringify(msg);
  if (room.hostWs?.readyState === 1) room.hostWs.send(data);
  if (room.guestWs?.readyState === 1) room.guestWs.send(data);
}

function log(room: Room, msg: string) {
  room.gameLog.push({ time: Date.now(), msg });
  if (room.gameLog.length > 50) room.gameLog.shift();
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function createRoom(opts: {
  hostName: string;
  deckName: string;
  format: string;
  startingLife: number;
}): Room {
  let code = generateCode();
  while (rooms.has(code)) code = generateCode();

  const host: PlayerState = {
    name: opts.hostName,
    deckName: opts.deckName,
    life: opts.startingLife,
    commanderDamageReceived: {},
  };

  const room: Room = {
    code,
    host,
    guest: null,
    format: opts.format,
    startingLife: opts.startingLife,
    status: "waiting",
    turn: 1,
    activePlayer: opts.hostName,
    gameLog: [{ time: Date.now(), msg: `Raum erstellt von ${opts.hostName} (${opts.deckName})` }],
    createdAt: Date.now(),
    hostWs: null,
    guestWs: null,
  };

  rooms.set(code, room);

  // Auto-cleanup after 2 hours
  setTimeout(() => rooms.delete(code), 2 * 60 * 60 * 1000);

  return room;
}

export function joinRoom(code: string, opts: { guestName: string; deckName: string }): Room | null {
  const room = rooms.get(code.toUpperCase());
  if (!room || room.guest || room.status !== "waiting") return null;

  room.guest = {
    name: opts.guestName,
    deckName: opts.deckName,
    life: room.startingLife,
    commanderDamageReceived: {},
  };
  room.status = "playing";
  log(room, `${opts.guestName} (${opts.deckName}) ist beigetreten`);

  return room;
}

export function getRoom(code: string): Room | null {
  return rooms.get(code.toUpperCase()) ?? null;
}

export function listWaitingRooms(): PublicRoom[] {
  return Array.from(rooms.values())
    .filter((r) => r.status === "waiting" && Date.now() - r.createdAt < 30 * 60 * 1000)
    .map(toPublic)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 20);
}

// ─── WebSocket message handling ───────────────────────────────────────────────

type ClientMsg =
  | { type: "create"; playerName: string; deckName: string; format: string; startingLife: number }
  | { type: "join"; roomCode: string; playerName: string; deckName: string }
  | { type: "rejoin"; roomCode: string; playerName: string }
  | { type: "update_life"; delta: number }
  | { type: "commander_damage"; fromPlayer: string; delta: number }
  | { type: "next_turn" }
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
    });
    room.hostWs = ws;
    (ws as any).__roomCode = room.code;
    (ws as any).__role = "host";
    send({ type: "room_state", room: toPublic(room) });
    return;
  }

  if (msg.type === "join") {
    const room = joinRoom(msg.roomCode, { guestName: msg.playerName, deckName: msg.deckName });
    if (!room) {
      send({ type: "error", message: "Raum nicht gefunden oder bereits voll" });
      return;
    }
    room.guestWs = ws;
    (ws as any).__roomCode = room.code;
    (ws as any).__role = "guest";
    broadcast(room, { type: "room_state", room: toPublic(room) });
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
    send({ type: "room_state", room: toPublic(room) });
    return;
  }

  // All following messages require an active room
  const roomCode: string = (ws as any).__roomCode;
  const role: string = (ws as any).__role;
  const room = roomCode ? rooms.get(roomCode) : null;
  if (!room) { send({ type: "error", message: "Kein aktiver Raum" }); return; }

  const player = role === "host" ? room.host : room.guest;
  if (!player) { send({ type: "error", message: "Spieler nicht initialisiert" }); return; }

  if (msg.type === "update_life") {
    player.life = Math.max(0, player.life + msg.delta);
    const sign = msg.delta > 0 ? "+" : "";
    log(room, `${player.name}: ${sign}${msg.delta} Leben → ${player.life}`);
    broadcast(room, { type: "room_state", room: toPublic(room) });
    return;
  }

  if (msg.type === "commander_damage") {
    const current = player.commanderDamageReceived[msg.fromPlayer] ?? 0;
    const newVal = Math.max(0, current + msg.delta);
    player.commanderDamageReceived[msg.fromPlayer] = newVal;
    player.life = Math.max(0, player.life - msg.delta);
    log(room, `${player.name} erhält ${msg.delta} Commander-Schaden von ${msg.fromPlayer} (gesamt: ${newVal})`);
    broadcast(room, { type: "room_state", room: toPublic(room) });
    return;
  }

  if (msg.type === "next_turn") {
    room.turn += 1;
    room.activePlayer = room.activePlayer === room.host.name
      ? (room.guest?.name ?? room.host.name)
      : room.host.name;
    log(room, `Runde ${room.turn} — ${room.activePlayer} ist am Zug`);
    broadcast(room, { type: "room_state", room: toPublic(room) });
    return;
  }

  if (msg.type === "reset_game") {
    room.host.life = room.startingLife;
    room.host.commanderDamageReceived = {};
    if (room.guest) {
      room.guest.life = room.startingLife;
      room.guest.commanderDamageReceived = {};
    }
    room.turn = 1;
    room.activePlayer = room.host.name;
    room.status = "playing";
    room.gameLog = [];
    log(room, "Spiel neu gestartet");
    broadcast(room, { type: "room_state", room: toPublic(room) });
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
