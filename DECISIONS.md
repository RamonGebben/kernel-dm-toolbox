# Decisions

Durable architectural decisions and the reasoning behind them. `CLAUDE.md`
records _how_ to follow a convention; this file records _why_ it exists, so a
future change can tell an intentional constraint from an accident.

Newest last. Do not rewrite an entry — supersede it with a new one.

---

## 1. One instance per campaign, and therefore no accounts

**Decision.** The app models exactly one campaign. There is no `Account`, no
`User`, no login, no multi-tenancy. Running a second campaign means running a
second container with its own volume and its own port.

**Why.** The audience is one dungeon master on a home network. Every alternative
buys generality nobody asked for: an accounts table means auth, which means
sessions, password reset and an identity provider, all to distinguish one person
from themselves. Container-per-campaign gets the same isolation from Docker for
free, and isolation at the process boundary is stronger than isolation enforced
by a `WHERE campaign_id = ?` that someone will one day forget to write.

**What it costs.** Cross-campaign features (reusing an NPC in another campaign)
are impossible without exporting and importing. Accepted: that is not a use case
today.

**Where it shows up.** `compose.yaml` has one service and one named volume.
`CAMPAIGN_NAME` is an environment variable rather than a row.

---

## 2. No authentication, but a context shaped so auth can be added

**Decision.** tRPC has a single procedure tier, `publicProcedure`. There is no
`protectedProcedure` or `accountProcedure`.

**Why.** Access control with exactly one legitimate user and a LAN-only
deployment protects nothing; it would be ceremony that has to be maintained and
tested without ever denying a real request. The original plan called for a
`publicProcedure → protectedProcedure → accountProcedure` ladder with
verification repeated in the data layer, which is the right shape for a
multi-tenant product and the wrong shape for this one.

**How the door was left open.** `createContext` returns a `Context` object and
resolvers read campaign identity _from context_, not from `env` directly. Adding
auth means adding a field to `Context` and a middleware tier in `init.ts` — not
touching a single resolver.

**The constraint that survives.** If auth is ever added, verification belongs in
a procedure middleware and in the data layer, never in route-level guarding
alone. Defence in depth was the point of the original rule and it still holds.

---

## 3. SQLite over libSQL, not Postgres

**Decision.** Persistence is a single SQLite file accessed through
`@libsql/client` and drizzle, living on a Docker volume.

**Why.** A campaign's data is small and single-writer. Postgres would mean a
second container, a second thing to back up, and a network hop, in exchange for
concurrency this workload will never use. A SQLite file is also trivially
backed up and moved: it is one file the DM can copy to a USB stick.

**Why libSQL rather than `better-sqlite3`.** libSQL keeps the option of pointing
`DATABASE_URL` at a remote Turso-style server later without changing query code
— only the connection string moves.

**Status.** The seam is wired and proven end to end (schema → generated
migration → boot-time apply → query), but the only table is `app_settings`. Real
domain tables arrive with the initiative tracker.

---

## 4. Generated types, and migrations as reviewable code

**Decision.** `src/server/db/schema.ts` is the single source of truth. Row types
are inferred from it (`$inferSelect` / `$inferInsert`); there are no
hand-written row interfaces. Schema changes are generated SQL files committed to
the repo.

**Why.** A hand-written interface beside a schema is a second source of truth,
and the two drift silently — the compiler cannot tell you that a column was
renamed. Inferring from the schema makes a rename a compile error at every call
site.

Migrations are committed as SQL rather than applied by hand because a schema
change is a code change: it deserves review, it needs to run identically on the
DM's machine and in CI, and it has to be replayable onto a fresh volume. Any
change made by clicking around in a database tool exists nowhere in git and will
not survive the next `docker compose up` on a new machine. If a manual
intervention ever becomes unavoidable, document it here.

---

## 5. Feature gates are server-only env vars, not a flags SDK

**Decision.** A gate is a `z.enum(['true','false']).optional()` server variable
plus a named helper in `src/flags.ts`, evaluated server-side and passed down as
a plain boolean prop. `src/flags.ts` imports `server-only`.

**Why.** A flags SDK means a vendor, a network call on the critical path, and a
dashboard that becomes a second source of truth about how the app is configured.
For a self-hosted single-tenant app, none of that pays for itself: there is no
gradual rollout, no percentage targeting, and no audience to segment. An
environment variable is already how everything else about the instance is
configured, so gates use the same mechanism as `CAMPAIGN_NAME`.

Server-only is deliberate. Without the `NEXT_PUBLIC_` prefix a client import is
a build error, which is what stops a gate from silently becoming part of the
browser bundle and leaking the existence of unreleased features.

Comparing against the literal string `'true'` means an unset or misspelled value
is off. A gate that fails open is a gate that does nothing.

**What it costs.** Flipping a gate needs a container restart. Accepted: the
deploy is `docker compose up -d` on a machine in the same room.

---

## 6. Env-dependent routes must be dynamic

**Decision.** Any route reading `env` or a feature gate sets
`export const dynamic = 'force-dynamic'`, and env-dependent metadata uses
`generateMetadata` rather than a static `metadata` object.

**Why.** This was found by inspecting the `next build` route table rather than
by reasoning: `/` was being prerendered as `○`. The image is built once with
`SKIP_ENV_VALIDATION=1` and configured at `docker run` time, so a prerendered
page freezes the _build-time defaults_ into its HTML — every campaign would have
shipped showing "Untitled Campaign" no matter what its container was started
with, and feature gates would have been permanently stuck at their build-time
values.

**How to catch a regression.** After `pnpm build`, env-dependent routes must
show `ƒ` (server-rendered on demand), not `○` (prerendered).

---

## 7. Migrations run at server boot, not from the container entrypoint

**Decision.** `src/instrumentation.ts` applies pending migrations in its
`register()` hook.

**Why.** The first attempt ran a `tsx` script from `docker-entrypoint.sh` and
would have shipped broken. Next.js output tracing only bundles what app code
imports, and nothing in the app imported the database — so `drizzle-orm` and
`@libsql/client` were absent from `.next/standalone` entirely. Running
migrations from `register()` puts the driver in the app's module graph, which is
what makes tracing include it.

The SQL files needed a second fix: `.sql` is invisible to import tracing, so
`next.config.ts` names `src/server/db/migrations/**` in
`outputFileTracingIncludes`.

**Payoff.** A fresh volume becomes a working database with no manual step, and
the entrypoint is reduced to creating a directory.

---

## 8. styled-components with the theme behind CSS custom properties

**Decision.** styled-components v6 with the SSR registry, one dark theme, and
every colour exposed as `var(--color-*)` rather than as a hex literal in the
theme object.

**Why custom properties.** Some consumers of the palette are not CSS:
`viewport.themeColor` and a future `manifest.ts` need real values. Emitting the
raw map once as custom properties and referencing it everywhere else means those
consumers import `rawColors` rather than pasting a hex that then drifts. It also
makes devtools show `--color-accent` instead of an anonymous swatch.

**Why one theme.** A light mode doubles the surface area of every visual review
for an app used in a dim room by one person who did not ask for it.

---

## 9. Connected components are an explicit, narrow exception

**Decision.** Atoms, molecules, templates and most organisms are purely
presentational. An organism may own a query only if it delegates all rendering
to a presentational child. Connected boundaries carry no story; their view child
does.

**Why.** The rule that everything is presentational is what makes Storybook a
real test surface — a component that fetches cannot have its error state driven
from a knob. But _something_ has to call `useTRPC()`, and pushing that all the
way up into pages means threading data through every layer. Naming a single
thin layer where fetching is legal keeps the testable surface intact while
keeping prop drilling shallow. `ConnectionStatus` is nine lines of wiring;
`ConnectionStatusView` holds every state and every story.

---

## 10. Two Vitest projects, split by what they need

**Decision.** `pnpm test` runs only the node `unit` project. Stories are tested
by a separate `storybook` project in headless chromium, and DB-backed tests by a
separate config again.

**Why.** These have wildly different costs — the unit project runs in about
150ms, the browser project takes several seconds and needs a Playwright install.
Keeping them separate means the fast feedback loop stays fast and stays runnable
anywhere, and CI can fail the cheap job before paying for the expensive one.
It also forces the discipline that matters: if logic can only be tested in the
browser project, it has not been extracted into a pure function yet.

---

## 11. Creature data comes from Open5e's GitHub fixtures, not their API

**Decision.** The library is built from the JSON fixtures in
`open5e/open5e-api` under `data/v2/wizards-of-the-coast/srd-2024`, read at a
pinned git ref. The `api.open5e.com` REST API is not used.

**Why.** The API sits behind a CDN that rate-limits, and a probe of
`/v2/creatures/` returned a 524 gateway timeout. Importing 331 creatures plus
their actions, attacks and traits over a paginated, rate-limited API is slow,
fragile, and produces a different result depending on when it ran. The
fixtures are the same data at rest: four files, no pagination, no throttling,
and a git ref that makes an import reproducible.

**What we get.** SRD 5.2, published as **CC-BY-4.0** — attribution is required
and belongs in the UI. 331 creatures, CR 0–30. The data is already flat and
relational, with stable slug primary keys (`srd-2024_aboleth`) and `parent`
foreign keys, so importing is close to a direct row mapping.

---

## 12. The library is imported on demand, not vendored into the repo

**Decision.** `pnpm db:import` fetches the fixtures and loads them. The JSON is
not committed to this repository.

**Why.** Considered and rejected: vendoring the ~2.5MB of fixtures would make
the app work with no network at all, which fits a LAN-only deployment. The call
was made the other way to keep the repo free of a large body of third-party
data that we do not own and would have to keep in sync by hand.

**What it costs, and how it is mitigated.** A fresh container on a network with
no internet has an empty library until the import has been run once. Therefore:

- The import is **idempotent and re-runnable** — running it twice is a no-op,
  and it can be re-run to pick up upstream corrections.
- It is **pinned to a git ref**, not a moving branch, so two machines importing
  months apart get identical data.
- An `import_runs` table records which ref was imported, when, and how many
  rows landed, so the library's provenance is answerable from the database.
- An empty library is a **first-class UI state** with a "run the import"
  explanation, never a blank screen or an error.

---

## 13. The library schema mirrors Open5e's relational shape

**Decision.** `creatures`, `creature_actions`, `creature_action_attacks`,
`creature_traits` and `conditions` mirror the fixture files field for field,
rather than storing statblocks as JSON blobs.

**Why.** The upstream data is already normalised — roughly seventy scalar
columns on the creature, with actions and traits as separate rows carrying
`action_type`, `order_in_statblock` and `legendary_action_cost`. Flattening
that into JSON would throw away structure that already exists, and would
require hand-written zod schemas to read it back — a second source of truth,
which is exactly what the generated-types rule exists to prevent.

Mirroring keeps every field queryable ("all CR 5–8 undead with legendary
actions" is a `WHERE`), and drizzle infers all row types from the schema.

**Consequence.** Library tables are the one exception to the `syncMeta` rule.
They are imported, read-only, and keyed by the upstream slug; they are not
user data, are never edited, and have nothing to reconcile. `syncMeta` applies
to session state — characters, encounter, combatants, conditions.

---

## 14. One current encounter, and a persistent character roster

**Decision.** There is exactly one encounter, stored as a singleton row holding
the round number and which combatant is active. Player characters live in their
own table and outlive any fight. Clearing an encounter deletes the non-PC
combatants and leaves the party in place.

**Why.** It is how a session actually runs: the party is a constant, the
monsters change every fight. A library of saved encounters — the Encounters tab
in the reference tool — is a prep-time feature, and prep is not what this is
being built for yet. A singleton also means there is no "which encounter am I
looking at?" state to manage anywhere in the UI.

**Left open.** Saving a built encounter as a named preset is additive: a
template table plus a "load" action. Nothing here forecloses it.

---

## 15. Combatants reference the library rather than snapshotting it

**Decision.** A combatant row points at either a `creature_id` or a
`player_character_id`, and stores only what changes during a fight: display
name, initiative, current/max/temp HP, hidden, delayed, sort order. The
statblock panel reads through the reference.

**Why.** The things that vary in a fight are a short, fixed list; the statblock
is not one of them. Copying seventy columns plus action rows per combatant to
express "this goblin has taken 4 damage" is enormous duplication for no gain.
Referencing also makes renaming free — a dragon displayed as "Meat" is a
`display_name` on the combatant, and the dragon template is untouched.

**The trade.** Re-importing the library could in principle change a statblock
mid-fight. On a single-user LAN tool where the import is a deliberate manual
act, this is not a real hazard. If per-combatant statblock editing is ever
wanted, the answer is copy-on-write, not snapshot-by-default.

---

## 16. Monsters roll their own initiative; players type theirs in

**Decision.** Adding a monster rolls `d20 + initiative_bonus` automatically.
Player initiative is typed in by the DM. Every value is editable afterwards.

**Why.** It matches what happens at a table: players roll their own dice and
call out numbers, and taking that away is a worse experience for them, not a
better one. The monster side is pure bookkeeping and should be instant —
Open5e already supplies `initiative_bonus` precomputed, so no derivation is
needed.

**Duplicates.** Four goblins are four rows, auto-numbered `Goblin 1..4`, each
rolling separately and each with its own HP pool. Grouping them on one
initiative would save a few keystrokes and cost the per-monster tracking that
is the entire point of the tool.

**Max HP** starts at the book average (Open5e's `hit_points`) and is freely
editable, which is what makes a custom "Meat 35/52" possible without a
separate homebrew-creature feature.

---

## 17. Experience points and proficiency bonus are derived, not imported

**Decision.** A static CR→XP and CR→proficiency-bonus table lives in
`src/content/`, and both values are computed from `challenge_rating`.

**Why.** Not a preference — a gap in the source data.
`experience_points_integer` and `proficiency_bonus` are null in 330 of the 331
creature records. The encounter difficulty readout needs XP per creature, and
statblocks display a proficiency bonus, so both have to come from somewhere
else. They are exactly determined by CR in the rules, so a lookup table is
complete and correct rather than an approximation.

**Consequence.** The difficulty calculation needs party size and level, so
player characters store a level.

---

## 18. The player view is a live read model over SSE

**Decision.** A separate read-only route streams encounter state to a second
screen over Server-Sent Events. Players see the order, names, whose turn it is,
and healthy/bloodied/dying — never exact monster HP. Combatants flagged hidden
are omitted entirely.

**Why SSE rather than polling.** The update is one-directional and
server-driven, which is precisely what SSE is for; a WebSocket would be a
bidirectional channel with nothing to send back. Polling was the alternative
and works fine on a LAN, but "whose turn is it" is the one thing that must feel
instant on a screen the whole table is watching.

**Why status rather than numbers.** Exact monster HP tells players how many
rounds are left, which is information their characters do not have. Bloodied
is what they can actually perceive.

**Architectural consequence.** Encounter state must be server-authoritative —
in SQLite, not in React state — because two clients render it. This is the
constraint that most shapes the encounter code, and it is why the state lives
where it does.

---

## 19. Encounter difficulty uses the 2024 three-band scale

**Decision.** Difficulty is Low / Moderate / High, measured against a per-
character XP budget summed across the party, with no multiplier for the number
of monsters. Fights above the High budget are reported as Deadly.

**Why.** The reference tool's screenshot says "Hard: 2900 XP", which is the
older four-band scale (Easy/Medium/Hard/Deadly) plus a multiplier that scaled
the monsters' XP by how many there were. The library here is SRD 5.2, and the
2024 rules replaced both: three bands, and a straight comparison of totals.
Matching the rules the statblocks come from matters more than matching the old
tool's wording — otherwise the tracker and the monsters disagree about the game
being played.

**Deadly is ours, not the book's.** The published table stops at High, so an
encounter above that budget has no rating. Clamping it to High would hide
exactly the case a DM most needs warning about, so anything over the High
budget is reported as Deadly.

**Where the data lives.** `src/content/encounterDifficulty/` holds the budget
table and `src/content/challengeRating/` the CR→XP and CR→proficiency tables.
Static rules data belongs in `content/`; the functions that read it live in
`src/utils/`.

---

## 20. Conditions tick per round, not per turn

**Decision.** A condition's duration counts down when the round advances, not
at a specific point inside the affected creature's turn.

**Why.** This is a deliberate simplification of the rules, taken for two
reasons. "Three rounds left" is what actually gets said at the table, so the
counter matches the language. And a counter that only moves on one combatant's
turn looks broken when the DM glances at the list — every other row's number
sits still while one ticks, which reads as a bug rather than as precision.

**What it costs.** A condition that should end at the start of its caster's
next turn will expire up to one turn late or early depending on initiative
order. Accepted: the DM is watching, and can clear it by hand.

**Indefinite is the default.** An absent duration means the condition lasts
until it is removed. Most conditions at the table are like this — Prone lasts
until someone stands up — and inventing a number for them would be worse than
tracking none.

---

## 21. Combat is started and ended explicitly, not implied by the turn counter

**Decision.** "Roll for initiative" opens a dialog listing every combatant with
a number field beside their name — monsters prefilled with the roll the tool
made for them, players blank — and submitting it writes the whole order and
opens round one. "End combat" stops the fight and leaves the board alone.

**Why.** Starting a fight used to be a side effect of pressing "Next turn" when
the round was zero, and ending one was only possible by clearing the monsters.
Both were wrong about what happens at a table. Initiative is a moment: the DM
goes round asking what everybody rolled, and there is no point in the app where
that number can be typed except by editing each row afterwards. And a fight
ends long before the bodies are cleared — there is looting, and the XP readout
is still worth reading.

**Why one write, not one per row.** The initiatives arrive together so the
encounter never sits in a state where half the party has rolled. It also means
the turn pointer can be placed by reading the resulting order back, rather than
inferred from the input.

**What ending does not do.** It does not remove anyone. `clearNonPlayerCombatants`
is still the separate, deliberate action it always was. Ending only resets the
round counter and the turn pointer, and releases anyone still holding their
action — a delay means nothing once there is no order to re-enter.

---

## 22. Saved encounters store composition, not a snapshot

**Decision.** A saved encounter is a name plus "how many of each creature". It
holds no hit points, no initiative, no conditions and no player characters.
Applying one rolls fresh initiative and starts every monster at full health.

**Why.** The thing worth keeping between sessions is "the ambush at the bridge
is four goblins and a hobgoblin", not the state of one evening's dice. A
snapshot would restore a half-dead goblin into a fight it has no business being
in, and would need a policy for what happens when the library is re-imported
underneath it. Counts sidestep both.

**Why the party is excluded.** For the same reason `clearNonPlayerCombatants`
exists: the party is a roster that outlives every fight (#14). A preset that
carried player characters would fight with the roster over who owns them.

---

## 23. The library imports itself on first boot

**Decision.** After migrations, an instance whose `creatures` table is empty
imports the library before it accepts requests. `LIBRARY_AUTO_IMPORT=false`
opts out.

**Why.** The library cannot be baked into the image: it lives in the campaign
database, and that database is a volume created at `docker run` time. That left
`pnpm db:import`, which is not a thing you can ask of someone whose only
dependency is Docker — it needs a clone, pnpm, and a shell inside the running
container. Boot is the one moment where the volume exists and the app is in
charge of it.

**Why awaited rather than backgrounded.** So that a boot which finishes has a
library, and so a failure surfaces at the point it happened rather than as an
unhandled rejection later. Next.js may already be serving while `register` runs,
so on a first boot the creature browser can show its empty state for a few
seconds before the import lands — acceptable, and self-explaining. Every boot
after the first is a single `count(*)`.

**Why it cannot fail the boot.** A failed import logs, records itself in
`import_runs`, and lets the server start. The creature browser already has an
explanatory empty state, and a toolbox that will not start because GitHub is
down is worse than one with no monsters in it.

**Refreshing is still manual.** The guard is "is it empty", not "is it stale",
so an existing instance does not silently re-fetch on every restart. `pnpm
db:import` re-runs the upserts when a refresh is actually wanted.

---

## 24. Spells are imported alongside the creatures

**Decision.** `Spell.json` and `SpellCastingOption.json` are imported into
`spells` and `spell_casting_options`, and `library.listSpells` / `getSpell`
read them. The Spells tab that will use them is not built yet.

**Why.** Open5e's `data/v2/wizards-of-the-coast/srd-2024` holds far more than
creatures. Surveying it, the files fall into three groups:

- **Worth importing now.** `Spell` (339) and `SpellCastingOption` (671). Same
  document, same licence, same fetch, and the one lookup a DM reaches for
  mid-session that the toolbox could not answer.
- **Worth importing when something reads it.** `Rule` (56) and `RuleSet` (11)
  are the rules text; the small `*Description` files — `Condition` (already in),
  `DamageType` (13), `Skill` (18), `Ability` (6), `CreatureType` (14),
  `Alignment` (9) — are one-line glossary entries that would make statblock
  terms explainable in place. Cheap, but dead weight until there is a surface
  for them.
- **Out of scope.** `MagicItem`, `Item`, `Weapon`, `Armor`, `Background`,
  `CharacterClass`, `ClassFeature`, `Feat`, `Species` are character-building
  and treasure data. This is a DM's combat toolbox, not a character builder.

**Why import spells before the page exists.** The import is the part that has
to be right and is expensive to change — schema, mappers, upserts, a migration.
Doing it with the creature import means one pipeline and one `import_runs` row
rather than a second one bolted on later.

**One deviation from the mirror.** `material_cost` is null in every upstream
record and is not mirrored, the same way `proficiency_bonus` is not on
creatures (#17).

---

## 25. Navigation is a vertical tool rail, and there is no campaign header

**Decision.** A vertical icon rail down the left edge, one entry per tool.
Initiative is the only one built; Maps and Spells are on the rail but disabled.
The campaign name banner and the on-screen SRD attribution are both gone.

**Why a rail.** The toolbox is about to stop being one tool. The virtual
tabletop is the next thing to come in, and a rail that already has a slot for
it costs nothing now and avoids a layout change later.

**Why the unbuilt tools are visible.** They say what this is going to be, which
is worth something on a tool you run for yourself. They render disabled and
say so, because a nav item that silently does nothing is worse than one that
explains itself.

**Why the header went.** One container serves one campaign. A banner repeating
the campaign name every time the DM looks at the screen was chrome, not
information — it is still in the browser tab title, which is where it is
actually useful when three campaigns are open.

**Where the attribution went.** SRD 5.2 is CC-BY-4.0 and the credit is a
licence obligation, so it moved to the README rather than disappearing. The
obligation is to credit, not to credit in a footer of every screen.

---

## 26. The player-view lens is always draggable, wheel-zoomed, and live

**Decision.** The second screen's map view is controlled by a "lens": a
rectangle drawn directly on the DM's own canvas, independent of their own
pan/zoom. It is stored as a viewport (`playerViewportX/Y/Zoom`) on the
`map_sessions` singleton, the same table that also holds the DM's own
viewport (persisted so it survives a restart) and the three-way
`playerScreenMode` toggle (map/tracker/both). The lens is always visible and
always grabbable — there is no "edit mode" to switch into first — and a lock
button in the map control rail blocks grabbing it without hiding it. Dragging
the rect's body moves it; scrolling the wheel while the cursor is over it
zooms it (the same wheel-zoom gesture the DM's own viewport already has,
redirected to the lens). Both go through the DM's canvas exactly once each
edit cycle: a first pass built this as corner-handle drag-resize gated behind
an explicit "Edit player view" toggle, committed once per gesture on
pointerup — a plausible design on its own, but built without checking it
against the source VTT app
this tool is ported from. A direct comparison against
`RamonGebben/Kernels-Virtual-Table-Top`'s `ViewportCanvas`/`useSessionState`
turned up three divergences worth correcting, below.

**Why a lens rather than a push button.** A "push my current view" button was
the cheaper option — no new drag interaction, no aspect-ratio math — but it
means the DM's own navigation and what the table sees are the same thing,
which they often aren't: a DM zoomed in to paint fog or check a monster's
position would drag the table's view along with them. The lens decouples the
two, matching the source app's original behavior. This part of the original
design held up and is unchanged.

**Why there's no edit-mode gate.** The source app's lens is always draggable
directly on the canvas; its wire protocol has a `locked` field that is never
wired to any button (dead code). Gating the lens behind a click-to-enter
"Edit player view" mode was friction the original never had. The gate is
removed; a lock button is kept as a small deliberate improvement over the
original, since — unlike the dead `locked` field it's modeled after — it
actually does something.

**Why the resize gesture is the wheel, not corner handles.** The original has
no drag-resize at all: scrolling while the cursor is over the lens zooms it,
mirroring the DM's own wheel-zoom over the rest of the canvas. Since the lens
is fundamentally a second viewport (`{x, y, zoom}`) rendered as a rect via
`computeLensRect`, wheel-zoom is the natural fit — uniform scaling
automatically preserves the player screen's aspect ratio, no forcing needed,
and no new UI affordance (handles) has to be discovered. `~/utils/mapLens`
composes this from the same `zoomAtPoint` the DM's own wheel-zoom already
uses (`zoomLensAtPoint`), not a new resize algorithm.

**Why the lens updates live, not just on release.** The original calls back
on every pointer move — cheap, since it's an in-memory WebSocket broadcast
with no persistence. This app's session state is SQLite-backed via tRPC, so a
literal unthrottled per-pointermove mutation would reintroduce the class of
chatty-write problem the canvas's own pan/zoom rendering fix eliminated. The
resolution: `MapCanvasView`'s existing RAF-notify pattern (already used for
`onViewportChange`) is reused for the lens — diffed and reported at most once
per animation frame while a drag is in progress, plus one final commit on
pointerup as a safety net. This reads as live to the DM (indistinguishable
from unthrottled at animation-frame cadence) while bounding the worst case.
Wheel-driven zoom fires per wheel tick, unthrottled, matching the original —
wheel events are already naturally infrequent, so there's nothing to batch.
This is a deliberate, accepted increase in write volume for this one
interaction relative to the gesture-batched fog/calibration flows and the
DM's own 800ms-debounced viewport — the app is a single DM on a local
network, so the absolute load stays trivial.

**Architectural consequence.** The three settle-cadences this app uses for
continuous DM interactions are now: frame-coalesced-and-live (the lens, while
dragging), gesture-committed (fog strokes, grid calibration), and debounced
settle-persistence (the DM's own viewport, ~800ms). Which one a future
continuous interaction should use depends on whether the _other_ screen needs
to see it move live (frame-coalesced), only needs the end state (gesture-
committed), or only needs to survive a restart (debounced). `FogControlsPanel`'s
still-unbatched opacity/brush sliders remain a noted, unaddressed follow-up.

## 27. The ruler and spell-area templates measure in grid squares, not pixels

**Decision.** `~/utils/mapMeasurement` computes a placed shape's size as 5e's
tabletop convention — grid-square counting, where a diagonal move costs the
same as an orthogonal one (Chebyshev distance in grid cells, `computeGridDistanceFeet`)
— rather than true Euclidean distance. This is a deliberate divergence from
every other piece of geometry on this canvas: `~/utils/mapViewport` and
`~/utils/mapLens` are pixel-accurate, because a viewport or a lens rectangle
has no tabletop meaning to be faithful to. A ruler does — two DMs disagreeing
by ~40% (a diagonal-heavy Euclidean line vs. the tabletop count) on whether a
15-foot spell reaches a target is a worse bug than a viewport being a few
pixels off ever could be. Only the _origin_ snaps outright (to the nearest
grid intersection, `snapPointToGrid`); a cone/line/cube's _orientation_ stays
a free angle — only its distance component is grid-counted — so a DM can aim
a cone at 37° without the tool rounding it to the nearest axis.

**Why a `presetExtentFeet` mode instead of only free-drag.** The placement
gesture is a two-click drag (origin click, live-follow, confirm click) —
necessary for a ruler, which has no size of its own to offer a shortcut for.
But most of what actually gets placed is a spell's _known_ area (a 20-foot
fireball, not "however big I eyeball it"), and eyeballing a precise 20-foot
circle by dragging against an uncalibrated cursor is exactly the friction the
5e-preset buttons and spell lookup exist to remove. Rather than a second,
parallel placement mode, a size preset (from the panel's preset buttons, or
auto-filled by picking a spell via `mapSpellShapeType`) changes what a single
click _means_: it commits immediately, at that exact size and a default 0°
orientation, instead of arming the two-click gesture. `presetExtentFeet: null`
("Custom") is what re-arms free-drag. A `ruler` ignores a preset outright —
see above, it always needs two points.

**Why the live-drag preview is a `map_sessions` column, not a broadcast
channel.** Issue #1 calls for the player screen to track a shape while the
DM is still aiming it, the same as the lens (#26). The lens already proved
the pattern for exactly this: a value written to the `map_sessions` singleton
row, at most once per animation frame via `MapCanvasView`'s existing
RAF-notify scheduler, and read back out through `toPlayerMapView`/SSE.
`livePreviewShape` (nullable JSON) reuses that pattern outright rather than
inventing a second live-update mechanism — cleared back to `null` once the
confirming click lands (or the placement is abandoned with a right-click),
which the RAF diff loop notices and broadcasts on its own, the same way a
lens drag's every frame is diffed against the last one sent.

## 28. A placed shape's hit test runs, and wins, ahead of the lens/tracker

**Decision.** Selecting and dragging an already-placed measurement shape
(#27) needed a click-to-grab hit test on the canvas — the same kind of
"which thing under the cursor wins" problem the fog brush and grid
calibration already solved by gating the lens/tracker's own hit tests with
`!isFogToolActive()`/`!calibrationActiveRef.current`. `useViewportInteraction`
now computes `findHitMeasurementShape(mapPoint)` once at the top of
`handlePointerDown`, ahead of the tracker/lens checks, and adds `!hitShape`
to both their guard conditions — a placed shape under the cursor wins the
same way an active tool already did.

**Why this needed a real dev-server session to catch, not just stories.**
The first implementation added the shape hit test in its own branch,
positioned _after_ the lens/tracker checks — reasonable on paper, wrong in
practice. `map_sessions`' player-view lens defaults to an **uncalibrated,
screen-sized rect** (`computeLensRect` off the session's own defaults:
`playerViewportZoom` 1, `playerScreenWidth`/`Height` 1920×1080) whenever a
DM hasn't yet deliberately positioned it — which is every fresh session, and
every Storybook fixture that doesn't explicitly set a small `lensRect`. That
default rect is enormous relative to a freshly uploaded, uncalibrated map, so
it blankets almost any point a DM would actually click. Every interaction
story for this feature passed regardless, because none of them exercised the
combination of "a lens rect present" and "a shape under the click" at once —
the existing `MeasurementToolTakesPriorityOverTheLens` story covers the
_armed placement_ case, not the _disarmed select-and-drag_ case. The bug was
only visible by actually driving a build against a live `pnpm start` session
end to end: placing a shape, then dragging it, and watching nothing move.

**The general lesson.** A synthetic-event story proves a specific
interaction works in isolation; it does not prove the _priority order_
between two interactions is correct unless a story explicitly stages both
conditions at once — and a "the lens is drawn but tiny/off-screen in this
fixture" default is an easy thing to never stage. `SelectingAndMovingAPlacedShapeWinsOverTheLens`
now stages both deliberately (a `lensRect` fixture plus a shape positioned
inside it) specifically so this regression can't silently return. For any
future canvas interaction that adds a new hit-testable "thing" to this
canvas, the checklist is: where does it sit in the existing priority chain
(fog/calibration → measurement placement → shape select → lens → tracker →
pan), and is there a story that stages a spatial overlap with each of the
things ranked above and below it in that chain — not just a story proving
the new interaction works when nothing else is present.

## 29. Animated spell effects: a curated subset, fetched at runtime, never vendored

**Decision.** A placed measurement shape sourced from a spell (issue #1's
follow-up) can play a short animated video clip instead of its plain static
footprint. The clips come from
[`jackkerouac/animated-spell-effects`](https://github.com/jackkerouac/animated-spell-effects)
(GPL-3.0, ~1.25GB, transparent WebM). Exactly like the Open5e library
(DECISIONS #12), the clips are fetched at library-import time into the
campaign volume — never vendored into this repo's git history and never
baked into the Docker image. Unlike the Open5e library, only a small,
hand-picked subset is ever fetched: `~/server/library/effectCandidates`
matches at most one clip per (damage type, area shape) combination, not per
spell, and most spells (anything with no damage type, or a shape this
feature doesn't model) get none at all. In practice this means a few dozen
clips total, not several hundred — a materially different footprint from
"the whole repo," which is what makes fetching it automatically on first
boot (mirroring `LIBRARY_AUTO_IMPORT`) a reasonable default rather than
something that needed its own opt-in flag.

**Why there's no per-spell mapping in the source repo to lean on.** It was
checked before building anything: the repo is a general library of ~400
elemental VFX clips grouped by theme (`fire/`, `ice/`, `lightning/`, …),
tagged only with a shape suffix (`_CIRCLE_`/`_CONE_`/`_RAY_`/`_SQUARE_`), not
a spell compendium — not even in its own Foundry VTT module manifest
(`scripts/effects.js`), which carries only generic labels like "FIRE -
Explosion 01". `EFFECT_CANDIDATES` is therefore hand-curated data, not a
runtime folder/keyword matcher: reviewable as code, and immune to silently
picking a different file if the upstream listing is ever reordered.
Deliberately excluded: bludgeoning/piercing/slashing damage, which has no
elemental theme to match — the same "no good match, so no guess" rule
`mapDamageTypesToColor` already follows for a shape's colour.

**Why content-addressed storage.** Many spells commonly match the exact same
clip (every fire-damage circle spell, for instance), so `spell_effects` rows
are deduplicated by hashing the clip's upstream path
(`~/utils/effectStorage`) into its on-disk filename — one download and one
file no matter how many spells reference it, rather than one copy per spell.

**Why a licence stronger than the SRD's CC-BY-4.0 matters here.** GPL-3.0 is
copyleft in a way CC-BY isn't. The non-vendoring pattern that already existed
for the SRD library turns out to be exactly the right shape for this too:
nothing GPL-licensed ships as part of this project's own distribution (the
git repository or the Docker image) — a campaign's Docker volume fetches it
for itself, the same as it fetches its own creature and spell data. Credited
in the README per the licence's own requirement, the same way the SRD's
CC-BY-4.0 credit already is.

**Why a spell's effect never fails the library import.** `importSpellEffects`
catches per-spell (a flaky fetch, a write error) and the outer
`importLibrary` call wraps the whole step in its own `try`/`catch` — a
network hiccup fetching video must never turn a `pnpm db:import` or a first
boot's automatic import that would otherwise have succeeded into a failed
one. An animated effect is a bonus layered onto a working text library,
never a reason to leave one half-imported.

---

## 30. The creature library pulls from multiple Open5e documents, not just the SRD

**Decision.** `importLibrary` now loops over `CREATURE_LIBRARY_SOURCES`
(`~/server/library/source.ts`) — the SRD plus seven supplementary
bestiaries — fetching `Creature`/`CreatureAction`/`CreatureActionAttack`/
`CreatureTrait` from each and merging the results before writing. Conditions
and spells stay SRD-only, fetched from `SRD_SOURCE` alone. The added
sources: EN Publishing's _Monstrous Menagerie_ (A5E), five Kobold Press
volumes (_Tome of Beasts_, its 2023 edition, _2_, _3_, and _Creature
Codex_), and Green Ronin's _Tal'Dorei Campaign Setting_.

**Why.** A DM went looking for the Banshee and it wasn't in the SRD-only
library — Open5e has it, just under a different document
(`en-publishing/a5e-mm`). Surveyed before building anything: every one of
these documents' `Creature.json` (and its three sibling files) share the
exact same field shape the SRD's own fixtures already use — a diff against
the SRD's keys came back empty for all seven. Nothing in `fixtures.ts`'s zod
schemas or any mapper needed to change; only the fetch loop and the upstream
path did.

**Why creatures only, not the whole document.** The same reasoning as
DECISIONS #24: this is a combat toolbox, not a character builder, and every
condition a monster can inflict is already in the SRD's own glossary. None
of these seven sources publish a `Spell.json` worth pulling from either —
most don't have one at all.

**Why the licence matters here.** All seven are OGL 1.0a, not the SRD's
CC-BY-4.0 — a different attribution mechanism (a Section 15 copyright
notice naming every contributing work, not a simple credit line). The
README's "Open Game License content" section carries it, built from each
document's own `Document.json` (`name`, `author`, `publication_date`) at the
time this was written — those fields are static prose in the README, not
generated at import time, since the whole point of a Section 15 notice is
that it names what's actually in the product, not what upstream might
publish next.

**Why a source can be missing a file without breaking the import.** Tome of
Beasts 3 has no `CreatureActionAttack.json` upstream at all — a plain 404,
not a broken document. `loadFixture` takes an `optional` flag for exactly
this: a 404 on an optional file returns an empty list instead of throwing,
so one source's gap in structured attack data can't fail the other six.

**Why Kobold Press's 5e-2014 stat blocks were still worth including.** Their
`Document.json` reports `gamesystem: "5e-2014"`, not `"5e-2024"` like the
rest of this library — an older ruleset's monster math, mixed into a
2024-rules toolbox. Accepted deliberately: monster stat blocks are largely
edition-stable in practice (attack bonuses, hit points and saves don't move
much between 2014 and 2024 5e), and a DM reading a slightly-off-edition stat
block at the table can adjust it on the fly far more easily than they can
work with no stat block at all.

---

## 31. Self-centered spells get a shape override; following the caster stays manual

**Decision.** `~/server/library/selfEmanationSpellShapes` hand-curates a
shape/size for eleven SRD spells — Spirit Guardians among them — that
Open5e's `Spell.json` leaves shapeless, applied in `toSpellRow` at import
time. The measurement tool gets no new "attach to a moving anchor" concept:
a DM places one of these the same way as any other spell template, then
drags it (the existing drag-to-move gesture) to keep it over their token as
it moves.

**Why the shape needed curating at all.** Every "Self"-range spell whose
area is only described in prose — "flit around you in a 15-foot Emanation"
— has `shape_type: null, shape_size: null` upstream. `useMeasurementControls`
already drops any spell missing either from its picker, so Spirit Guardians
was never merely unsupported — it was invisible. Found by grepping the
SRD's own `desc` text for "N-foot Emanation" on every spell upstream left
shapeless: eleven matches, spot-checked against their full description to
rule out an incidental mention. `mapSpellShapeType` already mapped
`'emanation'` onto the tool's `circle` (nothing upstream had ever set that
value, so it was an untested branch) — filling in the shape at the source
was enough to make the picker, placement, and `importSpellEffects`'s
animation matching all work unchanged.

**Why manual dragging instead of building "follow the caster."** There is
no token or per-combatant position anywhere on the map — the tracker overlay
is a read-only UI panel, not a positioned pog, and nothing in
`map_measurement_shapes` references a combatant. Automatic following needs
something to follow, and building that (a token layer: schema, drag/hit-test
on both canvases, live broadcast, tracker-to-map linking) is a project on
the scale of everything else in this document combined, not a measurement-
tool tweak. Asked directly rather than assumed either way: ship the
placeable, animated shape now: with drag-to-move already built, "the DM
nudges it each round" costs nothing new to support, and revisit true
token-following if a real token layer gets built for its own sake.

---

## 32. The party gets its own page; the tracker only picks from it

**Decision.** A Party tool on the rail (`/party`) is now the one place
characters are created, edited, benched and removed, alongside a shared
party treasury. The tracker's Characters tab became a pick list: a per-row
Add, an "Add all active" button, and an Edit that is a _link_ to
`/party?edit=<id>`, never a form of its own. One party per campaign — a
singleton `parties` row (`CURRENT_PARTY_ID`), the same shape as `encounters`
(#14) — holds what belongs to the group; members are simply every live
`player_characters` row.

**Why move management out of the tracker.** The bastion tracker needs the
same characters (owners, class-based facility prerequisites), and a
roster that lives inside the combat tool's left panel would either be
duplicated or reached into from a tool it has nothing to do with. The
tracker's own need is narrower than "manage the party": on the night, pick
who is at the table.

**Why the editor is URL-driven.** `?edit=<id>` (or `?edit=new`) is the only
state that opens the modal — `toPartyEditorTarget` resolves it against the
roster. That is what lets the tracker's Edit button deep-link into the right
character, and makes an open editor survive a reload. It is the app's first
URL-held UI state; everything else stays in component state or a zustand
store, because nothing else needs to be linkable.

**Benched is not absent.** `isActive` is stored, for someone who left the
group, retired, or died: they drop out of the tracker's pick list and "Add
all active", and stay on the record. Being sick for one session is never
stored — the DM just doesn't add them that night. Recording per-session
attendance was considered and rejected as bookkeeping with no consumer.

**Gold lives in one place: the party treasury.** Characters have no purse.
A per-character purse was built and then taken out at the DM's request:
keeping every player's coins current is bookkeeping the DM does not want to
do, and the players track their own. The treasury is the one number the DM
does keep, so bastion costs and income will go through it. It is whole gold
pieces and never goes negative — `applyGoldChange` refuses an overdraft
rather than clamping, so the DM finds out instead of the party silently
paying less.

**Class is a fixed list; subclass and species are free text.** Class is one
of the twelve SRD classes because bastion prerequisites will key off it.
Subclass and species are suggestions only (`~/content/characterOptions`): a
table's subclass is usually a PHB one, and PHB species are not in the SRD.
A multiclass character records their main class and the rest in notes.

---

## 33. Bastions: the catalog ships in the repo, the rules advise, the treasury pays

**Decision.** The Bastions tool (`/bastions`, 2024 DMG chapter 8) tracks one
bastion per character: special facilities, basic facilities, defenders,
walls, construction and a storage log. The 29 core special facilities and
the building tables are static content in `~/content/bastion`. Facility
level, prerequisite, duplicate and allowance rules are checked by
`findEligibilityProblems` and refused by the server — unless the DM ticks an
explicit "ignore the rules". Construction is paid up front from the party
treasury and finishes after a number of days.

**Why the catalog is in the repo, in our own words.** Bastions are not in
SRD 5.2 or 5.2.1, and no open-licensed dataset carries them (Open5e,
5e-database and Foundry's packs were all checked), so there is nothing to
import. Asked directly, the DM chose bundling over typing the catalog in by
hand. Because the repository is public, the catalog is written as a cheat
sheet: every number the rules run on (costs, dice, durations, capacities,
level scaling) with one- or two-line summaries in our own words — never the
book's text. Setting-book facilities (Faerûn, Eberron, Ravenloft) are left
out.

**Why prerequisites are advice the DM can override.** A prerequisite like
"can use a Holy Symbol as a Spellcasting Focus" is checked by class
(`~/content/bastion/prerequisites`), which is only an approximation — a
feat, a subclass or a magic item can grant it too. The same goes for the
allowance when a DM hands out an extra facility as a quest reward. So the
server refuses by default, with the reasons, and accepts an explicit
`ignoreRequirements`: the rules are the default, never a wall.

**Why construction is a project row.** Adding a basic facility, enlarging
one, enlarging a special facility and building walls all cost gold now and
pay off later. One `bastion_projects` table holds all four, with
`daysRemaining`, so the coming bastion-turn wizard counts down one list and
reports what finished. The DM can finish a project on the spot or cancel it
for a full refund. The spend is one guarded `UPDATE … WHERE treasury_gold >=
cost`, not a `transaction()`: libsql hands a transaction its connection,
which on the in-memory test databases leaves later queries on a fresh,
empty one.

**Calls the book leaves open.** Enlarging a special facility has a cost
(2,000 GP) but no build time; we borrow the basic Roomy → Vast step's 80
days. Defenders are one count per bastion rather than per Barrack — the
attack maths only ever needs the total — with the barracks' capacity shown
as a guide, not a cap, since a guest mercenary needs no bunk.

**Left for later.** Orders, Maintain events and attacks belong to the guided
bastion turn. One bastion shared by the whole party is #34. Named hirelings
are not tracked — only the count each facility comes with.

---

## 34. One bastion for the whole party, as a campaign setting

**Decision.** `parties.bastion_mode` is `'per-character'` (the 2024 default)
or `'party'`. In party mode there is one live bastion with no owner
(`bastions.owner_character_id` is null): the party holds it. Each special
facility records the member who holds it (`holder_character_id`), every
member's allowance is checked separately, and each member brings their own
two free rooms (`contributed_by_character_id`) — which is what makes the
shared bastion bigger. Defenders are one pool.

**Why it was built before the bastion turn, not after.** It was first
planned as the last bastion milestone. That was the wrong order: a model
with one owner per bastion has nowhere to say which member holds a facility,
and the bastion turn — where each member takes their own turn and rolls
their own Maintain event — is built on exactly that.
Ownership had to be settled first.

**Why allowances are per member but facilities are shared.** Each character
still gets their two facilities at level 5 (and more as they level), so a
facility records who took it and counts against _their_ allowance. But the
bastion keeps **one of each facility type, for everyone**: one Library, one
Arcane Study, whoever took it. Only Barrack, Garden, Stable and Training
Area may repeat, as the rules allow. `findEligibilityProblems` therefore
checks level, prerequisite and allowance against the member taking it, and
duplicates against the whole bastion. In the bastion turn any member at
home may give any facility its one order (#35).

This replaced a first version where each member could hold their own copy
of anything; asked directly, the DM wanted one shared facility of each kind.
Merging per-character bastions into the party's can still bring two copies
together — the second is flagged on its card for the DM to remove, never
dropped silently.

**Why defenders pool.** Under the combined-bastion rules any member may
absorb another's defender losses, which makes separate rosters bookkeeping
with no effect. Asked directly, the DM chose one pool.

**Why switching merges and splits rather than refusing.** A campaign may
start one way and change its mind. Switching to party mode merges every
bastion into one (`planBastionMerge`: defenders and walls add up, notes are
kept); switching back splits it by holder (`planBastionSplit`): each
facility to its holder, each room to whoever brought it, an enlargement to
the owner of what it enlarges, and everything else — defenders, walls,
storage, unclaimed rooms — to a keeper the DM picks, defaulting to whoever
holds the most. Nothing is lost either way. Both planners are pure; the
resolver only re-points rows.

**Late joiners.** A member who reaches level 5 after the party bastion was
founded is listed in `pendingFreeRooms` and the page offers to add their
two rooms, once.

**A migration fixed by hand.** `0021` rebuilds `parties` to add the mode's
check constraint, and drizzle-kit generated a copy step that read
`bastion_mode` from the old table, which does not have it. The generated
SQL was corrected, and a backfill was added so existing bastions' owners
hold their facilities and brought their rooms. Tested against a database
migrated to `0020` with data in it.

---

## 35. The bastion turn is a guided wizard over a saved draft

**Decision.** A bastion turn is seven days for every bastion in the campaign
at once, run as a five-step wizard: _Since last turn_ (finished work and
what it produced), _Who's home_, _Orders_, _Bastion Events_, _Review_. The
wizard's state is a `bastion_turns` row with `status = 'draft'` and the
choices as JSON (`turnDraftSchema`), saved at every step; committing applies
it and keeps a summary as history. One draft at a time (a partial unique
index).

**Why a wizard.** Asked for directly: at the table the DM asks the players,
types in what they say and roll, and moves on. Every step says whom to ask
for what ("Ask Wren's player to roll for the Bastion Event"); each Bastion
Event then asks for exactly its own dice and choices.

**Why a saved draft, not client state.** A turn takes a while at the table.
A refresh, a closed laptop or a second device must not lose it, and nothing
should change until the DM commits. The draft is the whole wizard; discarding
it changes nothing.

**Why dice are entered, "roll for me" is the fallback.** The players roll
real dice. `DieInput` is a box for what they rolled with a "Roll for me"
button for anyone not at the table — never the default.

**Why the draft stores outcomes, not event logic.** Each event's dice and
choices sit in `inputs`; one pure function, `resolveEventOutcome`, turns them
into plain outcomes — gold in and out, defenders gained and lost, a facility
put out of action, an item stored. `planTurnCommit` (pure, server-side) then
applies outcomes without knowing one event from another, and the review
step runs the very same planner through `bastionTurns.preview`, so what the
DM approves is what happens.

**Orders are generic on purpose.** A facility order is an option from the
catalog plus a cost (prefilled, editable) and a free-text detail. It runs
for the option's days — 7 when the book times it some other way — and when
it finishes, the next turn's first step asks what it produced: an item for
storage, gold earned, defenders recruited. Encoding every facility's own
dice (a Gaming Hall's winnings, a Theater's checks) would multiply the
catalog for little gain; the DM reads the option's summary and types the
result.

**What a commit does, in order.** Seven days pass: construction and running
jobs count down, finished construction is applied (`completeProject`, shared
with the bastion page's "Finish now"), out-of-action facilities recover a
turn. New orders start and are paid from the treasury. Then the events land.
An Attack uses up a stocked Armory and a friendly-monster guest. The gold is
spent first, through the guarded treasury update, so a short treasury
refuses the turn before anything else changes.

**In a party bastion** every member takes the turn in their own right: their
own presence and their own Maintain event. Facilities are shared (#34), so
the orders step lists every facility once and any member at home can give
it its one order — the one who took it by default, the DM picks otherwise.
The defender pool is shared too.

**Left out.** Neglect (a bastion lost after a character's level in turns
without orders) is not tracked. War Room lieutenants do not reduce attack
dice automatically — the dice count is shown, and the DM enters the result.
