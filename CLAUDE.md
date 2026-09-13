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
| Template                      | `src/templates/TrackerTemplate/`                                  |
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

### Layout conventions

- **`Page` carries no padding or gap.** A template's outermost wrapper only
  sizes to `100dvh` and flips `flex-direction` at the `lg` breakpoint. Padding
  and gap live on the `Workspace` child instead, so the navigation rail runs
  flush against the viewport edge rather than floating inside a padded frame.
  See `SpellsTemplate` and `TrackerTemplate`.
- **The navigation rail is flush chrome, not a floating card.** `Rail` has no
  border-radius and no full border box — only a `border-right` divider — so it
  reads as part of the viewport edge. Its padding is asymmetric,
  `theme.space.md` vertical / `theme.space.sm` horizontal, not one uniform
  value.
- **`Panel` fills its container's main axis by default.** `Frame` sets
  `flex-basis: 100%` so a panel placed in a flex row (with no `flex` of its own
  on the wrapping element) spans the full width offered to it instead of
  sizing to content. This has no effect inside a `grid` layout (e.g.
  `TrackerTemplate`'s `Columns`), where sizing comes from
  `grid-template-columns` instead.
- **`Tabs` is a full-width segmented control, not a left-aligned cluster.**
  `List` is `width: 100%`; each `Tab` is `flex: 1 1 0; min-width: 0;
text-align: center;` so tabs stretch to fill their container and split the
  space evenly rather than sizing to their label.
- **A panel-local footer reserves height with `calc()`, not a page footer.**
  When only one panel needs trailing content below its scroll area (e.g. the
  "open player screen" link), render it as that `Panel`'s last child, not a
  page-wide footer strip. Size the scrollable sibling to
  `calc(100% - theme.space.lg)` instead of `100%` so it stops short of the
  footer rather than overlapping it.

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
  `src/flags.ts` (e.g. `isSomeFeatureEnabled()`), evaluated **server-side**
  in a page or route handler and passed down as a plain boolean prop. Client
  components never read a gate. `src/flags.ts` imports `server-only`, so a
  client import is a build error. Compare against the literal `'true'`, so unset
  means off. Flipping a gate needs a container restart — accepted. No gate is
  defined right now — the initiative tracker's own gate (and the dashboard
  template it gated) was removed once the tracker became the permanent
  flagship feature; the next tool that needs one starts the pattern over.
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

**Opening `/player` goes through `window.open`, not a plain `target="_blank"`
anchor — but it's still an anchor.** `~/molecules/OpenPlayerScreenLink` is an
`<a href="/player" target="_blank" rel="noreferrer">` whose `onClick` only
intercepts a plain left-click (no modifier key) to call `window.open('/player',
'kernel-dm-toolbox-player-screen')` instead — a named window, so a second
plain click refocuses the window already open (one the DM likely dragged out
to a second monitor/TV already) rather than spawning a fresh tab every time.
A ctrl/cmd/shift/alt-click returns early and lets the anchor's own `href`/
`target` do the native thing; middle-click and the right-click context menu
("open in new tab", "copy link") never fire `onClick` at all, so they were
never at risk. Shared by the tracker's own panel footer (`TrackerTemplate`)
and the Maps tool's Player Screen tab (`SessionControlsView`) — the same
action, not two.

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

One more library-adjacent table, `spell_effects`, is **not** from Open5e — it
maps a spell to an animated effect clip from a different upstream
(`jackkerouac/animated-spell-effects`, GPL-3.0), matched by damage type and
area shape at import time (`~/server/library/effectCandidates`, DECISIONS
#29). It's exempt from `syncMeta` for the same reason the tables above are:
derived, not user data, rewritten wholesale on every import — it just has a
different upstream to point at when asking "why does this row look like
this".

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
Spells tab landed: `/spells`, a two-panel layout — a filterable list beside a
fixed panel showing the selected spell's full description, the same
fixed-panel shape as the initiative tracker rather than a slide-in overlay.
The list summary comes from `library.listSpells`; the detail panel's derived
fields (subtitle, components string, duration prefix, casting-option labels,
…) come from `buildSpellDetail`, which wraps `library.getSpell`. The list can
be filtered by several levels and several classes at once, checkbox-in-a-
dropdown style, via `~/atoms/MultiSelectFilter` — a generic atom, reusable
wherever a facet is multi-choice rather than the single-choice `<select>`
`ConditionPicker` uses. The class options come from `library.listSpellClasses`,
which derives the list from the classes actually present on an imported spell
(`buildSpellClassOptions`) rather than a hardcoded roster, since which classes
have spells depends on what got imported.

Not started, in rough order of usefulness: drag-to-reorder the initiative
list, in-app dice rolling for attacks, and a rules glossary from Open5e's
`Rule` / `*Description` files. `README.md` holds the roadmap and
`DECISIONS.md` #24 the survey of what else upstream is worth importing.

## The Maps tool

A virtual tabletop, ported from the user's standalone
[Kernels-Virtual-Table-Top](https://github.com/RamonGebben/Kernels-Virtual-Table-Top)
app: a pan/zoom/grid/fog-of-war battle map for the DM, and a second screen the
table watches — the same DM-screen-plus-player-screen shape as the initiative
tracker, sharing its `/player` route and the SSE pattern (DECISIONS #18).

### Domain model

```
map_folders             one level deep — a folder never nests inside another
maps                    an uploaded image/video; grid calibration and fog of
                        war live here, per map, not globally
map_sessions            singleton (`CURRENT_MAP_SESSION_ID`), mirroring
                        `encounters`: the active map, the DM's own viewport,
                        the player-view lens, grid display prefs, the player
                        screen mode, the in-progress measurement preview, and
                        the DM's live "aim" cursor before it
map_measurement_shapes  a placed ruler or spell-area template, per map;
                        several coexist, each cleared individually
```

Maps tables spread `syncMeta` like every other session table — unlike the
Open5e library, none of this is read-only reference data.

### Rules that are easy to get wrong

- **The canvas draws through one RAF-gated scheduler, never synchronously.**
  `MapCanvasView`'s draw effect always calls `scheduleDraw()`, never
  `drawScene()` directly — learned the hard way, from a real profiling
  session where a synchronous draw call in the effect's tail was 81% of tab
  CPU during pan/zoom. Every per-event value that used to flow straight into
  React state — the viewport, the grid-calibration preview, the lens drag —
  lives in a ref instead, diffed and reported at most once per animation
  frame from inside that one RAF callback.
- **A continuous DM gesture never writes per raw event.** Fog painting
  batches a whole stroke into one mutation on pointerup (`onFogStrokeBatch`).
  The DM's own viewport debounces to a settle-write (~800ms) since it only
  needs to survive a restart, not reach another screen instantly. The
  player-view lens is the one exception that writes _live_: it's diffed and
  reported at most once per animation frame while being dragged (the same
  RAF-notify pattern `onViewportChange` already uses), plus one final commit
  on pointerup, so the player screen visibly tracks the drag rather than
  jumping only on release — see DECISIONS #26 for why the lens gets this
  treatment and the fog brush/calibration don't.
- **The player-view lens is independent of the DM's own pan/zoom, always
  draggable, and wheel-zoomed — not corner-handle-resized.** It is a second,
  separately-stored viewport (`playerViewport*`) rendered as a rect
  (`~/utils/mapLens`) directly on the DM's own canvas — a rectangle, not a
  "push my view" button — so checking a monster or painting fog never drags
  the table's view along with the DM's. There is no "edit mode" to enter
  first: dragging the rect's body moves it, and scrolling the wheel while the
  cursor is over it zooms it (mirroring the DM's own wheel-zoom elsewhere on
  the same canvas) — matching the source VTT app's original interaction, not
  a drag-a-corner-handle resize.
- **The player screen is mode-aware, not map-only.**
  `map_sessions.playerScreenMode` is `'map' | 'tracker' | 'both'`; `/player`
  renders `PlayerScreen`, which owns the map session's SSE stream and
  switches layout on it. `'tracker'` renders the existing `PlayerBoard`
  completely untouched — the default, so a session that predates Maps
  doesn't have its player screen silently switch away from initiative.
- **Grid display is session-wide; grid calibration is per-map.** Color,
  opacity, visibility and background live on `map_sessions` (they apply to
  whichever map is live); cell size and origin live on `maps` (a property of
  that specific image). Both live in the Grid tab — from the DM's chair
  they're both just "grid settings," even though they're two different
  tables underneath.
- **Uploads live outside tRPC.** `POST /api/maps/upload` is a plain
  multipart handler — tRPC has no multipart support — and the insert on the
  server IS the confirmation; the client invalidates `maps.list` by hand.
  `GET /api/maps/[mapId]/file` serves the bytes with range support, so a
  `.webm` map can seek instead of downloading in full first. Both the DM and
  player canvases fetch the same URL. Storage path is always
  server-generated (`~/utils/mapStorage`), never derived from the uploaded
  filename.
- **The canvas backing store caps its device pixel ratio at 2x**, computed
  once in `useCanvasSize` and read from there rather than re-reading
  `window.devicePixelRatio` at draw time — on a 3x display this roughly
  halves the pixels rasterized every frame, and removes a drift risk between
  two independent reads of the same value.
- **The ruler and spell-area templates measure in grid squares, not
  pixels.** `~/utils/mapMeasurement` uses 5e's tabletop convention —
  grid-square counting, a diagonal costs the same as an orthogonal move
  (Chebyshev distance in grid cells) — never true Euclidean geometry. This is
  a deliberate divergence from the pixel-accurate `mapViewport`/`mapLens`
  math elsewhere on this canvas; do not "fix" it to match (DECISIONS #27).
  Only the origin snaps — to the selected tile's **center**
  (`snapPointToGridCellCenter`), not its nearest corner, so a shape always
  originates from the middle of the square it's placed in, the same as
  where a token/creature sits — a cone/line/cube's orientation stays a
  free angle.
- **A placement is two clicks, not a held drag** — origin click, then the
  shape live-follows the cursor, then a confirm click — mirroring
  `calibrationStart`/`calibrationPreviewRef`'s two-click flow, not the
  fog brush's continuous stroke. The pending origin and live-follow shape
  are local refs inside `useViewportInteraction`, never round-tripped
  through React state or the zustand store — nothing outside the canvas
  needs the in-progress point, the same reasoning `calibrationPreviewRef`
  already documents.
- **A size preset fixes the extent, not the gesture.** Picking a 5e preset
  size (or a spell via `mapSpellShapeType`) sets
  `measurementTool.presetExtentFeet`. For a `circle` — no facing to aim —
  the next click commits immediately at that exact size, since a second
  click would have nothing left to do. Every other shape still arms a
  second click, but to aim its direction rather than to free-drag its size:
  the origin click fixes both position and extent, and the cursor between
  the two clicks only rotates it (`computeAimPreview`, distinct from
  `computeMeasurementPreview`'s distance-derived extent for a custom/no-
  preset placement), broadcast live to the player screen the same way a
  free-drag's in-progress preview already is. A `ruler` has no size of its
  own and always free-drags regardless (DECISIONS #27).
- **Picking a spell also auto-assigns the shape's colour from its damage
  type** — `mapDamageTypesToColor` (a fixed hex palette: acid green, fire
  red, cold icy blue, radiant gold, …). Only overrides `measurementTool.color`
  when a mapping exists; a spell with no damage type (a buff, a utility
  effect) leaves whatever colour was already set untouched rather than
  overwriting it with a guess. The first listed damage type wins for a spell
  with more than one (`listSpells` now selects `damageTypes` for this).
- **The live-drag preview reuses the lens's exact broadcast pattern.**
  `map_sessions.livePreviewShape` (nullable JSON) is written from the same
  RAF-notify scheduler as `onLensChange`, at most once per animation frame,
  and read back out through `toPlayerMapView`/SSE — so `/player` tracks a
  shape while the DM is still aiming it, not just once it's committed to
  `map_measurement_shapes`. Committed shapes need no player-side filtering:
  every placed shape is meant to be seen, there is no "secret" measurement.
- **Every shape (committed, live-drag, or remote) draws its distance as a
  label at its far end.** `computeShapeLabelAnchor` + `buildMeasurementLabelText`
  are pure and shared by all three draw call sites in `MapCanvasView`, so a
  DM reading their own drag, a spectator reading the player screen's live
  preview, and a glance at an already-placed shape all read the same text in
  the same spot.
- **A shape's label font size is a session-wide multiplier, not a per-shape
  or per-screen setting.** `map_sessions.measurementLabelScale` (default 1,
  0.5–3 range, same TV-readability purpose as `trackerOverlayScale`'s own
  0.5–2 range — a TV viewed from across the room needs bigger text than a
  monospace label sized for a DM's own laptop) scales the base 12px font
  `drawShapeLabel` draws at, plus its
  background box's padding/offset so a larger label doesn't crowd or
  overflow a box sized for the default. Set from the Measure panel's own
  preset buttons (`LABEL_SCALE_PRESETS`), it applies retroactively to every
  label already on the board — unlike `color`/`label`, which are baked into
  a shape at creation — and identically on the DM and player canvases, since
  both draw through the same `MapCanvasView` prop.
- **Before an origin is even clicked, the player screen shows an "aim"
  reticle at the DM's live cursor.** `map_sessions.measurementCursor`
  (nullable JSON, same per-map-id guard as `livePreviewShape`) is written
  from the same RAF scheduler, but only while the tool is armed _and_ no
  shape preview exists yet — once a shape preview exists it takes over, so
  the two never draw at once. Requires `useViewportInteraction`'s
  `handlePointerMove` to call `onScheduleDraw()` on every move while armed
  even with no drag in progress (mirroring the fog brush's hover-preview
  cadence) — the RAF loop is what actually broadcasts it, so without this
  the cursor updates the ref but nothing ever notices. The broadcast value
  is `snapPointToGridCellCenter` of the raw pointer (`~/utils/
mapMeasurement`), not the raw position — the diff check that gates
  `onMeasurementCursorChange` (in `MapCanvasView`'s `scheduleDraw`) then
  only fires a write when the cursor crosses into a different grid cell,
  not on every pixel of movement, which is what keeps a sweeping gesture
  from hammering `setMeasurementCursor`. The reticle's own radius is a
  further `measurementCursorScale` multiplier on `map_sessions` (same
  TV-readability shape as `measurementLabelScale`, its own preset row in
  the Measure panel) — a DM watching a small monitor and a TV across the
  room need different sizes for the same 8px base radius. The whole grid
  cell under the aim point is also highlighted (fill + stroke, tinted the
  armed tool's own color) — on _both_ canvases, not just the player's:
  `MapCanvasView`'s draw code resolves the cell to highlight from
  `cursorMapPosRef` (the DM's own live pointer, always null on a
  non-interactive canvas since it has no pointer handler to populate it)
  falling back to the broadcast `measurementCursor`, so the same branch
  serves the DM's own canvas and the player screen without either passing
  the other's data around. The small reticle stays player-only — the DM
  already sees their real cursor inside the highlighted tile.
- **A placed shape's hit test must run — and win — before the lens/tracker
  hit test, not after.** `map_sessions`' lens defaults to an uncalibrated,
  screen-sized rect (`computeLensRect` off the session's own defaults, e.g.
  1920×1080) that in practice blankets almost any point on a freshly
  uploaded map. `findHitMeasurementShape` in `useViewportInteraction` is
  computed once per `pointerdown`, ahead of the tracker/lens checks, and
  gates them (`!hitShape`) the same way `isFogToolActive()`/calibration
  already do — otherwise a click meant to select/drag a shape silently
  grabs the lens instead. Caught by
  `SelectingAndMovingAPlacedShapeWinsOverTheLens` after showing up as a
  real, reproducible bug against the dev server — storybook's synthetic
  events didn't exercise the default (non-null) lens rect the way a real
  session does, worth remembering when a canvas-interaction change looks
  correct in stories but hasn't been driven against a live session.
- **Selecting and dragging a placed shape is a single grab-and-drag
  gesture, not select-then-drag.** `pointerdown` on a hit shape both selects
  it (`onSelectMeasurementShape`) and starts the move in one step; a plain
  click (no movement) still counts as a select since the resulting no-op
  update is harmless. The moving shape is excluded from the committed-shapes
  draw loop (via `movingShapeIdRef`) so it isn't rendered twice — once stale
  at its old position, once live at the new one. Only available while the
  placement tool is disarmed (`!isMeasurementToolActive()`); an armed click
  always means "place a new shape," never "grab an existing one." Clicking
  empty canvas (tool disarmed, nothing hit) clears the selection.
- **A spell-sourced shape's animated effect plays once — or loops for the
  spell's whole duration — from `effectPlaybackStartedAt`/`effectLoops`, both
  set only at creation.** `map_measurement_shapes` carries `sourceSpellSlug`
  (already existed, for the auto-fill), `effectPlaybackStartedAt`, and
  `effectLoops`; `createMeasurementShape` looks up the source spell's own
  `duration` column and sets both from it (`shouldLoopSpellEffect`,
  `~/utils/mapMeasurement`: false for `'instantaneous'`, true for a real
  duration like `'1 minute'` or `'until dispelled'`) iff `sourceSpellSlug` is
  present. A later `updateMeasurementShape` (drag-to-move) never touches
  either — moving an already-placed shape must not replay or re-arm its
  clip. The URL itself (`buildSpellEffectUrl`, `~/utils/mapMeasurement`) is
  derived purely from the slug, never stored: whether that spell actually
  matched a clip at import time is irrelevant to the DM/player canvas code,
  which only ever finds out by trying to load it — a missing `spell_effects`
  row is a plain 404, and the canvas falls back to the static shape exactly
  as it would for a load failure. For a one-shot (non-looping) shape,
  `isEffectPlaying` (pure) decides whether it's still within its play window
  from the clip's own local `ended` state (see below) — **not** from
  comparing wall-clock elapsed time against the clip's real duration, which
  an earlier version of this function did and which could read false before
  a single frame was ever drawn: most clips are only ~2s, far shorter than
  the network+render latency between placement and a client actually having
  a decodable frame can be, especially over SSE to the player screen. A
  looping shape (`effectLoops`) skips `isEffectPlaying`'s gating entirely in
  `MapCanvasView` — the browser's own `video.loop` (set at the element's
  creation, see below) is what makes it repeat; the draw loop just always
  shows it for as long as the shape exists and its clip hasn't failed to
  load, i.e. until the DM removes the shape ("the spell gets cleared").
  Either way, `MapCanvasView` self-reschedules its own RAF loop for exactly
  as long as any shape's effect is active, then goes idle again — nothing
  else about this canvas runs a free-running timer, so this is the one
  exception, contained entirely inside `drawScene`'s own `hasActiveEffect`
  check.
- **Several shapes can have effects playing at once**, unlike the map's own
  media (`useMapMedia`, always exactly one active image/video) — so
  `useSpellEffectVideoCache` is a pool of `<video>` elements keyed by
  **shape id**, not clip URL. Two placements of the same spell (two
  Fireballs) share a URL but must never share a video element — keying by
  URL would make the second placement silently read the first one's
  already-`ended` state instead of starting its own; the cache learned this
  the hard way. Each element free-runs on its own clock from creation; the
  DM's and the player's independently-created elements for the same clip are
  never explicitly synced to each other. A cache entry is never evicted on
  its own — `pruneVideos` must be (and is, from a `useEffect` keyed on the
  shape list) called with the currently-live shape ids whenever the shape
  list changes, pausing and discarding any element whose shape was removed.
  Without this a looping effect's element would keep decoding/playing
  forever off-screen once nothing on the board referenced its URL any more.

Built: the gallery (folders, upload, rename/move/remove), the canvas (pan,
zoom, grid calibration, fog of war with a reveal/cover brush), the live
session (active map, DM viewport persistence, the draggable lens, the
mode toggle), the mode-aware player screen, and the ruler/spell-area
measurement tool with animated spell-effect playback. Not started: the
Artwork/handout gallery the source app also had.
