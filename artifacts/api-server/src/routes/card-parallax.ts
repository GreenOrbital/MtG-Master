import { Router } from "express";
import { db, cardParallaxCacheTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/card-parallax", async (req, res) => {
  const { cardId, artUrl } = req.query as { cardId?: string; artUrl?: string };

  if (!cardId || !artUrl) {
    res.status(400).json({ error: "cardId and artUrl are required" });
    return;
  }

  try {
    // Return cached result if available (from previous detections)
    const cached = await db
      .select()
      .from(cardParallaxCacheTable)
      .where(eq(cardParallaxCacheTable.cardId, cardId))
      .limit(1);

    if (cached.length > 0) {
      const row = cached[0];
      res.json({ x: row.x, y: row.y, w: row.w, h: row.h, type: row.subjectType, description: row.description, cached: true });
      return;
    }

    // Default: center-weighted bounding box — good generic parallax for most cards
    const x = 10, y = 8, w = 80, h = 84;
    const subjectType = "foreground";
    const description = "card subject";

    // Cache the default so it's consistent on repeated requests
    await db.insert(cardParallaxCacheTable).values({
      cardId, x, y, w, h,
      subjectType,
      description,
    }).onConflictDoNothing();

    res.json({ x, y, w, h, type: subjectType, description, cached: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

export default router;
