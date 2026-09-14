import 'server-only';

import { and, eq, inArray, isNull } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { progressionForClass } from '~/content/classProgression';
import {
  creatureActionAttacks,
  creatureActions,
  creatureTraits,
  creatures,
  customCreatureActionAttacks,
  customCreatureActions,
  customCreatureTraits,
  customCreatures,
  playerCharacterActionAttacks,
  playerCharacterActions,
  playerCharacterSpellSlots,
  playerCharacterSpells,
  playerCharacters,
  simulatorScenarioMonsterEntries,
  simulatorScenarioPartyMembers,
  simulatorScenarios,
  spells,
} from '~/server/db/schema';
import type { Database } from '~/server/db';
import { buildCombatantNames } from '~/utils/buildCombatantNames';
import {
  DEFAULT_GRID_COLS,
  DEFAULT_GRID_ROWS,
  autoPlacePositions,
  type GridCell,
} from '~/server/simulator/engine/grid';
import { toEngineAction } from '~/server/simulator/engine/toEngineAction';
import { toEngineActionFromSpell } from '~/server/simulator/engine/toEngineActionFromSpell';
import {
  toEngineSaveModifiers,
  toPlayerCharacterSaveModifiers,
} from '~/server/simulator/engine/toEngineSaveModifiers';
import type {
  EngineAction,
  EngineCombatant,
} from '~/server/simulator/engine/types';

/** A combatant before auto-placement has run — everything an
 * `EngineCombatant` has except a guaranteed `position`, since a DM-chosen
 * placement is optional right up until `withAutoPlacement` fills the rest
 * in. Kept as its own type rather than widening `EngineCombatant.position`
 * to `GridCell | null` everywhere, since every other engine module can
 * then keep assuming a combatant is always somewhere on the board. */
type UnplacedCombatant = Omit<EngineCombatant, 'position'> & {
  position: GridCell | null;
};

/** SRD's near-universal count for a creature with a Legendary Resistance
 * trait — the trait's own prose ("Legendary Resistance (3/Day)") carries
 * the real number, but this engine doesn't parse trait descriptions, only
 * detects the trait's presence by name. Documented simplification, not an
 * oversight. */
const DEFAULT_LEGENDARY_RESISTANCES = 3;
/** 5e's universal default for a PC with no stored speed — `player_characters`
 * has no speed column at all (issue #5's own "Current state" section never
 * added one). */
const DEFAULT_SPEED = 30;

/** How many attacks a PC's Attack action grants at its current level, per
 * `classProgression`'s hand-authored per-class table — 1 for a PC with no
 * class applied yet, or a level outside the table's 1-20 range (clamped
 * rather than indexing out of bounds). See `EngineCombatant.attacksPerTurn`'s
 * own doc comment for why monsters don't get an equivalent lookup. */
const attacksPerTurnForPc = (
  characterClassSlug: string | null,
  level: number,
): number => {
  if (!characterClassSlug) return 1;
  const progression = progressionForClass(characterClassSlug, null);
  if (!progression) return 1;

  const clampedLevel = Math.min(Math.max(level, 1), 20);
  return progression.attacksPerActionByLevel[clampedLevel - 1] ?? 1;
};

const hasLegendaryResistance = (traits: readonly { name: string }[]) =>
  traits.some(trait => /^Legendary Resistance/i.test(trait.name));

/** Resolves a creature's raw "Multiattack" action row (if one exists, and
 * `parseMultiattackSequence` parsed it — issue #5, milestone 9) into
 * `EngineCombatant.multiattackSequence`'s own `{actionId, count}[]` shape,
 * matching each parsed `actionName` against this same creature's already-
 * built `EngineAction[]` by name. An entry that doesn't match anything (or a
 * creature with no parseable Multiattack at all) contributes nothing —
 * `runEncounter.ts` falls back to normal single-attack selection either
 * way, matching `multiattackSequence`'s own schema doc comment. */
const resolveMultiattackSequence = (
  actionRows: readonly {
    name: string;
    multiattackSequence: { actionName: string; count: number }[] | null;
  }[],
  actions: readonly EngineAction[],
): { actionId: string; count: number }[] | null => {
  const multiattackRow = actionRows.find(
    row => row.name === 'Multiattack' && row.multiattackSequence,
  );
  if (!multiattackRow?.multiattackSequence) return null;

  const resolved = multiattackRow.multiattackSequence
    .map(entry => {
      const action = actions.find(
        a => a.name.toLowerCase() === entry.actionName.toLowerCase(),
      );
      return action ? { actionId: action.id, count: entry.count } : null;
    })
    .filter(
      (entry): entry is { actionId: string; count: number } => entry !== null,
    );

  return resolved.length ? resolved : null;
};

const loadPartyCombatants = async (
  db: Database,
  scenarioId: string,
): Promise<UnplacedCombatant[]> => {
  const members = await db
    .select()
    .from(simulatorScenarioPartyMembers)
    .where(
      and(
        eq(simulatorScenarioPartyMembers.scenarioId, scenarioId),
        isNull(simulatorScenarioPartyMembers.deletedAt),
      ),
    );

  if (!members.length) return [];

  const pcIds = members.map(member => member.playerCharacterId);
  const pcRows = await db
    .select()
    .from(playerCharacters)
    .where(
      and(
        inArray(playerCharacters.id, pcIds),
        isNull(playerCharacters.deletedAt),
      ),
    );
  const pcById = new Map(pcRows.map(row => [row.id, row]));

  const [actionRows, attackRows, spellRows, slotRows] = await Promise.all([
    db
      .select()
      .from(playerCharacterActions)
      .where(
        and(
          inArray(playerCharacterActions.playerCharacterId, pcIds),
          isNull(playerCharacterActions.deletedAt),
        ),
      ),
    db
      .select()
      .from(playerCharacterActionAttacks)
      .where(isNull(playerCharacterActionAttacks.deletedAt)),
    // Only a prepared spell is castable this fight — a known-but-unprepared
    // row (a prepared caster who swapped it out) stays on the PC's sheet for
    // next time but isn't an option here, matching the same "known/prepared"
    // distinction the class wizard already tracks.
    db
      .select({
        playerCharacterId: playerCharacterSpells.playerCharacterId,
        isAlwaysAvailable: playerCharacterSpells.isAlwaysAvailable,
        spell: spells,
      })
      .from(playerCharacterSpells)
      .innerJoin(spells, eq(playerCharacterSpells.spellSlug, spells.slug))
      .where(
        and(
          inArray(playerCharacterSpells.playerCharacterId, pcIds),
          isNull(playerCharacterSpells.deletedAt),
          eq(playerCharacterSpells.isPrepared, true),
        ),
      ),
    db
      .select()
      .from(playerCharacterSpellSlots)
      .where(
        and(
          inArray(playerCharacterSpellSlots.playerCharacterId, pcIds),
          isNull(playerCharacterSpellSlots.deletedAt),
        ),
      ),
  ]);

  const result: UnplacedCombatant[] = [];

  for (const member of members) {
    const pc = pcById.get(member.playerCharacterId);
    if (!pc) continue;

    const materializedActions: EngineAction[] = actionRows
      .filter(action => action.playerCharacterId === pc.id)
      .map(action =>
        toEngineAction(
          action.id,
          action,
          attackRows.find(
            attack => attack.playerCharacterActionId === action.id,
          ) ?? null,
        ),
      );

    const spellActions: EngineAction[] = spellRows
      .filter(row => row.playerCharacterId === pc.id)
      .map(row =>
        toEngineActionFromSpell(
          // A cantrip (`isAlwaysAvailable`) never consumes a slot regardless
          // of what `spell.level` says — see `toEngineActionFromSpell`'s own
          // doc comment. `spell.level` still drives which non-cantrip slot a
          // leveled spell needs.
          { ...row.spell, level: row.isAlwaysAvailable ? 0 : row.spell.level },
          pc.level,
          pc.initiativeModifier,
        ),
      );

    const actions = [...materializedActions, ...spellActions];

    const spellSlotsRemaining: Record<number, number> = {};
    for (const slot of slotRows) {
      if (slot.playerCharacterId !== pc.id) continue;
      spellSlotsRemaining[slot.spellLevel] = slot.maxSlots;
    }

    result.push({
      id: crypto.randomUUID(),
      templateKey: pc.id,
      name: pc.name,
      side: 'party',
      armorClass: pc.armorClass,
      maxHitPoints: pc.maxHitPoints,
      currentHitPoints: pc.maxHitPoints,
      initiativeBonus: pc.initiativeModifier,
      speed: DEFAULT_SPEED,
      attacksPerTurn: attacksPerTurnForPc(pc.characterClassSlug, pc.level),
      position:
        member.positionX !== null && member.positionY !== null
          ? { x: member.positionX, y: member.positionY }
          : null,
      actions,
      saveModifiers: toPlayerCharacterSaveModifiers(pc.initiativeModifier),
      legendaryResistancesRemaining: 0,
      legendaryActionPoints: 0,
      // `player_characters` has no structured resistance data — see
      // `EngineCombatant`'s own doc comment on these three fields.
      damageResistances: [],
      damageImmunities: [],
      damageVulnerabilities: [],
      activeConditions: [],
      concentratingOn: null,
      spellSlotsRemaining,
      // No PC has a parsed Multiattack — that's a monster stat-block concept
      // (issue #5, milestone 9's parser reads `creature_actions`/`custom_
      // creature_actions` only). A PC's Extra Attack already goes through
      // `attacksPerTurn` instead.
      multiattackSequence: null,
    });
  }

  return result;
};

const loadMonsterCombatants = async (
  db: Database,
  scenarioId: string,
): Promise<UnplacedCombatant[]> => {
  const entries = await db
    .select()
    .from(simulatorScenarioMonsterEntries)
    .where(
      and(
        eq(simulatorScenarioMonsterEntries.scenarioId, scenarioId),
        isNull(simulatorScenarioMonsterEntries.deletedAt),
      ),
    );

  if (!entries.length) return [];

  const librarySlugs = entries
    .map(entry => entry.creatureSlug)
    .filter((slug): slug is string => slug !== null);
  const customCreatureIds = entries
    .map(entry => entry.customCreatureId)
    .filter((id): id is string => id !== null);

  const [
    libraryRows,
    libraryActionRows,
    libraryAttackRows,
    libraryTraitRows,
    customRows,
    customActionRows,
    customAttackRows,
    customTraitRows,
  ] = await Promise.all([
    librarySlugs.length
      ? db.select().from(creatures).where(inArray(creatures.slug, librarySlugs))
      : [],
    librarySlugs.length
      ? db
          .select()
          .from(creatureActions)
          .where(inArray(creatureActions.creatureSlug, librarySlugs))
      : [],
    librarySlugs.length ? db.select().from(creatureActionAttacks) : [],
    librarySlugs.length
      ? db
          .select()
          .from(creatureTraits)
          .where(inArray(creatureTraits.creatureSlug, librarySlugs))
      : [],
    customCreatureIds.length
      ? db
          .select()
          .from(customCreatures)
          .where(
            and(
              inArray(customCreatures.id, customCreatureIds),
              isNull(customCreatures.deletedAt),
            ),
          )
      : [],
    customCreatureIds.length
      ? db
          .select()
          .from(customCreatureActions)
          .where(
            and(
              inArray(
                customCreatureActions.customCreatureId,
                customCreatureIds,
              ),
              isNull(customCreatureActions.deletedAt),
            ),
          )
      : [],
    customCreatureIds.length
      ? db
          .select()
          .from(customCreatureActionAttacks)
          .where(isNull(customCreatureActionAttacks.deletedAt))
      : [],
    customCreatureIds.length
      ? db
          .select()
          .from(customCreatureTraits)
          .where(
            and(
              inArray(customCreatureTraits.customCreatureId, customCreatureIds),
              isNull(customCreatureTraits.deletedAt),
            ),
          )
      : [],
  ]);

  const libraryBySlug = new Map(libraryRows.map(row => [row.slug, row]));
  const customById = new Map(customRows.map(row => [row.id, row]));

  const usedNames: string[] = [];
  const result: UnplacedCombatant[] = [];

  for (const entry of entries) {
    // Kept as two fully separate branches (library vs. custom) rather than
    // sharing a ternary-typed `actionRows`/`attackRows` variable — the two
    // row shapes differ enough (a library action is keyed by `slug`, a
    // custom one by `id`) that TypeScript can't narrow a shared union
    // cleanly, and the duplication reads more plainly than fighting that.
    if (entry.creatureSlug !== null) {
      const source = libraryBySlug.get(entry.creatureSlug);
      if (!source) continue;

      const actions: EngineAction[] = libraryActionRows
        .filter(action => action.creatureSlug === entry.creatureSlug)
        .map(action =>
          toEngineAction(
            action.slug,
            action,
            libraryAttackRows.find(
              attack => attack.actionSlug === action.slug,
            ) ?? null,
          ),
        );

      const traits = libraryTraitRows.filter(
        trait => trait.creatureSlug === entry.creatureSlug,
      );

      const multiattackSequence = resolveMultiattackSequence(
        libraryActionRows.filter(
          action => action.creatureSlug === entry.creatureSlug,
        ),
        actions,
      );

      const names = buildCombatantNames({
        baseName: source.name,
        count: entry.count,
        existingNames: usedNames,
      });
      usedNames.push(...names);

      const anchorPosition: GridCell | null =
        entry.positionX !== null && entry.positionY !== null
          ? { x: entry.positionX, y: entry.positionY }
          : null;

      for (const name of names) {
        result.push({
          id: crypto.randomUUID(),
          templateKey: entry.id,
          name,
          side: 'monsters',
          armorClass: source.armorClass,
          maxHitPoints: source.hitPoints,
          currentHitPoints: source.hitPoints,
          initiativeBonus: source.initiativeBonus ?? 0,
          speed: source.walk ?? DEFAULT_SPEED,
          // Extra Attack's flat repeat count is a PC-only concept — a
          // monster's own multi-attack turn goes through
          // `multiattackSequence` below instead, see its own doc comment.
          attacksPerTurn: 1,
          multiattackSequence,
          // Every individual in a >1 count shares the entry's own anchor —
          // this engine has no per-individual placement UI yet (issue #5's
          // own "implementation-time call" on deployment shape), so a DM
          // placing a group of 4 goblins gets 4 stacked tokens on one cell
          // rather than a spread footprint.
          position: anchorPosition,
          actions,
          saveModifiers: toEngineSaveModifiers(source),
          legendaryResistancesRemaining: hasLegendaryResistance(traits)
            ? DEFAULT_LEGENDARY_RESISTANCES
            : 0,
          legendaryActionPoints: 0,
          damageResistances: source.damageResistances,
          damageImmunities: source.damageImmunities,
          damageVulnerabilities: source.damageVulnerabilities,
          activeConditions: [],
          concentratingOn: null,
          // No monster carries spell slots — casting monsters resolve their
          // spellcasting through their own `creature_actions` rows (a save
          // effect with a fixed DC, like any other monster action), not
          // through a slot economy.
          spellSlotsRemaining: {},
        });
      }
      continue;
    }

    if (entry.customCreatureId !== null) {
      const source = customById.get(entry.customCreatureId);
      if (!source) continue;

      const actions: EngineAction[] = customActionRows
        .filter(action => action.customCreatureId === entry.customCreatureId)
        .map(action =>
          toEngineAction(
            action.id,
            action,
            customAttackRows.find(
              attack => attack.customCreatureActionId === action.id,
            ) ?? null,
          ),
        );

      const traits = customTraitRows.filter(
        trait => trait.customCreatureId === entry.customCreatureId,
      );

      const multiattackSequence = resolveMultiattackSequence(
        customActionRows.filter(
          action => action.customCreatureId === entry.customCreatureId,
        ),
        actions,
      );

      const names = buildCombatantNames({
        baseName: source.name,
        count: entry.count,
        existingNames: usedNames,
      });
      usedNames.push(...names);

      const anchorPosition: GridCell | null =
        entry.positionX !== null && entry.positionY !== null
          ? { x: entry.positionX, y: entry.positionY }
          : null;

      for (const name of names) {
        result.push({
          id: crypto.randomUUID(),
          templateKey: entry.id,
          name,
          side: 'monsters',
          armorClass: source.armorClass,
          maxHitPoints: source.hitPoints,
          currentHitPoints: source.hitPoints,
          initiativeBonus: source.initiativeBonus ?? 0,
          speed: source.walk ?? DEFAULT_SPEED,
          // Extra Attack's flat repeat count is a PC-only concept — a
          // monster's own multi-attack turn goes through
          // `multiattackSequence` below instead, see its own doc comment.
          attacksPerTurn: 1,
          multiattackSequence,
          position: anchorPosition,
          actions,
          saveModifiers: toEngineSaveModifiers(source),
          legendaryResistancesRemaining: hasLegendaryResistance(traits)
            ? DEFAULT_LEGENDARY_RESISTANCES
            : 0,
          legendaryActionPoints: 0,
          // `custom_creatures` only stores resistance/immunity/vulnerability
          // as free-text display strings, not a structured list — see
          // `EngineCombatant`'s own doc comment on these three fields.
          damageResistances: [],
          damageImmunities: [],
          damageVulnerabilities: [],
          activeConditions: [],
          concentratingOn: null,
          // Same as a library creature — no custom-creature spellcasting
          // goes through a slot economy either.
          spellSlotsRemaining: {},
        });
      }
    }
  }

  return result;
};

/** Positions any combatant with no DM-chosen placement — auto-placing only
 * the ones missing a position keeps an explicit placement untouched. */
const withAutoPlacement = (
  combatants: readonly UnplacedCombatant[],
  cols: number,
  rows: number,
): EngineCombatant[] => {
  const fillSide = (side: EngineCombatant['side']) => {
    const missing = combatants.filter(
      c => c.side === side && c.position === null,
    );
    const positions = autoPlacePositions(missing.length, side, cols, rows);
    return new Map(missing.map((c, index) => [c.id, positions[index]]));
  };

  const partyPositions = fillSide('party');
  const monsterPositions = fillSide('monsters');

  return combatants.map(combatant => ({
    ...combatant,
    position: combatant.position ??
      partyPositions.get(combatant.id) ??
      monsterPositions.get(combatant.id) ?? { x: 0, y: 0 },
  }));
};

/**
 * The impure edge for the pure engine in `~/server/simulator/engine`:
 * reads a scenario's party and monster composition from the database and
 * resolves it into `EngineCombatant[]`, ready for `runEncounter`. Never
 * called from a component or a module body — always from a tRPC resolver
 * (milestones 5/6) or a test.
 */
export const loadScenarioCombatants = async (
  db: Database,
  scenarioId: string,
  gridCols: number = DEFAULT_GRID_COLS,
  gridRows: number = DEFAULT_GRID_ROWS,
): Promise<EngineCombatant[]> => {
  const scenario = await db.query.simulatorScenarios.findFirst({
    where: and(
      eq(simulatorScenarios.id, scenarioId),
      isNull(simulatorScenarios.deletedAt),
    ),
  });

  if (!scenario) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'That scenario no longer exists.',
    });
  }

  const [party, monsters] = await Promise.all([
    loadPartyCombatants(db, scenarioId),
    loadMonsterCombatants(db, scenarioId),
  ]);

  return withAutoPlacement([...party, ...monsters], gridCols, gridRows);
};
