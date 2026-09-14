/**
 * Per-class, per-level mechanical grants for the encounter simulator's PC
 * materialization step (issue #5, milestone 2): how many attacks the Attack
 * action grants, and the class's primary resource pool(s), at each character
 * level 1-20. Hand-authored SRD-2024 content, the same treatment as
 * `src/content/challengeRating`/`encounterDifficulty` — Open5e's
 * `ClassFeature.json` is prose-only with no level gating or numeric grants
 * (see `character_class_features` in `schema.ts`), so there is no upstream
 * data to import this from.
 *
 * **Coverage, deliberately partial — read before consuming this in M2:**
 * - All 12 base classes have an accurate `attacksPerActionByLevel` (the
 *   single most load-bearing number for the engine's turn economy) and their
 *   one or two headline resource pools (Rage, Bardic Inspiration, Channel
 *   Divinity, Wild Shape, Second Wind + Action Surge, Ki Points, Lay on
 *   Hands + Channel Divinity, Sorcery Points).
 * - Only the 12 **base classes** are covered. The 12 SRD-2024 subclasses
 *   (`character_classes.subclassOfSlug` non-null) have no entry here at
 *   all — `progressionForClass` falls back to the base class's own
 *   progression for a subclass slug it doesn't recognize, which is correct
 *   for shared numbers (Extra Attack, spell slots) but silently omits
 *   subclass-only grants (a Champion's improved critical range, a Berserker's
 *   Frenzy, a Life Domain cleric's extra healing, …). Whoever builds the
 *   class wizard's materialization step in M2 should treat per-subclass
 *   mechanical grants as a follow-up, not assume they're here.
 * - Several real class features are intentionally not modeled as a resource
 *   pool because they don't fit the "N uses, refills on a rest" shape used
 *   here: Rogue's Cunning Action, Ranger's Favored Enemy/terrain, Wizard's
 *   Arcane Recovery (recovers *slots*, not itself a use-limited action),
 *   Warlock's Eldritch Invocations. A PC using these will need the feature
 *   handled as flavor/manual play rather than simulated mechanically, same
 *   as `character_class_features.desc` already documents it as reference
 *   text only.
 * - Bardic Inspiration's reset timing is simplified to `SHORT_REST`
 *   throughout; the real 2024 rule is `LONG_REST` below level 5 and
 *   `SHORT_REST` from level 5 on (Font of Inspiration). Getting this exactly
 *   right needs a per-level reset timing this module's shape doesn't have —
 *   flagged here rather than silently wrong.
 * - Warlock's Pact Magic slots live in `~/content/spellSlotsByCasterType`
 *   (`pactCasterSlotsByLevel`), not duplicated here.
 */

export type ResetTiming = 'SHORT_REST' | 'LONG_REST';

export type ClassResourcePool = {
  /** Stable key, so a materialized `player_character_resources` row can be
   * re-associated with this definition later (e.g. on a level-up re-apply). */
  key: string;
  name: string;
  resetsOn: ResetTiming;
  /** Max uses at character level 1-20 (index 0 = level 1). `null` means the
   * class doesn't have this pool yet at that level; `Infinity` means
   * unlimited (Barbarian's level-20 Rage). */
  maxUsesByLevel: ReadonlyArray<number | null>;
};

export type ClassProgression = {
  classSlug: string;
  /** Attacks granted by the Attack action, 1-20 (index 0 = level 1). Always
   * >= 1; only Extra Attack (and Fighter's later upgrades) raises it. */
  attacksPerActionByLevel: ReadonlyArray<number>;
  resources: ReadonlyArray<ClassResourcePool>;
  /** Rogue only: bonus damage dice (d6) added once per turn on a hit with
   * advantage/a finesse or ranged weapon/an ally adjacent to the target. */
  sneakAttackDiceByLevel?: ReadonlyArray<number | null>;
  /** Barbarian only: flat bonus added to Strength-based melee damage while
   * raging. */
  rageDamageBonusByLevel?: ReadonlyArray<number | null>;
  /** Monk only: the die size of an unarmed strike/monk weapon, as dice
   * notation ("1d6", "1d8", …), or null before the feature applies. */
  martialArtsDieByLevel?: ReadonlyArray<string | null>;
};

/**
 * Builds a 20-entry (level 1-20) array from a sparse set of "at this level,
 * the value becomes X" steps. Every level keeps the most recent step's value
 * until the next one, and any level before the first step gets `before`.
 */
const byLevelThreshold = <T>(
  steps: ReadonlyArray<readonly [level: number, value: T]>,
  before: T,
): ReadonlyArray<T> =>
  Array.from({ length: 20 }, (_, index) => {
    const level = index + 1;
    const applicable = steps.filter(([stepLevel]) => stepLevel <= level);
    return applicable.length > 0
      ? applicable[applicable.length - 1][1]
      : before;
  });

const noExtraAttack = byLevelThreshold<number>([], 1);

const extraAttackAtFive = byLevelThreshold<number>([[5, 2]], 1);

const barbarianProgression: ClassProgression = {
  classSlug: 'srd-2024_barbarian',
  attacksPerActionByLevel: extraAttackAtFive,
  resources: [
    {
      key: 'rage',
      name: 'Rage',
      resetsOn: 'LONG_REST',
      maxUsesByLevel: byLevelThreshold(
        [
          [1, 2],
          [3, 3],
          [6, 4],
          [12, 5],
          [17, 6],
          [20, Infinity],
        ],
        2,
      ),
    },
  ],
  rageDamageBonusByLevel: byLevelThreshold(
    [
      [1, 2],
      [9, 3],
      [16, 4],
    ],
    2,
  ),
};

const bardProgression: ClassProgression = {
  classSlug: 'srd-2024_bard',
  attacksPerActionByLevel: noExtraAttack,
  resources: [
    {
      key: 'bardic-inspiration',
      name: 'Bardic Inspiration',
      // Simplified — see the module-level note on Font of Inspiration.
      resetsOn: 'SHORT_REST',
      maxUsesByLevel: byLevelThreshold(
        [
          [1, 2],
          [5, 3],
          [9, 4],
          [13, 5],
          [17, 6],
        ],
        2,
      ),
    },
  ],
};

const clericProgression: ClassProgression = {
  classSlug: 'srd-2024_cleric',
  attacksPerActionByLevel: noExtraAttack,
  resources: [
    {
      key: 'channel-divinity',
      name: 'Channel Divinity',
      resetsOn: 'SHORT_REST',
      maxUsesByLevel: byLevelThreshold(
        [
          [2, 1],
          [6, 2],
          [18, 3],
        ],
        null,
      ),
    },
  ],
};

const druidProgression: ClassProgression = {
  classSlug: 'srd-2024_druid',
  attacksPerActionByLevel: noExtraAttack,
  resources: [
    {
      key: 'wild-shape',
      name: 'Wild Shape',
      resetsOn: 'SHORT_REST',
      maxUsesByLevel: byLevelThreshold([[2, 2]], null),
    },
  ],
};

const fighterProgression: ClassProgression = {
  classSlug: 'srd-2024_fighter',
  attacksPerActionByLevel: byLevelThreshold(
    [
      [5, 2],
      [11, 3],
      [20, 4],
    ],
    1,
  ),
  resources: [
    {
      key: 'second-wind',
      name: 'Second Wind',
      resetsOn: 'SHORT_REST',
      maxUsesByLevel: byLevelThreshold(
        [
          [1, 1],
          [4, 2],
          [10, 3],
        ],
        1,
      ),
    },
    {
      key: 'action-surge',
      name: 'Action Surge',
      resetsOn: 'SHORT_REST',
      maxUsesByLevel: byLevelThreshold(
        [
          [2, 1],
          [17, 2],
        ],
        null,
      ),
    },
  ],
};

const monkProgression: ClassProgression = {
  classSlug: 'srd-2024_monk',
  attacksPerActionByLevel: extraAttackAtFive,
  resources: [
    {
      key: 'ki-points',
      name: 'Ki Points',
      resetsOn: 'SHORT_REST',
      // Ki points equal the monk's level once unlocked at level 2.
      maxUsesByLevel: byLevelThreshold(
        Array.from({ length: 19 }, (_, index) => {
          const level = index + 2;
          return [level, level] as const;
        }),
        null,
      ),
    },
  ],
  martialArtsDieByLevel: byLevelThreshold(
    [
      [1, '1d6'],
      [5, '1d8'],
      [11, '1d10'],
      [17, '1d12'],
    ],
    '1d6',
  ),
};

const paladinProgression: ClassProgression = {
  classSlug: 'srd-2024_paladin',
  attacksPerActionByLevel: extraAttackAtFive,
  resources: [
    {
      key: 'lay-on-hands',
      name: 'Lay on Hands',
      resetsOn: 'LONG_REST',
      // A points pool sized in HP (5 x level), not a small "uses" count —
      // still fits this shape's "N per rest" semantics.
      maxUsesByLevel: byLevelThreshold(
        Array.from({ length: 20 }, (_, index) => {
          const level = index + 1;
          return [level, level * 5] as const;
        }),
        5,
      ),
    },
    {
      key: 'channel-divinity',
      name: 'Channel Divinity',
      resetsOn: 'SHORT_REST',
      maxUsesByLevel: byLevelThreshold(
        [
          [3, 1],
          [11, 2],
        ],
        null,
      ),
    },
  ],
};

const rangerProgression: ClassProgression = {
  classSlug: 'srd-2024_ranger',
  attacksPerActionByLevel: extraAttackAtFive,
  // No headline "N uses per rest" resource in the base class at v1's fidelity
  // — Favored Enemy/terrain are flavor, not mechanically simulated here.
  resources: [],
};

const rogueProgression: ClassProgression = {
  classSlug: 'srd-2024_rogue',
  attacksPerActionByLevel: noExtraAttack,
  resources: [],
  sneakAttackDiceByLevel: Array.from({ length: 20 }, (_, index) =>
    Math.ceil((index + 1) / 2),
  ),
};

const sorcererProgression: ClassProgression = {
  classSlug: 'srd-2024_sorcerer',
  attacksPerActionByLevel: noExtraAttack,
  resources: [
    {
      key: 'sorcery-points',
      name: 'Sorcery Points',
      resetsOn: 'LONG_REST',
      // Sorcery points equal the sorcerer's level once unlocked at level 2.
      maxUsesByLevel: byLevelThreshold(
        Array.from({ length: 19 }, (_, index) => {
          const level = index + 2;
          return [level, level] as const;
        }),
        null,
      ),
    },
  ],
};

const warlockProgression: ClassProgression = {
  classSlug: 'srd-2024_warlock',
  // No Extra Attack — Eldritch Blast's extra beams are cantrip damage
  // scaling, not the Attack action's attack count, and are not modeled here.
  attacksPerActionByLevel: noExtraAttack,
  // Pact Magic slots live in spellSlotsByCasterType; Eldritch Invocations
  // aren't a "uses per rest" pool.
  resources: [],
};

const wizardProgression: ClassProgression = {
  classSlug: 'srd-2024_wizard',
  attacksPerActionByLevel: noExtraAttack,
  // Arcane Recovery recovers slots rather than being itself a use-limited
  // action, so it doesn't fit this module's resource-pool shape — deferred.
  resources: [],
};

/** Keyed by base-class slug only — see the module-level note on subclass
 * coverage. */
export const classProgressionBySlug: Readonly<
  Record<string, ClassProgression>
> = {
  [barbarianProgression.classSlug]: barbarianProgression,
  [bardProgression.classSlug]: bardProgression,
  [clericProgression.classSlug]: clericProgression,
  [druidProgression.classSlug]: druidProgression,
  [fighterProgression.classSlug]: fighterProgression,
  [monkProgression.classSlug]: monkProgression,
  [paladinProgression.classSlug]: paladinProgression,
  [rangerProgression.classSlug]: rangerProgression,
  [rogueProgression.classSlug]: rogueProgression,
  [sorcererProgression.classSlug]: sorcererProgression,
  [warlockProgression.classSlug]: warlockProgression,
  [wizardProgression.classSlug]: wizardProgression,
};

/**
 * Looks up a class or subclass's progression, falling back to the parent
 * class when the slug is a subclass (or anything else not in the table
 * above) — see the module-level note on subclass coverage.
 */
export const progressionForClass = (
  classSlug: string,
  subclassOfSlug: string | null,
): ClassProgression | null =>
  classProgressionBySlug[classSlug] ??
  (subclassOfSlug ? classProgressionBySlug[subclassOfSlug] : null) ??
  null;
