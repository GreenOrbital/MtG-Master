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

// Diagnose Clerk env so we can confirm the deployed server has the right
// keys for the live Clerk instance (clerk.mtgmaster.de).
{
  const pk = process.env["CLERK_PUBLISHABLE_KEY"] ?? "";
  const sk = process.env["CLERK_SECRET_KEY"] ?? "";
  logger.info(
    {
      hasPublishable: !!pk,
      publishableKind: pk.startsWith("pk_live_")
        ? "live"
        : pk.startsWith("pk_test_")
          ? "test"
          : pk
            ? "other"
            : "missing",
      publishablePrefix: pk.slice(0, 12),
      hasSecret: !!sk,
      secretKind: sk.startsWith("sk_live_")
        ? "live"
        : sk.startsWith("sk_test_")
          ? "test"
          : sk
            ? "other"
            : "missing",
      secretPrefix: sk.slice(0, 12),
    },
    "Clerk env at boot",
  );
}

app.use(clerkMiddleware());

app.use("/api", router);

// ── Static frontend serving (production) ────────────────────────────────────
//
// All hosts (app.mtgmaster.de, www.mtgmaster.de, mt-g-master.replit.app, …)
// serve the mobile PWA bundle. The marketing website is currently disabled.
if (process.env["NODE_ENV"] === "production") {
  app.set("trust proxy", true);

  const mobileDist = path.resolve(process.cwd(), "artifacts/mtg-keywords/dist");

  const pickDistDir = (): string | null =>
    fs.existsSync(mobileDist) ? mobileDist : null;

  // dotfiles: "allow" is required because Expo's web bundle stores fonts
  // and other assets under paths like /assets/__node_modules/.pnpm/...
  // — express.static would otherwise block any path containing a dot-prefixed segment.
  app.use((req, res, next) => {
    const dir = pickDistDir();
    if (!dir) return next();
    return express.static(dir, { dotfiles: "allow" })(req, res, next);
  });

  app.get("/*splat", (_req, res) => {
    const dir = pickDistDir();
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

  logger.info({ mobileDist }, "Serving mobile PWA on all hosts");
}

export default app;
