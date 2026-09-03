# kernel-dm-toolbox

A dungeon master's toolbox for a single tabletop campaign.

One container runs one campaign. There is no login and no accounts — it is meant
to sit on a machine on your home network and be opened from a laptop or tablet
in the same room. Running a second campaign means running a second container.

The first feature will be an initiative tracker. Right now the repository is a
scaffold: the architecture, the conventions, and one working vertical slice that
every future feature can be copied from.

## Requirements

- **Node.js 20.9+** (developed on 24)
- **pnpm 11+** — `corepack enable` will pick up the version pinned in
  `package.json`
- **Docker** — only for running it the way it is meant to be deployed

## Setting up a fresh clone

```bash
pnpm install
pnpm exec playwright install chromium   # for story tests and e2e
cp .env.example .env.local              # then edit CAMPAIGN_NAME
pnpm db:migrate                         # creates .data/kernel-dm-toolbox.db
pnpm dev
```

The app is on <http://localhost:3000>. `.env.local` is optional — every variable
has a working default — but you will want to set `CAMPAIGN_NAME`.

To reach the dev server from another device on your network:

```bash
pnpm dev --hostname 0.0.0.0
```

## Verifying everything works

```bash
pnpm lint
pnpm typecheck
pnpm test              # node unit tests — fast, no browser
pnpm test:storybook    # every story rendered in headless chromium
pnpm build
```

`pnpm test:e2e` additionally builds and boots the production server, so it takes
a minute.

## Running it for real

```bash
CAMPAIGN_NAME="Curse of Strahd" docker compose up -d --build
```

The campaign database lives in the `campaign-data` volume, so rebuilding or
replacing the container does not touch your data.

For a second campaign, copy the `toolbox` service in `compose.yaml`, then change
the container name, the published port and the volume name:

```yaml
toolbox-dragonheist:
  build: .
  container_name: kdt-dragonheist
  ports:
    - '3001:3000'
  environment:
    CAMPAIGN_NAME: Dragon Heist
    DATABASE_URL: file:/data/kernel-dm-toolbox.db
  volumes:
    - dragonheist-data:/data
```

### Configuration

Everything is environment variables, all documented in `.env.example` and
validated in `src/env.ts`. The ones you are likely to touch:

| Variable                     | What it does                                      |
| ---------------------------- | ------------------------------------------------- |
| `CAMPAIGN_NAME`              | Name shown in the app and the browser tab         |
| `DATABASE_URL`               | libSQL/SQLite connection string                   |
| `NEXT_PUBLIC_APP_URL`        | This instance's origin, used during server render |
| `FEATURE_INITIATIVE_TRACKER` | Feature gate — `"true"` to enable                 |

Feature gates are plain server-side environment variables. Changing one takes
effect on the next container restart.

## Storybook

```bash
pnpm storybook
```

Components are developed and reviewed in isolation. Every presentational
component has stories covering each of its states, and those stories are the
component tests — `pnpm test:storybook` runs them headlessly, with accessibility
violations failing the run.

## Making a schema change

```bash
# 1. edit src/server/db/schema.ts
pnpm db:generate     # writes a new SQL migration
pnpm db:migrate      # applies it locally
# 2. commit both the schema change and the generated SQL
```

Migrations are applied automatically when the server boots, so a fresh container
on a fresh volume needs no manual step.

## Where things live

`CLAUDE.md` is the full guide to the layout and the conventions — read it before
adding code. `DECISIONS.md` explains why the architecture is the way it is,
including the things that were deliberately left out.

```
src/app/          routes, layouts, the tRPC route handler
src/atoms/        ─┐
src/molecules/     │ presentational components, atomic design
src/organisms/     │
src/templates/    ─┘ full page bodies
src/server/trpc/  the API: routers, zod schemas, pure helpers
src/server/db/    drizzle schema, client, migrations
src/theme/        the single dark theme
e2e/              Playwright specs, one per user task
```

## The vertical slice

`health.ping` is a complete, working example of every layer, and the thing to
copy when adding a feature:

| Layer                         | File                                                              |
| ----------------------------- | ----------------------------------------------------------------- |
| Input schema                  | `src/server/trpc/schemas/health/index.ts`                         |
| Pure logic + test             | `src/server/trpc/helpers/buildPingResult/`                        |
| Router                        | `src/server/trpc/routers/health.ts`                               |
| HTTP entry point              | `src/app/api/trpc/[trpc]/route.ts`                                |
| Client hook + test            | `src/organisms/ConnectionStatus/hooks/useConnectionStatus/`       |
| Connected component           | `src/organisms/ConnectionStatus/index.tsx`                        |
| Presentational view + stories | `src/organisms/ConnectionStatus/components/ConnectionStatusView/` |
| Template                      | `src/templates/DashboardTemplate/index.tsx`                       |
| Page                          | `src/app/page.tsx`                                                |
