/**
 * How many spell slots a PC has at each character level, by caster type.
 *
 * `character_classes.casterType` (imported from Open5e) is `NONE` / `FULL` /
 * `HALF` / `PACT` — a property of the class, not of the individual PC — so
 * this is the one universal table per caster type rather than one per class,
 * unlike `classProgression` which is genuinely per-class.
 *
 * `NONE` has no entry: a non-caster class (Barbarian, Fighter, …) never
 * indexes into this table. `FULL`/`HALF` slots are keyed by spell level
 * 1-9 and refresh on a long rest, matching normal Vancian casting. `PACT`
 * (Warlock) slots are structurally different — few slots, but all cast at
 * the same elevated level, and they refresh on a *short* rest — so its shape
 * is `{ slotCount, slotLevel }` rather than a per-level array.
 */

export type FullOrHalfCasterType = 'FULL' | 'HALF';

/** Index 0 is character level 1; index 19 is level 20. Each inner array is
 * indexed by spell level 1-9 (index 0 = 1st-level slots). */
export type SpellSlotsByLevel = ReadonlyArray<ReadonlyArray<number>>;

/** Standard 5e full-caster slot progression (Bard, Cleric, Druid, Sorcerer,
 * Wizard): the "Spellcasting" class table every full caster shares. */
export const fullCasterSpellSlotsByLevel: SpellSlotsByLevel = [
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // 20
];

/** Standard 5e half-caster slot progression (Paladin, Ranger): slots start
 * at level 2 and cap at 5th-level spells. */
export const halfCasterSpellSlotsByLevel: SpellSlotsByLevel = [
  [0, 0, 0, 0, 0], // 1
  [2, 0, 0, 0, 0], // 2
  [3, 0, 0, 0, 0], // 3
  [3, 0, 0, 0, 0], // 4
  [4, 2, 0, 0, 0], // 5
  [4, 2, 0, 0, 0], // 6
  [4, 3, 0, 0, 0], // 7
  [4, 3, 0, 0, 0], // 8
  [4, 3, 2, 0, 0], // 9
  [4, 3, 2, 0, 0], // 10
  [4, 3, 3, 0, 0], // 11
  [4, 3, 3, 0, 0], // 12
  [4, 3, 3, 1, 0], // 13
  [4, 3, 3, 1, 0], // 14
  [4, 3, 3, 2, 0], // 15
  [4, 3, 3, 2, 0], // 16
  [4, 3, 3, 3, 1], // 17
  [4, 3, 3, 3, 1], // 18
  [4, 3, 3, 3, 2], // 19
  [4, 3, 3, 3, 2], // 20
];

export type PactSlots = { slotCount: number; slotLevel: number };

/** Warlock's Pact Magic: few slots, all cast at one elevated level, refresh
 * on a short rest rather than a long one. Index 0 is level 1. */
export const pactCasterSlotsByLevel: ReadonlyArray<PactSlots> = [
  { slotCount: 1, slotLevel: 1 }, // 1
  { slotCount: 2, slotLevel: 1 }, // 2
  { slotCount: 2, slotLevel: 2 }, // 3
  { slotCount: 2, slotLevel: 2 }, // 4
  { slotCount: 2, slotLevel: 3 }, // 5
  { slotCount: 2, slotLevel: 3 }, // 6
  { slotCount: 2, slotLevel: 4 }, // 7
  { slotCount: 2, slotLevel: 4 }, // 8
  { slotCount: 2, slotLevel: 5 }, // 9
  { slotCount: 2, slotLevel: 5 }, // 10
  { slotCount: 3, slotLevel: 5 }, // 11
  { slotCount: 3, slotLevel: 5 }, // 12
  { slotCount: 3, slotLevel: 5 }, // 13
  { slotCount: 3, slotLevel: 5 }, // 14
  { slotCount: 3, slotLevel: 5 }, // 15
  { slotCount: 3, slotLevel: 5 }, // 16
  { slotCount: 4, slotLevel: 5 }, // 17
  { slotCount: 4, slotLevel: 5 }, // 18
  { slotCount: 4, slotLevel: 5 }, // 19
  { slotCount: 4, slotLevel: 5 }, // 20
];

/** Slots for a FULL/HALF caster at a given character level, 1-20. */
export const spellSlotsForLevel = (
  casterType: FullOrHalfCasterType,
  level: number,
): ReadonlyArray<number> => {
  const table =
    casterType === 'FULL'
      ? fullCasterSpellSlotsByLevel
      : halfCasterSpellSlotsByLevel;
  return table[Math.min(Math.max(level, 1), table.length) - 1];
};

/** Pact slots for a Warlock (or other PACT caster) at a given level, 1-20. */
export const pactSlotsForLevel = (level: number): PactSlots =>
  pactCasterSlotsByLevel[
    Math.min(Math.max(level, 1), pactCasterSlotsByLevel.length) - 1
  ];
