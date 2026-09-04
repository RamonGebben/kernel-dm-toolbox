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
