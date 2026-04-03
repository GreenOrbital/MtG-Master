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
- Searchable keyword list with category filters
- Language toggle (DE/EN) for all keyword names and explanations
- Card scanner tab using expo-image-picker to photograph cards and detect keywords
- Settings screen with stats and data source info
- Dark theme with purple/arcane MtG-inspired color palette
- AsyncStorage for persisting language preference

**Key files:**
- `artifacts/mtg-keywords/data/keywords.ts` — full keyword dataset
- `artifacts/mtg-keywords/app/(tabs)/index.tsx` — main keyword browser
- `artifacts/mtg-keywords/app/(tabs)/scan.tsx` — card scanner
- `artifacts/mtg-keywords/app/(tabs)/settings.tsx` — settings
- `artifacts/mtg-keywords/context/SettingsContext.tsx` — language preference context
- `artifacts/mtg-keywords/constants/colors.ts` — dark purple theme tokens

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
