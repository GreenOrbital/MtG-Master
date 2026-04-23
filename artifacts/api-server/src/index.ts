import { createServer } from "http";
import { WebSocketServer } from "ws";
import app from "./app";
import { logger } from "./lib/logger";
import { handleWsMessage, handleWsClose } from "./lib/lobbyStore";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ── HTTP + WebSocket server ───────────────────────────────────────────────────

const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer, path: "/api/ws" });

wss.on("connection", (ws, req) => {
  logger.info({ url: req.url, origin: req.headers.origin }, "WebSocket client connected");
  ws.on("message", (data) => {
    handleWsMessage(ws, data.toString());
  });

  ws.on("close", () => {
    logger.info("WebSocket client disconnected");
    handleWsClose(ws);
  });

  ws.on("error", (err) => {
    logger.warn({ err }, "WebSocket error");
  });
});

wss.on("error", (err) => {
  logger.error({ err }, "WebSocketServer error");
});

// ── Start ─────────────────────────────────────────────────────────────────────

httpServer.listen(port, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening (HTTP + WebSocket)");
});
