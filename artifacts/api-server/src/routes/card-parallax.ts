import { Router } from "express";
import OpenAI from "openai";
import { db, cardParallaxCacheTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const router = Router();

async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const res = await fetch(url, { headers: { "User-Agent": "MtGKeywordsApp/1.0" } });
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const mimeType = contentType.split(";")[0].trim();
  return { base64, mimeType };
}

router.get("/card-parallax", async (req, res) => {
  const { cardId, artUrl } = req.query as { cardId?: string; artUrl?: string };

  if (!cardId || !artUrl) {
    res.status(400).json({ error: "cardId and artUrl are required" });
    return;
  }

  try {
    // Check cache first
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

    // Fetch art_crop image and convert to base64
    const { base64, mimeType } = await fetchImageAsBase64(artUrl);

    // Ask GPT-4o to identify the main animated subject
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
            },
            {
              type: "text",
              text: [
                "This is a Magic: The Gathering card artwork image.",
                "Identify the SINGLE most visually interesting element for a looping cinemagraph — where only that element appears to move while everything else is frozen.",
                "",
                "Priority:",
                "1. Main foreground figure/creature (character, creature, person, animal)",
                "2. Key background element (tower, waterfall, flame, smoke, clouds, structure)",
                "",
                "Return ONLY valid JSON, no explanation:",
                '{"x":<left edge % 0-100>,"y":<top edge % 0-100>,"w":<width % 5-90>,"h":<height % 5-90>,"type":"foreground|background","description":"<short label>"}',
                "",
                "The bounding box must tightly surround the subject. Percentages are of the image dimensions.",
              ].join("\n"),
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";

    // Parse JSON — handle possible markdown fences
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      res.status(500).json({ error: "Could not parse GPT-4o response", raw });
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      x: number; y: number; w: number; h: number;
      type: string; description: string;
    };

    // Clamp values
    const x = Math.max(0, Math.min(90, parsed.x));
    const y = Math.max(0, Math.min(90, parsed.y));
    const w = Math.max(5, Math.min(90, parsed.w));
    const h = Math.max(5, Math.min(90, parsed.h));
    const subjectType = parsed.type ?? "foreground";
    const description = parsed.description ?? "";

    // Store in cache
    await db.insert(cardParallaxCacheTable).values({
      cardId,
      x, y, w, h,
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
