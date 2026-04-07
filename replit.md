# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle)

## Artifacts

### Master of MtG (artifacts/mtg-keywords)
Expo mobile app (+ PWA) for Magic: The Gathering keyword lookup. Fully client-side — no AI/API server needed for core features.

**Features:**
- 60+ MtG keywords with full German/English explanations (DE-first)
- Searchable keyword list with category filters
- Language toggle (DE/EN) persisted via AsyncStorage
- Card search tab with German + English autocomplete (Scryfall API direct)
- Format legality badges (Standard, Pioneer, Modern, Legacy, Commander)
- Similar cards suggestions (horizontal scroll, Scryfall EDHREC order)
- Commander Spellbook combo lookup (called directly, no proxy)
- Favorites + recently searched cards (AsyncStorage)
- Scryfall link for prices, rulings, and editions
- Cardmarket links for buying
- Deck builder with mana/speed analysis
- Synergy groups with card images + detail modals
- **Deck Ideas** tab — 5 formats (Modern/Standard/Pioneer/Commander/Pauper), 40+ archetypes loaded locally (no network for list), card images fetched from Scryfall
- Booster packs tab
- Clerk auth for cross-device sync (uses minimal api-server for /api/user-data)
- Dark purple/arcane theme (#050510 bg, #7c3aed primary, #06b6d4 accent)

**Key files:**
- `artifacts/mtg-keywords/lib/deckArchetypes.ts` — all archetype data (12 Modern, 5 Standard, 5 Pioneer, 5 Commander, 4 Pauper)
- `artifacts/mtg-keywords/lib/deckSuggestionService.ts` — getArchetypeList() + getDeckSuggestion() with Scryfall fetch
- `artifacts/mtg-keywords/app/(tabs)/scan.tsx` — card search (main feature)
- `artifacts/mtg-keywords/app/(tabs)/deckideas.tsx` — deck ideas (local data)
- `artifacts/mtg-keywords/app/(tabs)/manapool.tsx` — deck builder
- `artifacts/mtg-keywords/context/` — Settings, DeckContext, CardHistoryContext, AccountContext

**Critical rules:**
- NEVER use opacity:0 as animation start value
- `useNativeDriver: Platform.OS !== "web"`
- Parallax box is hardcoded `{x:10, y:8, w:80, h:84}` (no API call)
- Commander Spellbook URL: `https://backend.commanderspellbook.com/variants/?q=${encodeURIComponent(`card:"${name}"`)}`

### API Server (artifacts/api-server)
Minimal Express API — kept only for Clerk-based user-data sync (`/api/user-data`).
All other routes (deck-suggestion, card-combos, card-parallax) are now client-side.

**Active routes:**
- `GET/PUT /api/user-data` — Clerk JWT auth, saves/loads decks + favorites + history to PostgreSQL
- `GET /api/health` — health check

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
