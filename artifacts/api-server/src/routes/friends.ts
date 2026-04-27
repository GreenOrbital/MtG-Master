import { getAuth, clerkClient } from "@clerk/express";
import { and, eq, or, inArray } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import {
  db,
  friendshipsTable,
  userCloudDataTable,
  sendFriendRequestSchema,
  respondFriendRequestSchema,
} from "@workspace/db";

const router: IRouter = Router();

interface AuthedRequest extends Request {
  userId?: string;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Nicht angemeldet" });
    return;
  }
  req.userId = userId;
  next();
}

function displayNameFor(u: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  emailAddresses?: { emailAddress: string }[];
}): string {
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  if (u.username) return u.username;
  if (u.emailAddresses?.[0]?.emailAddress) return u.emailAddresses[0].emailAddress;
  return "Spieler";
}

// ─── GET /friends ─────────────────────────────────────────────────────────
// Returns: { friends: [{userId, displayName, friendshipId}],
//            incoming: [{requestId, fromUserId, fromDisplayName, createdAt}],
//            outgoing: [{requestId, toUserId, toDisplayName, createdAt}] }
router.get("/friends", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const me = req.userId!;
    const rows = await db
      .select()
      .from(friendshipsTable)
      .where(or(eq(friendshipsTable.requesterUserId, me), eq(friendshipsTable.recipientUserId, me)));

    const friends: { userId: string; displayName: string; friendshipId: number }[] = [];
    const incoming: { requestId: number; fromUserId: string; fromDisplayName: string; createdAt: Date }[] = [];
    const outgoing: { requestId: number; toUserId: string; toDisplayName: string; createdAt: Date }[] = [];

    for (const r of rows) {
      const iAmRequester = r.requesterUserId === me;
      const otherId = iAmRequester ? r.recipientUserId : r.requesterUserId;
      const otherName = iAmRequester
        ? (r.recipientDisplayName ?? "Spieler")
        : (r.requesterDisplayName ?? "Spieler");

      if (r.status === "accepted") {
        friends.push({ userId: otherId, displayName: otherName, friendshipId: r.id });
      } else if (r.status === "pending") {
        if (iAmRequester) {
          outgoing.push({ requestId: r.id, toUserId: otherId, toDisplayName: otherName, createdAt: r.createdAt });
        } else {
          incoming.push({ requestId: r.id, fromUserId: otherId, fromDisplayName: otherName, createdAt: r.createdAt });
        }
      }
    }
    res.json({ friends, incoming, outgoing });
  } catch (err) {
    console.error("GET /friends error:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

// ─── POST /friends/request ────────────────────────────────────────────────
router.post("/friends/request", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const parsed = sendFriendRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Ungültige Anfrage" });
      return;
    }
    const me = req.userId!;
    const ident = parsed.data.identifier.trim();
    const isEmail = ident.includes("@");

    // Look up the user via Clerk Backend API.
    const found = await clerkClient.users.getUserList(
      isEmail ? { emailAddress: [ident] } : { username: [ident] },
    );
    const list = found?.data ?? [];
    const target = list[0];
    if (!target) {
      res.status(404).json({ error: "Spieler nicht gefunden" });
      return;
    }
    if (target.id === me) {
      res.status(400).json({ error: "Du kannst dir nicht selbst eine Anfrage schicken" });
      return;
    }

    // Resolve my display name too (needed so target sees something nice).
    const meUser = await clerkClient.users.getUser(me).catch(() => null);
    const myName = meUser ? displayNameFor(meUser) : "Spieler";
    const targetName = displayNameFor(target);

    // Reject if they're already in any relationship (either direction).
    const existing = await db
      .select()
      .from(friendshipsTable)
      .where(
        or(
          and(eq(friendshipsTable.requesterUserId, me), eq(friendshipsTable.recipientUserId, target.id)),
          and(eq(friendshipsTable.requesterUserId, target.id), eq(friendshipsTable.recipientUserId, me)),
        ),
      );

    if (existing.length > 0) {
      const row = existing[0];
      if (row.status === "accepted") {
        res.status(409).json({ error: "Ihr seid schon befreundet" });
        return;
      }
      // Convert the other side's pending request into an instant accept.
      if (row.requesterUserId === target.id && row.status === "pending") {
        await db
          .update(friendshipsTable)
          .set({ status: "accepted", respondedAt: new Date() })
          .where(eq(friendshipsTable.id, row.id));
        res.json({ ok: true, accepted: true });
        return;
      }
      res.status(409).json({ error: "Anfrage läuft bereits" });
      return;
    }

    await db.insert(friendshipsTable).values({
      requesterUserId: me,
      recipientUserId: target.id,
      requesterDisplayName: myName,
      recipientDisplayName: targetName,
      status: "pending",
    });
    res.json({ ok: true, sentTo: targetName });
  } catch (err) {
    console.error("POST /friends/request error:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

// ─── POST /friends/respond ────────────────────────────────────────────────
router.post("/friends/respond", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const parsed = respondFriendRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Ungültige Anfrage" });
      return;
    }
    const me = req.userId!;
    const { requestId, accept } = parsed.data;

    const rows = await db
      .select()
      .from(friendshipsTable)
      .where(eq(friendshipsTable.id, requestId));
    const row = rows[0];
    if (!row || row.recipientUserId !== me || row.status !== "pending") {
      res.status(404).json({ error: "Anfrage nicht gefunden" });
      return;
    }

    if (accept) {
      await db
        .update(friendshipsTable)
        .set({ status: "accepted", respondedAt: new Date() })
        .where(eq(friendshipsTable.id, requestId));
    } else {
      await db.delete(friendshipsTable).where(eq(friendshipsTable.id, requestId));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /friends/respond error:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

// ─── DELETE /friends/:friendUserId ────────────────────────────────────────
router.delete("/friends/:friendUserId", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const me = req.userId!;
    // Express types `req.params[x]` as `string | string[]`; we always have
    // a single value here, but narrow explicitly so drizzle is happy.
    const other = String(req.params.friendUserId);
    await db.delete(friendshipsTable).where(
      or(
        and(eq(friendshipsTable.requesterUserId, me), eq(friendshipsTable.recipientUserId, other)),
        and(eq(friendshipsTable.requesterUserId, other), eq(friendshipsTable.recipientUserId, me)),
      ),
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("DELETE /friends error:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

// ─── GET /friends/:friendUserId/decks ─────────────────────────────────────
// Returns the friend's *shared* decks (deck.shared === true).
router.get("/friends/:friendUserId/decks", requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const me = req.userId!;
    const other = String(req.params.friendUserId);

    // Confirm friendship.
    const fr = await db
      .select()
      .from(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.status, "accepted"),
          or(
            and(eq(friendshipsTable.requesterUserId, me), eq(friendshipsTable.recipientUserId, other)),
            and(eq(friendshipsTable.requesterUserId, other), eq(friendshipsTable.recipientUserId, me)),
          ),
        ),
      );
    if (fr.length === 0) {
      res.status(403).json({ error: "Keine Freundschaft" });
      return;
    }

    const rows = await db
      .select()
      .from(userCloudDataTable)
      .where(eq(userCloudDataTable.userId, other));
    const decks = (rows[0]?.decks ?? []) as Array<{ shared?: boolean; [k: string]: unknown }>;
    const sharedDecks = decks.filter((d) => d?.shared === true);
    res.json({ decks: sharedDecks });
  } catch (err) {
    console.error("GET /friends/:id/decks error:", err);
    res.status(500).json({ error: "Serverfehler" });
  }
});

export default router;

// Suppress unused import warning if `inArray` not used (kept for future filter expansion).
void inArray;
