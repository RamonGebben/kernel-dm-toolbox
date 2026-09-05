@AGENTS.md

# kernel-dm-toolbox

A dungeon master's toolbox for **one campaign**. One Docker container is run per
campaign; there is no login, no accounts and no multi-tenancy, and the app is
reached over a trusted local network. The initiative tracker is built; a
vertical icon rail down the left edge is where the next tools hang off.

The _why_ behind the choices below lives in `DECISIONS.md`. This file is the
_how_.

## Next.js

This project is on **Next.js 16 with the App Router and Turbopack**. Model
training data on Next.js is stale — read the version-matched docs bundled at
`node_modules/next/dist/docs/` before writing App Router, caching or config
code. The most relevant pages:

| Topic                         | Path under `node_modules/next/dist/docs/`                      |
| ----------------------------- | -------------------------------------------------------------- |
| Docs index                    | `index.md`                                                     |
| Project structure             | `01-app/01-getting-started/02-project-structure.md`            |
| Server & Client Components    | `01-app/01-getting-started/05-server-and-client-components.md` |
| Fetching data                 | `01-app/01-getting-started/06-fetching-data.md`                |
| Caching                       | `01-app/01-getting-started/08-caching.md`                      |
| Route handlers                | `01-app/01-getting-started/15-route-handlers.md`               |
| styled-components / CSS-in-JS | `01-app/02-guides/css-in-js.md`                                |
| Self-hosting & Docker         | `01-app/02-guides/self-hosting.md`                             |
| Instrumentation (`register`)  | `01-app/02-guides/instrumentation.md`                          |
| Breaking changes in 16        | `01-app/02-guides/upgrading/version-16.md`                     |
| `next.config` options         | `01-app/03-api-reference/05-config/01-next-config-js/`         |

Things that differ from older Next.js and bite immediately:

- Turbopack is the default for `dev` **and** `build`; no `--turbopack` flag.
- `next lint` is gone — `pnpm lint` runs the ESLint CLI, and `next build` does
  not lint.
- `cookies()`, `headers()`, `params` and `searchParams` are **async**. Await them.
- `middleware.ts` is now `proxy.ts` with an exported `proxy` function.
- `revalidateTag` takes a `cacheLife` profile as a second argument.
- `next dev` writes to `.next/dev`, so dev and build can run concurrently.

## Commands

```bash
pnpm dev              # dev server
pnpm build            # production build (standalone output)
pnpm start            # run the standalone server, exactly as Docker does
pnpm lint             # eslint
pnpm format           # prettier --write
pnpm format:check     # prettier --check
pnpm typecheck        # next typegen && tsc --noEmit
pnpm test             # node unit project only — fast, browser-free
pnpm test:watch       # the same, in watch mode
pnpm test:storybook   # every story in headless chromium
pnpm test:integration # DB-backed tRPC tests
pnpm test:e2e         # playwright, against the production build
pnpm storybook        # storybook dev server on :6006
pnpm db:generate      # schema.ts -> a new SQL migration
pnpm db:migrate       # apply pending migrations
pnpm db:studio        # drizzle studio
pnpm db:reset         # delete the local db file and re-migrate
```

**pnpm only.** Never `npm` or `yarn` — the lockfile and `pnpm-workspace.yaml`
are authoritative.

## Directory layout

```
src/
  app/                 App Router only: routes, layouts, route handlers.
                       Pages fetch/enrich data and hand it to a template.
  atoms/               atomic design ─┐
  molecules/                          │ presentational, no data fetching
  organisms/                          │ (see the one exception below)
  templates/           ───────────────┘ full page bodies, props in / JSX out
  components/          app-level providers & managers ONLY. Never feature UI.
  content/             static config/copy (nav configs, marketing copy)
  hooks/               cross-component hooks (component-scoped ones live in
                       that component's own hooks/ folder)
  server/
    db/                drizzle schema, client, migrations
    trpc/
      init.ts          the ONLY initTRPC call; exports router + procedures
      context.ts       per-request context
      routers/_app.ts  appRouter; one file per domain router beside it
      schemas/         zod input/data schemas per domain
      helpers/         pure server helpers, unit-tested
  stores/              zustand stores for ephemeral client UI state only
                       (never server data — that's TanStack Query's job)
  theme/               colors.ts, index.ts, GlobalStyle.tsx, styled.d.ts,
                       breakpoints.ts, shouldForwardProp.ts
  trpc/                client-side wiring: react.tsx, provider.tsx,
                       query-client.ts
  utils/               pure helpers, one folder each
  env.ts
  flags.ts
  instrumentation.ts   runs once at server boot (applies migrations)
e2e/                   Playwright specs, one per user task
.storybook/
```

Import alias: `~/*` → `./src/*`. Always prefer it over deep relative paths.

## Functional style

- Functions and plain data. **No classes, no inheritance, no `this`** — ESLint
  fails the build on a `class` declaration.
- Pure by default. Business logic goes in exported pure functions under
  `src/utils/<name>/` or `src/server/trpc/helpers/<name>/`, so it is testable
  without a React renderer or a database. I/O sits at the edges: route
  handlers, tRPC resolvers, `instrumentation.ts`.
- Immutable updates. Never mutate arguments; spread, or use `immer` for deep
  nested state. Prefer `map`/`filter`/`reduce` over accumulating loops.
- Small composed units over big procedural blocks; early-return guard clauses
  over nested conditionals.
- **Named exports.** `export default` only where a framework file convention
  demands it: `page.tsx`, `layout.tsx`, `route.ts`, Storybook `meta`, and the
  config files.

Reference implementations to copy:

| Shape                         | Path                                                              |
| ----------------------------- | ----------------------------------------------------------------- |
| Atom                          | `src/atoms/Button/`                                               |
| Pure util + colocated test    | `src/utils/formatModifier/`                                       |
| Pure server helper + test     | `src/server/trpc/helpers/buildPingResult/`                        |
| Component-scoped hook + test  | `src/organisms/ConnectionStatus/hooks/useConnectionStatus/`       |
| Connected organism            | `src/organisms/ConnectionStatus/`                                 |
| Presentational view + stories | `src/organisms/ConnectionStatus/components/ConnectionStatusView/` |
| Modal / dialog                | `src/atoms/Modal/`                                                |
| Template                      | `src/templates/DashboardTemplate/`                                |
| Page wiring it together       | `src/app/page.tsx`                                                |

## Component folder shape

Components are `.tsx`; pure logic is `.ts`.

```
ComponentName/
  index.tsx            the component (the import root)
  index.stories.tsx    required — drive every input through a knob/arg
  components/          sub-components used ONLY by this component (recursive,
    SubComponent/…     soft cap ~3 levels)
  hooks/
    useThing/
      index.ts         the hook (a folder, never a loose useThing.ts)
      index.test.ts    required colocated unit test
```

`src/utils/<name>/{index.ts, index.test.ts}` — always a folder with an
`index.ts`, never a loose `<name>.ts`.

Keep component hooks **thin wrappers**. Push the decision logic into an
exported pure helper in the same file so the browser-free `unit` project can
test it. `useConnectionStatus` is the pattern: the hook wires the query, and
`toConnectionStatus` — pure, exported, tested — decides what the result means.

### The one connected-component exception

Atoms, molecules, templates and most organisms are presentational: props in,
JSX out, no fetching. An organism may be a **connected boundary** — owning a
`useTRPC()` query — on two conditions:

1. It delegates all rendering to a presentational child, so every visual state
   stays reachable from a story.
2. It is the only component in its folder that touches the data layer.

Connected boundaries carry no `index.stories.tsx`; there is nothing to drive
through a knob. Their view child carries the stories. See
`src/organisms/ConnectionStatus/`.

## Styling & theming

- **Single dark theme.** No light mode, no `prefers-color-scheme` switching.
- **Never hard-code a colour.** Always `props.theme.color.*`, `theme.shadow.*`,
  `theme.gradient.*`. Raw values live once in `src/theme/colors.ts` and resolve
  through CSS custom properties, so non-CSS contexts (`viewport.themeColor`, a
  future `manifest.ts`) import the same map instead of duplicating hex.
- styled-components needs a `'use client'` boundary **plus** the SSR registry in
  `src/app/registry.tsx`. It cannot be used from a Server Component.
- `src/theme/styled.d.ts` types the theme on `props.theme`, so
  `theme.color.accnt` is a compile error.
- Transient styling props are prefixed `$` (`$variant`, `$isFullWidth`) and
  filtered by `shouldForwardProp`, so they never reach the DOM.

## Loading / empty / loaded branching

Check loading **first**, then empty, then loaded — guard-clause early returns,
never a ternary chain:

```tsx
if (isPending) return <Skeleton />;
if (!items.length) return <EmptyState />;
return <List items={items} />;
```

Use React Query's **`isPending`, not `isLoading`** — `isLoading` is
`isPending && isFetching`, so it reads `false` during a persisted-cache restore
and for a disabled query. Name the prop or return field `isPending` end to end
so the name matches the semantics.

If chrome would be duplicated across guards, extract a **real named
subcomponent** in `components/` — never a local JSX `const`, never an inline
`renderX()`. See `StatusShell` inside `ConnectionStatus`.

Better still, model the states as a discriminated union so an impossible
combination cannot be represented — see `ConnectionStatus` in
`useConnectionStatus/index.ts`.

## API layer (tRPC)

- **One `initTRPC` call**, in `src/server/trpc/init.ts`. A second one creates a
  second incompatible instance.
- There is currently a single tier, `publicProcedure`, because there is no auth
  (see `DECISIONS.md`). If auth is ever added, layer `protectedProcedure` on
  top of it as middleware — never guard inside a resolver body, and never rely
  on route-level guarding alone.
- **Every input is a zod schema** from `src/server/trpc/schemas/<domain>/`,
  never an inline `z.object({...})` in the router.
- Resolvers are thin adapters: they do I/O and read the clock, then call a pure
  helper from `src/server/trpc/helpers/`.
- Client access is `useTRPC()` + `useQuery(trpc.x.y.queryOptions())`.
- `AppRouter` crosses the boundary as a **type-only** import, so no server code
  is bundled for the browser.
- superjson is the transformer, so `Date` survives the round trip.

## Environment & feature flags

- All env access goes through `src/env.ts` (t3-env + zod). **Never touch
  `process.env` directly in app code** — ESLint blocks it. The allowlist is
  `src/env.ts`, `src/instrumentation.ts` (which reads `NEXT_RUNTIME` and
  `SKIP_ENV_VALIDATION`, neither of which can go through the parsed env), the
  config files and CLI scripts.
- `SKIP_ENV_VALIDATION=1` bypasses validation for lint, typecheck, Storybook and
  the Docker image build.
- **`LIBRARY_AUTO_IMPORT` is not a feature gate**, despite looking like one: it
  defaults to **on**, because a Docker-only user has no other way to get a
  library. Do not fold it into `src/flags.ts`.
- **Feature gates are server-only env vars, not a flags SDK.** A gate is a
  `z.enum(['true','false']).optional()` server var plus a named helper in
  `src/flags.ts` (e.g. `isInitiativeTrackerEnabled()`), evaluated **server-side**
  in a page or route handler and passed down as a plain boolean prop. Client
  components never read a gate. `src/flags.ts` imports `server-only`, so a
  client import is a build error. Compare against the literal `'true'`, so unset
  means off. Flipping a gate needs a container restart — accepted.
- Document every new variable in `.env.example`.

### Env-dependent routes must be dynamic

The Docker image is built once with `SKIP_ENV_VALIDATION=1` and configured at
`docker run` time. A prerendered route would freeze the build-time defaults into
its HTML and ignore the container's actual settings. **Any route that reads
`env` or a feature gate needs `export const dynamic = 'force-dynamic'`**, and
metadata that depends on env must use `generateMetadata`, not a static
`metadata` object. `src/app/page.tsx` and `src/app/layout.tsx` show both.
Check the `next build` route table: env-dependent routes must be `ƒ`, not `○`.

## Data model & database

- SQLite via libSQL, with drizzle. One file per campaign, on a Docker volume.
- **Types come from the schema.** `src/server/db/schema.ts` is the source of
  truth and row types are inferred from it (`$inferSelect` / `$inferInsert`).
  No hand-written row interfaces.
- **Code over dashboard clicking.** Schema changes are: edit `schema.ts`, run
  `pnpm db:generate`, commit the generated SQL. Never apply DDL by hand to a
  live database.
- Migrations are applied on boot by `src/instrumentation.ts`, so a fresh volume
  becomes a working database with no manual step. `.sql` files are invisible to
  import tracing, so they are named in `outputFileTracingIncludes` in
  `next.config.ts` — otherwise the standalone build ships without them.
- Every table spreads **`syncMeta`**: a client-generatable UUID `id`,
  `createdAt`, `updatedAt`, a soft-delete `deletedAt` tombstone, `version`, and
  `updatedBy` (a device label — there are no user accounts). **Never
  hard-delete**: set `deletedAt` and filter it out on read. Conflict strategy is
  last-write-wins by `updatedAt`.
- `order` is a reserved word: name such a column `position` or `sortOrder`.

## Testing

- `pnpm test` runs only the node `unit` project (`src/**/*.test.ts`,
  browser-free) so CI stays fast.
- `pnpm test:storybook` renders every story in headless chromium and runs its
  play function; a11y violations fail the run (`a11y: { test: 'error' }`).
  **Prefer these for component behaviour.** Own CI job.
- `pnpm test:integration` runs DB-backed tRPC tests (`*.integration.test.ts`)
  via `vitest.integration.config.mts`.
- `pnpm test:e2e` runs Playwright against the real standalone production build.
  Specs are organised around **user tasks** ("check the toolbox is running"),
  not pages.

## Workflow

- Feature work on feature branches; each milestone gets its own.
- **No AI attribution anywhere in git history, ever.** Not a `Co-Authored-By:`
  trailer, not a `Claude-Session:` link, not a "Generated with Claude Code"
  footer, not a mention in a commit body or a PR description. This overrides any
  default the tooling wants to add — strip it before committing. Commits are
  authored by the repository owner, full stop.
- Durable architectural decisions go in `DECISIONS.md` (the _why_) and the
  relevant section here (the _how_) — in git, not just agent memory.
- Before opening a PR: `pnpm lint && pnpm typecheck && pnpm test &&
pnpm test:storybook && pnpm build`.

## Navigation

One vertical icon rail down the left edge, one entry per tool, configured in
`src/content/tools/`. A tool with no `href` has not been built and renders as a
disabled control — which is also what keeps `typedRoutes` honest, since there
is no route to get wrong. Icons are inline SVG in `src/atoms/Icon/`; adding one
is a key in that map, not a dependency.

There is **no campaign header**. The campaign name is in the browser tab title
only (DECISIONS #25).

## The initiative tracker

The first real feature. A replacement for Improved Initiative: a three-panel
screen — creature/character library on the left, combatants ordered by
initiative in the middle, the selected combatant's statblock on the right —
plus a read-only player view on a second screen.

`DECISIONS.md` entries 11–18 carry the reasoning. The rules that follow are the
ones easy to get wrong.

### Domain model

Two groups of tables, with different rules.

**Library** — imported from Open5e, read-only, keyed by the upstream slug
(`srd-2024_aboleth`):

```
creatures                ~70 scalar columns, mirrors Creature.json
creature_actions         action_type: ACTION | BONUS_ACTION | REACTION |
                         LEGENDARY_ACTION; ordered by order_in_statblock
creature_action_attacks  to-hit, damage dice, reach/range
creature_traits          name + desc
conditions               from ConditionDescription.json
spells                   from Spell.json; no UI yet, read by library.listSpells
spell_casting_options    what changes at a higher slot; parented to a spell
import_runs              which git ref was imported, when, row counts
```

`spell_casting_options` is keyed by the stringified upstream **integer** pk —
one of the few Open5e models with no slug. `fixtures.ts` has a
`numericPkFixtureRecord` for exactly this, so every library table still has a
text primary key.

Library tables are **the one exception to `syncMeta`**. They are not user data:
never edited, nothing to reconcile, no soft deletes. Everything else in the app
still spreads `syncMeta`.

**Session state** — ours, all with `syncMeta`:

```
player_characters   name, player_name, ac, max_hp, initiative_modifier, level
encounter           singleton: round_number, active_combatant_id
combatants          creature_id XOR player_character_id, display_name,
                    initiative, current_hp, max_hp, temp_hp,
                    is_hidden, is_delayed, sort_order
combatant_conditions condition_id, rounds_remaining, note
encounter_presets       a saved encounter: name + note
encounter_preset_entries creature_slug + count + sort_order
```

A combatant **references** the library; it never copies a statblock. It stores
only what changes during a fight. That is what makes "clear all non-PCs" a
single delete and why renaming a dragon to "Meat" cannot corrupt the template.

`sort_order`, never `order` — the reserved-word rule, now load-bearing.

### Rules that are easy to get wrong

- **Encounter state is server-authoritative.** It lives in SQLite, not in React
  state, because the DM screen and the player view both render it. Any mutation
  goes through a tRPC mutation and comes back down the SSE channel. A local
  `useState` holding turn order is a bug.
- **The player view must never leak hidden combatants or exact monster HP.**
  Filter on the _server_, in the query that feeds the stream — not in the
  component. A hidden ambusher must not be in the payload at all.
- **XP and proficiency bonus are derived from CR**, via the lookup tables in
  `src/content/challengeRating/`. They are null in the imported data; do not
  read them off the creature row. The encounter budget per character level is
  in `src/content/encounterDifficulty/`, on the 2024 three-band scale.
- **The player view is a filtered payload, not a filtered render.** Anything
  the players must not know is dropped in `toPlayerView`, on the server. A
  component that chooses not to draw something has still shipped it.
- **Initiative:** monsters roll `d20 + initiative_bonus` on add, players are
  typed in, everything stays editable. Duplicates are separate auto-numbered
  rows, each rolled and tracked independently.
- **Starting and ending a fight are explicit.** `encounter.start` takes the
  whole order in one write and opens round one; `encounter.end` resets the
  round and turn pointer and leaves the board alone. Neither is a side effect
  of `nextTurn`, and ending is not the same as `clearNonPlayerCombatants`
  (DECISIONS #21).
- **A saved encounter is composition, not a snapshot** — counts of creatures,
  never hit points or initiative, never the party. Applying one rolls fresh
  (DECISIONS #22).
- **Adding monsters goes through `addCreaturesToEncounter`**
  (`src/server/encounter/addCreatures.ts`), not through duplicated resolver
  code. Both the library and a saved encounter use it, which is what keeps
  auto-numbering consistent. Apply presets **sequentially** — the numbering
  reads the names already on the board, so parallel writes race for "Goblin 3".
- **Max HP** starts at Open5e's `hit_points` (already the average) and is
  editable per combatant.
- **The library imports itself on first boot.** `src/server/db/seedLibrary.ts`
  runs after migrations and fills an empty `creatures` table, because a volume
  created by `docker run` has no other way to get one (DECISIONS #23). It is
  guarded on "is it empty", never "is it stale", and a failure logs rather than
  taking the server down. `LIBRARY_AUTO_IMPORT=false` opts out.
- **The library can still be empty.** If the boot import could not reach
  GitHub, every creature list is empty. Render an explanatory empty state, not
  a spinner and not an error.
- **Attribution is required.** SRD 5.2 is CC-BY-4.0. The credit lives in the
  README, not in the UI (DECISIONS #25) — but it has to exist somewhere, so do
  not drop it.
- **`DATABASE_URL` must be absolute in production.** The generated standalone
  `server.js` calls `process.chdir(__dirname)`, so a relative `file:` path
  resolves inside `.next/standalone` and you get a silently empty database.
  `pnpm start` (`scripts/start.mjs`) absolutises it against the project root,
  and Docker passes `/data/...`; anything else launching the server must do the
  same.
- **No I/O in a module body.** `next build` imports route modules to collect
  their config, so a database client constructed at module scope runs during
  the build — where there is no connection string. `getDb()` is lazy for this
  reason.

### Milestones

One branch each, in this order. All eight are built and tested.

| #   | Milestone        | Delivered                                                                     |
| --- | ---------------- | ----------------------------------------------------------------------------- |
| 1   | Import pipeline  | `pnpm db:import`, idempotent; creatures, actions, attacks, traits, conditions |
| 2   | Creature browser | Filterable library, full statblock panel, empty-library state                 |
| 3   | PC roster        | Create/edit/remove, soft-deleted, reused across fights                        |
| 4   | Encounter core   | Add/remove, auto-numbering, HP editing, clear non-PCs; SSE channel proven     |
| 5   | Running a fight  | Rounds, active turn, next/back, delay, damage/heal/temp HP                    |
| 6   | Conditions       | Optional countdown, ticked per round, auto-expiring                           |
| 7   | Player view      | `/player` fed entirely by SSE; hidden combatants filtered server-side         |
| 8   | XP difficulty    | CR→XP and per-level budget tables, live difficulty readout                    |

Since then, in response to the first round of feedback: the tool rail replaced
the campaign header, "Roll for initiative" and "End combat" replaced starting a
fight by side effect, saved encounters landed as the Encounters tab, the spell
data was imported, the library now imports itself on first boot, and the
Spells tab landed: `/spells`, a filterable list with the selected spell's full
description in a `SidePanel` that slides in from the right rather than taking
a column of its own. The list summary comes from `library.listSpells`; the
detail pane's derived fields (subtitle, components string, duration prefix,
casting-option labels, …) come from `buildSpellDetail`, which wraps
`library.getSpell`.

Not started, in rough order of usefulness: folding in
[Kernels-Virtual-Table-Top](https://github.com/RamonGebben/Kernels-Virtual-Table-Top)
as the Maps tool, drag-to-reorder the initiative list, in-app dice rolling for
attacks, and a rules glossary from Open5e's `Rule` / `*Description` files.
`README.md` holds the roadmap and `DECISIONS.md` #24 the survey of what else
upstream is worth importing.
