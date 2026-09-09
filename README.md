# kernel-dm-toolbox

[![CI](https://github.com/RamonGebben/kernel-dm-toolbox/actions/workflows/ci.yml/badge.svg)](https://github.com/RamonGebben/kernel-dm-toolbox/actions/workflows/ci.yml)
[![Docker image](https://img.shields.io/docker/v/ramongebben/kernel-dm-toolbox?label=docker&sort=semver)](https://hub.docker.com/r/ramongebben/kernel-dm-toolbox)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A dungeon master's toolbox for a single tabletop campaign.

One container runs one campaign. There is no login and no accounts: it is meant
to sit on a machine on your home network and be opened from a laptop or tablet
in the same room. Running a second campaign means running a second container.

Three tools are built. The **initiative tracker**: browse the SRD 5.2 creature
library, keep a reusable party roster, build an encounter, roll for initiative,
run it round by round with damage and conditions, and save the fights you will
run again. **Spells**: a searchable lookup of the SRD 5.2 spell list, filterable
by level and class. **Maps**: a pan/zoom virtual tabletop with grid calibration
and fog of war. All three put a read-only view on a second screen for the table
to watch.

## Running it for real

If you only have Docker, pull the published image: there is nothing to clone.

```bash
docker run -d \
  --name kernel-dm-toolbox \
  -p 3000:3000 \
  -v campaign-data:/data \
  -e CAMPAIGN_NAME="Curse of Strahd" \
  ramongebben/kernel-dm-toolbox:latest
```

Or with Compose, as a standalone `docker-compose.yml`:

```yaml
services:
  kernel-dm-toolbox:
    image: ramongebben/kernel-dm-toolbox:latest
    container_name: kernel-dm-toolbox
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      CAMPAIGN_NAME: Curse of Strahd
    volumes:
      - campaign-data:/data

volumes:
  campaign-data:
```

```bash
docker compose up -d
```

Or from a clone, building locally with the `compose.yaml` already in this repo:

```bash
CAMPAIGN_NAME="Curse of Strahd" docker compose up -d --build
```

Either way the container has no creature library the first time it starts, so
it imports one before serving requests. First boot takes an extra few seconds
and logs what it is doing. Set `LIBRARY_AUTO_IMPORT=false` on an instance that
must not reach GitHub at startup.

The campaign database lives in the `campaign-data` volume, so rebuilding or
replacing the container does not touch your data.

To run the published image through the repo's own Compose file instead of
building it, swap the `build: .` line in `compose.yaml` for
`image: ramongebben/kernel-dm-toolbox:latest`. Images are published from `main`
and from every `v*` tag by `.github/workflows/publish-image.yml`, for
`linux/amd64` and `linux/arm64`.

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

| Variable                     | What it does                                         |
| ---------------------------- | ---------------------------------------------------- |
| `CAMPAIGN_NAME`              | Name shown in the browser tab                        |
| `DATABASE_URL`               | libSQL/SQLite connection string                      |
| `LIBRARY_AUTO_IMPORT`        | Import the library on first boot; `"false"` opts out |
| `NEXT_PUBLIC_APP_URL`        | This instance's origin, used during server render    |
| `FEATURE_INITIATIVE_TRACKER` | Feature gate; `"true"` to enable                     |
| `MAPS_STORAGE_DIR`           | Where uploaded map images/videos are stored on disk  |
| `MAPS_MAX_UPLOAD_BYTES`      | Upload size cap, in bytes                            |

Feature gates are plain server-side environment variables. Changing one takes
effect on the next container restart.

## Attribution

Creature, condition and spell data comes from the
[System Reference Document 5.2](https://github.com/open5e/open5e-api) by
Wizards of the Coast, as published in the
[Open5e API](https://github.com/open5e/open5e-api) fixtures, and is licensed
under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

This project is not affiliated with or endorsed by Wizards of the Coast.

## Roadmap

Built and in use: the initiative tracker, spell lookup and virtual tabletop, end
to end. Dice expressions inside statblock and spell text are already clickable
and roll in place.

Next, in rough order:

1. **Dice rolling from attack rows.** The structured attack data
   (`creature_action_attacks`: to-hit, damage dice, reach) isn't wired to its
   own roll button yet; only dice mentioned in prose text is.
2. **Drag to reorder the initiative list**, for the ties and the corrections a
   number field makes awkward.
3. **An artwork/handout gallery for Maps**, the way
   [Kernels-Virtual-Table-Top](https://github.com/RamonGebben/Kernels-Virtual-Table-Top),
   the standalone app Maps was ported from, had one alongside its battle maps.
4. **A rules glossary.** Open5e's `Rule`, `RuleSet` and the small `*Description`
   files would make statblock terms explainable in place. See `DECISIONS.md`
   #24 for the survey of what else is importable and what was ruled out.

## The second screen

`/player` is a read-only view meant for a TV or tablet the table can see. What
it shows is set per session from the Maps tool's Session tab: the initiative
order, the live battle map, or both.

The initiative view shows the order, whose turn it is, and
healthy/bloodied/down, never exact monster hit points, and never a combatant
you have marked hidden. The map view shows exactly what the DM's draggable
lens frames. Both are filtered on the server, so nothing secret reaches that
browser at all.

Open it from the link on the initiative tracker page. It works no matter
which view is currently live.

## Development

Everything below is for working on the toolbox itself, not for running it.

### Requirements

- **Node.js 20.9+** (developed on 24)
- **pnpm 11+** (`corepack enable` will pick up the version pinned in
  `package.json`)
- **Docker** (only for running it the way it is meant to be deployed)

### Setting up a fresh clone

```bash
pnpm install
pnpm exec playwright install chromium   # for story tests and e2e
cp .env.example .env.local              # then edit CAMPAIGN_NAME
pnpm db:migrate                         # creates .data/kernel-dm-toolbox.db
pnpm db:import                          # pulls the SRD 5.2 library
pnpm dev
```

`pnpm db:import` is optional on a fresh database: the server imports the
library itself the first time it boots into an empty one. Run it by hand to
**refresh** an instance that already has data, which is what you want after
upgrading, since the automatic import only fires when the library is empty.

The app is on <http://localhost:3000>. `.env.local` is optional, since every
variable has a working default, but you will want to set `CAMPAIGN_NAME`.

To reach the dev server from another device on your network:

```bash
pnpm dev --hostname 0.0.0.0
```

### Verifying everything works

```bash
pnpm lint
pnpm typecheck
pnpm test              # node unit tests, fast, no browser
pnpm test:storybook    # every story rendered in headless chromium
pnpm build
```

`pnpm test:e2e` additionally builds and boots the production server, so it takes
a minute.

### Storybook

```bash
pnpm storybook
```

Components are developed and reviewed in isolation. Every presentational
component has stories covering each of its states, and those stories are the
component tests: `pnpm test:storybook` runs them headlessly, with accessibility
violations failing the run.

### Making a schema change

```bash
# 1. edit src/server/db/schema.ts
pnpm db:generate     # writes a new SQL migration
pnpm db:migrate      # applies it locally
# 2. commit both the schema change and the generated SQL
```

Migrations are applied automatically when the server boots, so a fresh container
on a fresh volume needs no manual step.

### Where things live

`CLAUDE.md` is the full guide to the layout and the conventions; read it before
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

### The vertical slice

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
