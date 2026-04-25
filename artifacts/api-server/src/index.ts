import { createServer } from "http";
import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ── HTTP server ───────────────────────────────────────────────────────────────
//
// Live-multiplayer (WebSocket) was removed when the play screen switched from
// a real playmat to the deck-vs-deck simulator. If you ever need it back, see
// git history for the previous WebSocketServer wiring and lobbyStore module.

const httpServer = createServer(app);

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening (HTTP)");
});
