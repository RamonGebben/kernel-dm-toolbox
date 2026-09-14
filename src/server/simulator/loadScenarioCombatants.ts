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
  playerCharacters,
  simulatorScenarioMonsterEntries,
  simulatorScenarioPartyMembers,
  simulatorScenarios,
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

  const [actionRows, attackRows] = await Promise.all([
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
  ]);

  const result: UnplacedCombatant[] = [];

  for (const member of members) {
    const pc = pcById.get(member.playerCharacterId);
    if (!pc) continue;

    const actions: EngineAction[] = actionRows
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
          // Not modeled for monsters — see `EngineCombatant.attacksPerTurn`'s
          // own doc comment on why a stat block's "Multiattack" action isn't
          // parsed into this number.
          attacksPerTurn: 1,
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
          // Not modeled for monsters — see `EngineCombatant.attacksPerTurn`'s
          // own doc comment on why a stat block's "Multiattack" action isn't
          // parsed into this number.
          attacksPerTurn: 1,
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
