import { Router } from "express";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const router = Router();

type ScryfallNamedResult = { name: string; object?: string };
type ScryfallSearchResult = { data: Array<{ name: string; printed_name?: string }> };

// Try Scryfall /cards/named fuzzy for a given name; returns canonical EN name or null
async function scryfallFuzzy(name: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`,
      { headers: { "User-Agent": "MtGKeywordsApp/1.0" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as ScryfallNamedResult;
    return data.name ?? null;
  } catch {
    return null;
  }
}

// Search Scryfall by printed name in any language; returns first EN match or null
async function scryfallByPrintedName(printedName: string): Promise<string | null> {
  try {
    const q = `!"${printedName}" lang:any`;
    const res = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&unique=cards&order=released`,
      { headers: { "User-Agent": "MtGKeywordsApp/1.0" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as ScryfallSearchResult;
    return data.data?.[0]?.name ?? null;
  } catch {
    return null;
  }
}

// Multi-strategy lookup: try several derivations of the raw model output
async function resolveCardName(raw: string, log: (msg: string) => void): Promise<string | null> {
  const stripped = raw.replace(/^["'`]+|["'`]+$/g, "").trim();

  // Strategy 1: exact fuzzy on the full detected name
  let found = await scryfallFuzzy(stripped);
  if (found) { log(`S1 fuzzy hit: ${found}`); return found; }

  // Strategy 2: if name contains " // ", try just the front face
  if (stripped.includes("//")) {
    const frontFace = stripped.split("//")[0].trim();
    found = await scryfallFuzzy(frontFace);
    if (found) { log(`S2 front-face fuzzy hit: ${found}`); return found; }
  }

  // Strategy 3: try by printed name (handles non-English cards)
  found = await scryfallByPrintedName(stripped);
  if (found) { log(`S3 printed-name hit: ${found}`); return found; }

  // Strategy 4: try the front face of a printed name with //
  if (stripped.includes("//")) {
    const frontFace = stripped.split("//")[0].trim();
    found = await scryfallByPrintedName(frontFace);
    if (found) { log(`S4 printed front-face hit: ${found}`); return found; }
  }

  return null;
}

router.post("/recognize-card", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64) {
    res.status(400).json({ error: "imageBase64 required" });
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: [
                "This is a Magic: The Gathering card photo.",
                "The MAIN card name is the large text at the very TOP of the card frame (in the name bar).",
                "The card may be printed in any language (German, French, Japanese, etc.) — use your MtG knowledge to identify it.",
                "IMPORTANT rules for special card types:",
                "- Adventure cards: have TWO text boxes; the TOP name bar has the creature name, the BOTTOM box has the Adventure spell name. Return ONLY the TOP creature name.",
                "- Double-faced cards (DFCs): return ONLY the front face name.",
                "- Split cards: return ONLY the left-side name (before //).",
                "- Saga cards: return the name exactly as printed in the name bar.",
                "Always return the ENGLISH canonical name as it appears on the English printing of the card.",
                "Return ONLY the card name — no explanation, no language label, no quotes, no set info.",
                'If you cannot identify the card at all, return exactly "UNKNOWN".',
              ].join(" "),
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? "UNKNOWN";
    req.log.info({ raw }, "recognize-card raw result");

    if (!raw || raw.toUpperCase() === "UNKNOWN") {
      res.json({ cardName: null });
      return;
    }

    const resolved = await resolveCardName(raw, (msg) => req.log.info(msg));
    req.log.info({ raw, resolved }, "recognize-card final");

    res.json({ cardName: resolved ?? raw.replace(/^["'`]+|["'`]+$/g, "").trim() });
  } catch (err) {
    req.log.error(err, "recognize-card failed");
    res.status(500).json({ error: "Recognition failed" });
  }
});

export default router;
