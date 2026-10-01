import type { CharacterClass } from '~/content/characterOptions';
import type { FacilityPrerequisite } from '~/content/bastion/types';

/**
 * Which classes meet each special facility prerequisite out of the box.
 *
 * An approximation by class alone: a feat, a subclass or a magic item can
 * grant a focus or Expertise too, which is why an unmet prerequisite is a
 * warning the DM can override rather than a hard block (DECISIONS #33).
 */
export const facilityPrerequisites: Readonly<
  Record<
    FacilityPrerequisite,
    { label: string; classes: readonly CharacterClass[] }
  >
> = {
  'arcane-focus': {
    label: 'Can use an Arcane Focus or a tool as a Spellcasting Focus',
    classes: ['Sorcerer', 'Warlock', 'Wizard'],
  },
  'holy-or-druidic-focus': {
    label: 'Can use a Holy Symbol or Druidic Focus as a Spellcasting Focus',
    classes: ['Cleric', 'Druid', 'Paladin', 'Ranger'],
  },
  'any-spellcasting-focus': {
    label: 'Can use a Spellcasting Focus',
    classes: [
      'Bard',
      'Cleric',
      'Druid',
      'Paladin',
      'Ranger',
      'Sorcerer',
      'Warlock',
      'Wizard',
    ],
  },
  'skill-expertise': {
    label: 'Has Expertise in a skill',
    classes: ['Bard', 'Ranger', 'Rogue'],
  },
  'fighting-style-or-unarmored-defense': {
    label: 'Has Fighting Style or Unarmored Defense',
    classes: ['Barbarian', 'Fighter', 'Monk', 'Paladin', 'Ranger'],
  },
};
