/**
 * Static rules data: the choices a party member's class and species are
 * picked from.
 *
 * Hand-written rather than imported: twelve classes and nine species are
 * stable, and the Party page only needs their names (SRD 5.2, CC-BY-4.0 — the
 * README's attribution covers it). Open5e's `CharacterClass.json` /
 * `Species.json` are the place to go if features or traits are ever needed.
 */

export const characterClasses = [
  'Barbarian',
  'Bard',
  'Cleric',
  'Druid',
  'Fighter',
  'Monk',
  'Paladin',
  'Ranger',
  'Rogue',
  'Sorcerer',
  'Warlock',
  'Wizard',
] as const;

export type CharacterClass = (typeof characterClasses)[number];

/**
 * The one subclass per class the SRD carries. Offered as suggestions only —
 * the field is free text, because a table's subclass is usually from the PHB.
 */
export const srdSubclassByClass: Readonly<Record<CharacterClass, string>> = {
  Barbarian: 'Path of the Berserker',
  Bard: 'College of Lore',
  Cleric: 'Life Domain',
  Druid: 'Circle of the Land',
  Fighter: 'Champion',
  Monk: 'Warrior of the Open Hand',
  Paladin: 'Oath of Devotion',
  Ranger: 'Hunter',
  Rogue: 'Thief',
  Sorcerer: 'Draconic Sorcery',
  Warlock: 'Fiend Patron',
  Wizard: 'Evoker',
};

/** Suggestions for the free-text species field — the SRD 5.2 set. */
export const srdSpecies = [
  'Dragonborn',
  'Dwarf',
  'Elf',
  'Gnome',
  'Goliath',
  'Halfling',
  'Human',
  'Orc',
  'Tiefling',
] as const;
