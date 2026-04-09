import { eq } from "drizzle-orm";
import { Router } from "express";
import {
  db,
  insertPartnerShopSchema,
  partnerShopsTable,
  type PartnerShop,
} from "@workspace/db";

const router = Router();

// ── Admin auth middleware ────────────────────────────────────────────────────
function requireAdmin(req: any, res: any, next: any) {
  const token = process.env["SESSION_SECRET"];
  const authHeader = req.headers["authorization"] ?? "";
  const queryToken = req.query?.token as string | undefined;
  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : queryToken ?? "";
  if (!token || provided !== token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// ── POST /api/partner/register ───────────────────────────────────────────────
router.post("/partner/register", async (req, res) => {
  try {
    const parsed = insertPartnerShopSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Ungültige Eingabe", details: parsed.error.flatten() });
    }

    const existing = await db
      .select({ id: partnerShopsTable.id })
      .from(partnerShopsTable)
      .where(eq(partnerShopsTable.email, parsed.data.email));

    if (existing.length > 0) {
      return res.status(409).json({ error: "Diese E-Mail ist bereits registriert." });
    }

    await db.insert(partnerShopsTable).values({
      ...parsed.data,
      status: "pending",
    });

    return res.status(201).json({ success: true, message: "Registrierung erfolgreich. GreenOrbital wird sich in Kürze bei dir melden." });
  } catch (err) {
    console.error("partner/register error:", err);
    return res.status(500).json({ error: "Serverfehler" });
  }
});

// ── GET /api/partner/shops (public – approved only) ──────────────────────────
router.get("/partner/shops", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: partnerShopsTable.id,
        shopName: partnerShopsTable.shopName,
        city: partnerShopsTable.city,
        country: partnerShopsTable.country,
        continent: partnerShopsTable.continent,
        website: partnerShopsTable.website,
        phone: partnerShopsTable.phone,
        description: partnerShopsTable.description,
        approvedAt: partnerShopsTable.approvedAt,
      })
      .from(partnerShopsTable)
      .where(eq(partnerShopsTable.status, "approved"));

    const grouped: Record<string, Record<string, typeof rows>> = {};
    for (const shop of rows) {
      if (!grouped[shop.continent]) grouped[shop.continent] = {};
      if (!grouped[shop.continent][shop.country]) grouped[shop.continent][shop.country] = [];
      grouped[shop.continent][shop.country].push(shop);
    }

    return res.json({ shops: grouped, total: rows.length });
  } catch (err) {
    console.error("partner/shops error:", err);
    return res.status(500).json({ error: "Serverfehler" });
  }
});

// ── GET /api/partner/admin (admin HTML dashboard) ────────────────────────────
router.get("/partner/admin", requireAdmin, async (_req, res) => {
  try {
    const all = await db
      .select()
      .from(partnerShopsTable)
      .orderBy(partnerShopsTable.createdAt);

    const token = process.env["SESSION_SECRET"] ?? "";
    const statusBadge = (s: string) => {
      const colors: Record<string, string> = {
        pending: "#f59e0b",
        contract_sent: "#3b82f6",
        approved: "#22c55e",
        rejected: "#ef4444",
      };
      return `<span style="background:${colors[s] ?? "#888"};color:#fff;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:bold;">${s}</span>`;
    };

    const rows = all.map((s: PartnerShop) => `
      <tr style="border-bottom:1px solid #333;">
        <td style="padding:8px 12px;">${new Date(s.createdAt).toLocaleDateString("de-DE")}</td>
        <td style="padding:8px 12px;font-weight:bold;">${s.shopName}</td>
        <td style="padding:8px 12px;">${s.ownerName}</td>
        <td style="padding:8px 12px;"><a href="mailto:${s.email}" style="color:#7c3aed;">${s.email}</a></td>
        <td style="padding:8px 12px;">${s.city}, ${s.country}</td>
        <td style="padding:8px 12px;">${s.continent}</td>
        <td style="padding:8px 12px;">${s.phone ?? "–"}</td>
        <td style="padding:8px 12px;">${s.website ? `<a href="${s.website}" target="_blank" style="color:#06b6d4;">${s.website}</a>` : "–"}</td>
        <td style="padding:8px 12px;">${statusBadge(s.status)}</td>
        <td style="padding:8px 12px;white-space:nowrap;">
          ${s.status === "pending" ? `<button onclick="update(${s.id},'contract_sent')" style="${btnStyle("#3b82f6")}">Vertrag senden</button>` : ""}
          ${s.status !== "approved" && s.status !== "rejected" ? `<button onclick="update(${s.id},'approved')" style="${btnStyle("#22c55e")}">Freischalten</button>` : ""}
          ${s.status === "approved" ? `<button onclick="update(${s.id},'rejected')" style="${btnStyle("#ef4444")}">Sperren</button>` : ""}
          ${s.status === "rejected" ? `<button onclick="update(${s.id},'approved')" style="${btnStyle("#22c55e")}">Reaktivieren</button>` : ""}
        </td>
        <td style="padding:8px 12px;max-width:200px;font-size:12px;color:#aaa;">${s.adminNotes ?? ""}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Partner Admin – Master of MtG</title>
  <style>
    body { font-family: system-ui, sans-serif; background:#0a0a14; color:#e2e8f0; margin:0; padding:20px; }
    h1 { color:#7c3aed; margin-bottom:4px; }
    .subtitle { color:#94a3b8; margin-bottom:24px; font-size:14px; }
    table { border-collapse:collapse; width:100%; font-size:13px; background:#111122; border-radius:12px; overflow:hidden; }
    th { background:#1e1b4b; color:#a78bfa; padding:10px 12px; text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
    tr:hover td { background:#1a1a2e; }
    .stats { display:flex; gap:16px; margin-bottom:20px; flex-wrap:wrap; }
    .stat { background:#1e1b4b; border-radius:10px; padding:14px 20px; min-width:120px; }
    .stat-n { font-size:28px; font-weight:bold; color:#7c3aed; }
    .stat-l { font-size:12px; color:#94a3b8; }
    .toast { position:fixed; top:20px; right:20px; background:#22c55e; color:#fff; padding:10px 20px; border-radius:8px; font-size:14px; display:none; z-index:999; }
  </style>
</head>
<body>
  <h1>⚙️ Partner-Admin</h1>
  <p class="subtitle">Master of MtG · GreenOrbital · info@greenorbital.de</p>
  <div class="stats">
    <div class="stat"><div class="stat-n">${all.length}</div><div class="stat-l">Gesamt</div></div>
    <div class="stat"><div class="stat-n" style="color:#f59e0b;">${all.filter((s:PartnerShop)=>s.status==="pending").length}</div><div class="stat-l">Ausstehend</div></div>
    <div class="stat"><div class="stat-n" style="color:#3b82f6;">${all.filter((s:PartnerShop)=>s.status==="contract_sent").length}</div><div class="stat-l">Vertrag gesendet</div></div>
    <div class="stat"><div class="stat-n" style="color:#22c55e;">${all.filter((s:PartnerShop)=>s.status==="approved").length}</div><div class="stat-l">Freigeschaltet</div></div>
  </div>
  <div id="toast" class="toast"></div>
  <div style="overflow-x:auto;">
    <table>
      <thead><tr>
        <th>Datum</th><th>Shopname</th><th>Inhaber</th><th>E-Mail</th>
        <th>Stadt/Land</th><th>Kontinent</th><th>Telefon</th><th>Website</th>
        <th>Status</th><th>Aktionen</th><th>Notizen</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  <script>
    const TOKEN = ${JSON.stringify(token)};
    async function update(id, status) {
      const notes = status === "contract_sent" ? prompt("Notiz hinzufügen (optional):") : null;
      const r = await fetch("/api/partner/admin/" + id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer " + TOKEN },
        body: JSON.stringify({ status, adminNotes: notes ?? undefined })
      });
      const toast = document.getElementById("toast");
      if (r.ok) {
        toast.textContent = "Status aktualisiert!";
        toast.style.display = "block";
        setTimeout(() => { toast.style.display = "none"; location.reload(); }, 1500);
      } else {
        const d = await r.json();
        alert("Fehler: " + d.error);
      }
    }
  </script>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    console.error("partner/admin error:", err);
    return res.status(500).send("Server error");
  }
});

// ── PATCH /api/partner/admin/:id ─────────────────────────────────────────────
router.patch("/partner/admin/:id", requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "Ungültige ID" });

    const { status, adminNotes } = req.body as { status?: string; adminNotes?: string };
    const allowedStatuses = ["pending", "contract_sent", "approved", "rejected"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Ungültiger Status" });
    }

    const updates: Partial<typeof partnerShopsTable.$inferInsert> = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (status === "approved") updates.approvedAt = new Date();

    await db.update(partnerShopsTable).set(updates).where(eq(partnerShopsTable.id, id));
    return res.json({ success: true });
  } catch (err) {
    console.error("partner/admin PATCH error:", err);
    return res.status(500).json({ error: "Serverfehler" });
  }
});

function btnStyle(color: string) {
  return `background:${color};color:#fff;border:none;padding:4px 10px;border-radius:6px;cursor:pointer;font-size:12px;margin-right:4px;`;
}

export default router;
