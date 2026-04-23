import { Router } from "express";
import { listWaitingRooms, getRoom } from "../lib/lobbyStore";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ rooms: listWaitingRooms() });
});

router.get("/:code", (req, res) => {
  const room = getRoom(req.params.code ?? "");
  if (!room) {
    res.status(404).json({ error: "Raum nicht gefunden" });
    return;
  }
  const { hostWs: _h, guestWs: _g, ...pub } = room;
  res.json({ room: pub });
});

export default router;
