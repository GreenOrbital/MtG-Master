import { Router } from "express";

const router = Router();

router.get("/card-combos", async (req, res) => {
  const name = req.query["name"];
  if (!name || typeof name !== "string") {
    res.status(400).json({ error: "name query param required" });
    return;
  }
  try {
    const q = `card:"${name}"`;
    const upstream = await fetch(
      `https://backend.commanderspellbook.com/variants/?q=${encodeURIComponent(q)}`,
      { headers: { "User-Agent": "MtGKeywordsApp/1.0" } }
    );
    if (!upstream.ok) {
      res.status(upstream.status).json({ results: [] });
      return;
    }
    const data = (await upstream.json()) as { results?: unknown[] };
    res.json({ results: Array.isArray(data.results) ? data.results.slice(0, 6) : [] });
  } catch (err) {
    res.status(500).json({ results: [] });
  }
});

export default router;
