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
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### MtG Schlüsselwörter (artifacts/mtg-keywords)
Expo mobile app for Magic: The Gathering keyword lookup.

**Features:**
- 60+ MtG keywords with full German and English explanations
- Searchable keyword list with category filters (Fähigkeiten, Aktionen, Fähigkeitswörter)
- Language toggle (DE/EN) persisted via AsyncStorage
- Card search tab with German + English autocomplete (Scryfall API)
- Format legality badges (Standard, Pioneer, Modern, Legacy, Commander)
- AI-generated Spieltipp (when to play) via GPT on API server
- Similar cards suggestions (horizontal scroll, Scryfall EDHREC order)
- Favorites (star button, persisted in AsyncStorage)
- Recently searched cards (last 10, persisted in AsyncStorage)
- Direct Scryfall link for prices, rulings, and all editions
- Settings screen with language toggle and DB stats
- Dark purple/arcane theme

**Key files:**
- `artifacts/mtg-keywords/data/keywords.ts` — full keyword dataset
- `artifacts/mtg-keywords/app/(tabs)/index.tsx` — keyword browser
- `artifacts/mtg-keywords/app/(tabs)/scan.tsx` — card search (main feature screen)
- `artifacts/mtg-keywords/app/(tabs)/settings.tsx` — settings
- `artifacts/mtg-keywords/context/SettingsContext.tsx` — language preference
- `artifacts/mtg-keywords/context/CardHistoryContext.tsx` — favorites + recent cards
- `artifacts/mtg-keywords/constants/colors.ts` — dark purple theme tokens

### API Server (artifacts/api-server)
Express API powering AI features.

**Routes:**
- `POST /api/card-tips` — GPT-generated German play tip for a card
- `POST /api/scan-card` — (legacy) GPT vision card name detection
- `GET /api/health` — health check

**Config:** 20MB body limit for base64 images, OpenAI via Replit AI Integrations proxy

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
