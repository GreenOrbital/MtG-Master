import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import fs from "fs";
import { clerkMiddleware } from "@clerk/express";
import router from "./routes";
import { logger } from "./lib/logger";
import { CLERK_PROXY_PATH, clerkProxyMiddleware } from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use(clerkMiddleware());

app.use("/api", router);

// ── Static frontend serving (production) ────────────────────────────────────
//
// Replit's deployment proxy routes by path only, not by host. To serve two
// different sites from the same VM (mobile app on app.mtgmaster.de, content
// website on www.mtgmaster.de) we inspect the Host header here and pick the
// correct dist directory accordingly.
if (process.env["NODE_ENV"] === "production") {
  app.set("trust proxy", true);

  const mobileDist = path.resolve(process.cwd(), "artifacts/mtg-keywords/dist");
  const webDist = path.resolve(
    process.cwd(),
    "artifacts/mtgmaster-web/dist/public",
  );

  const WEBSITE_HOSTS = new Set(["www.mtgmaster.de", "mtgmaster.de"]);
  const isWebsiteHost = (host: string | undefined): boolean =>
    !!host && WEBSITE_HOSTS.has(host.toLowerCase());

  const pickDistDir = (host: string | undefined): string | null => {
    if (isWebsiteHost(host)) {
      if (fs.existsSync(webDist)) return webDist;
      logger.warn({ host, webDist }, "Website dist missing — falling back to mobile app");
    }
    return fs.existsSync(mobileDist) ? mobileDist : null;
  };

  // Per-request static file lookup that swaps the static root by Host header.
  // dotfiles: "allow" is required because Expo's web bundle stores fonts
  // and other assets under paths like /assets/__node_modules/.pnpm/...
  // — express.static would otherwise block any path containing a dot-prefixed segment.
  app.use((req, res, next) => {
    const dir = pickDistDir(req.hostname);
    if (!dir) return next();
    return express.static(dir, { dotfiles: "allow" })(req, res, next);
  });

  // SPA fallback — also host-aware.
  app.get("/*splat", (req, res) => {
    const dir = pickDistDir(req.hostname);
    if (!dir) {
      res.status(404).send("Not found");
      return;
    }
    const indexPath = path.join(dir, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not found");
    }
  });

  logger.info({ mobileDist, webDist }, "Serving static frontends (host-routed)");
}

export default app;
