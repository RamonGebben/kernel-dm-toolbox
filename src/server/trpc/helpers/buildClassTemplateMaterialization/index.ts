import {
  progressionForClass,
  type ResetTiming,
} from '~/content/classProgression';
import {
  pactSlotsForLevel,
  spellSlotsForLevel,
  type FullOrHalfCasterType,
} from '~/content/spellSlotsByCasterType';
import type { CharacterClass } from '~/server/db/schema';

export type MaterializedSpellSlot = { spellLevel: number; maxSlots: number };

export type MaterializedResource = {
  resourceKey: string;
  name: string;
  maxUses: number | null;
  isUnlimited: boolean;
  resetsOn: ResetTiming;
};

export type ClassTemplateMaterialization = {
  spellSlots: MaterializedSpellSlot[];
  resources: MaterializedResource[];
};

/**
 * Derives the deterministic part of applying a class/subclass/level to a PC:
 * spell slots and resource pool sizes, both pure functions of the class and
 * level. Actions, attacks and known/prepared spells are NOT produced here —
 * per issue #5's "fully editable afterward to match what a player actually
 * runs at the table", a PC's actual weapon and spell choices are the
 * player's, not something to guess from a class template. Those tables are
 * simply cleared and left for the DM to fill in via
 * `characters.updateCombatData`, the same starting point a brand-new custom
 * creature gets from `customCreatures.create`.
 */
export const buildClassTemplateMaterialization = (
  characterClass: Pick<
    CharacterClass,
    'slug' | 'subclassOfSlug' | 'casterType'
  >,
  level: number,
): ClassTemplateMaterialization => {
  const spellSlots = buildSpellSlots(characterClass.casterType, level);
  const resources = buildResources(characterClass, level);

  return { spellSlots, resources };
};

const buildSpellSlots = (
  casterType: string,
  level: number,
): MaterializedSpellSlot[] => {
  if (casterType === 'FULL' || casterType === 'HALF') {
    return spellSlotsForLevel(casterType as FullOrHalfCasterType, level)
      .map((maxSlots, index) => ({ spellLevel: index + 1, maxSlots }))
      .filter(slot => slot.maxSlots > 0);
  }

  if (casterType === 'PACT') {
    const { slotCount, slotLevel } = pactSlotsForLevel(level);
    return slotCount > 0
      ? [{ spellLevel: slotLevel, maxSlots: slotCount }]
      : [];
  }

  return [];
};

const buildResources = (
  characterClass: Pick<CharacterClass, 'slug' | 'subclassOfSlug'>,
  level: number,
): MaterializedResource[] => {
  const progression = progressionForClass(
    characterClass.slug,
    characterClass.subclassOfSlug,
  );

  if (!progression) return [];

  return progression.resources
    .map(pool => {
      const maxUsesAtLevel = pool.maxUsesByLevel[level - 1] ?? null;
      if (maxUsesAtLevel === null) return null;

      const isUnlimited = maxUsesAtLevel === Infinity;

      return {
        resourceKey: pool.key,
        name: pool.name,
        maxUses: isUnlimited ? null : maxUsesAtLevel,
        isUnlimited,
        resetsOn: pool.resetsOn,
      };
    })
    .filter((resource): resource is MaterializedResource => resource !== null);
};
