import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { db, userCloudDataTable, cloudDataSchema } from "@workspace/db";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Nicht angemeldet" });
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
