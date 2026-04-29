import { getAuth, verifyToken } from "@clerk/express";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { db, userCloudDataTable, cloudDataSchema } from "@workspace/db";

const router = Router();

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const padded = payload.padEnd(payload.length + ((4 - (payload.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  let userId = auth?.userId;

  // Fallback: if clerkMiddleware didn't pick up the token (common when no
  // CLERK_SECRET_KEY at boot or proxy weirdness), try verifying the Bearer
  // token explicitly. This also surfaces the real reason a token fails.
  if (!userId) {
    const authHeader = req.headers["authorization"] as string | undefined;
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (bearer) {
      try {
        const payload = await verifyToken(bearer, {
          secretKey: process.env["CLERK_SECRET_KEY"] ?? "",
        });
        if (payload?.sub) {
          req.log?.info({ sub: payload.sub }, "user-data: verified via fallback verifyToken");
          userId = payload.sub;
        }
      } catch (err) {
        const claims = decodeJwtPayload(bearer);
        req.log?.warn({
          claimsIss: claims?.["iss"],
          claimsAzp: claims?.["azp"],
          claimsSub: claims?.["sub"],
          claimsExp: claims?.["exp"],
          nowSec: Math.floor(Date.now() / 1000),
          verifyErrorName: (err as any)?.name,
          verifyErrorMessage: (err as any)?.message,
          verifyErrorCode: (err as any)?.code,
          verifyErrorReason: (err as any)?.reason,
        }, "user-data: explicit verifyToken failed");
      }
    }
  }

  if (!userId) {
    return res.status(401).json({ error: "Nicht angemeldet" });
  }
  req.userId = userId;
  next();
}

router.get("/user-data", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(userCloudDataTable)
      .where(eq(userCloudDataTable.userId, req.userId));

    if (rows.length === 0) {
      return res.json({ decks: [], favorites: [], cardHistory: [] });
    }

    const row = rows[0];
    return res.json({
      decks: row.decks ?? [],
      favorites: row.favorites ?? [],
      cardHistory: row.cardHistory ?? [],
      updatedAt: row.updatedAt,
    });
  } catch (err) {
    console.error("GET /user-data error:", err);
    return res.status(500).json({ error: "Serverfehler" });
  }
});

router.put("/user-data", requireAuth, async (req: any, res) => {
  try {
    const parsed = cloudDataSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Ungültige Daten" });
    }

    const { decks, favorites, cardHistory } = parsed.data;

    await db
      .insert(userCloudDataTable)
      .values({
        userId: req.userId,
        decks,
        favorites,
        cardHistory,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userCloudDataTable.userId,
        set: {
          decks,
          favorites,
          cardHistory,
          updatedAt: new Date(),
        },
      });

    return res.json({ ok: true });
  } catch (err) {
    console.error("PUT /user-data error:", err);
    return res.status(500).json({ error: "Serverfehler" });
  }
});

export default router;
