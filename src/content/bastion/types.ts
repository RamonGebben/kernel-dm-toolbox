/**
 * The shape of the bastion catalog (2024 DMG, chapter 8).
 *
 * The data in this folder is a cheat sheet in our own words — the numbers
 * the rules run on (costs, dice, durations, sizes, outputs) with one- or
 * two-line summaries, never the book's text (DECISIONS #33).
 */

/** How much floor a facility takes. Cramped 4, Roomy 16, Vast 36 squares. */
export type FacilitySpace = 'cramped' | 'roomy' | 'vast';

/** The seven orders. Maintain is bastion-wide; the rest go to a facility. */
export type BastionOrder =
  | 'craft'
  | 'empower'
  | 'harvest'
  | 'maintain'
  | 'recruit'
  | 'research'
  | 'trade';

/** The character levels at which special facilities unlock. */
export type FacilityLevel = 5 | 9 | 13 | 17;

/**
 * A special facility's prerequisite, as a key the rules can check against a
 * character's class (`~/utils/bastionRules`). Class is only an approximation
 * of "can use a Holy Symbol as a Spellcasting Focus" — a feat or a subclass
 * can grant it too — so an unmet prerequisite is a warning the DM can
 * override, never a hard block.
 */
export type FacilityPrerequisite =
  /** Can use an Arcane Focus, or a tool as a Spellcasting Focus. */
  | 'arcane-focus'
  /** Can use a Holy Symbol or a Druidic Focus as a Spellcasting Focus. */
  | 'holy-or-druidic-focus'
  /** Can use any Spellcasting Focus. */
  | 'any-spellcasting-focus'
  /** Has Expertise in a skill. */
  | 'skill-expertise'
  /** Has the Fighting Style or Unarmored Defense feature. */
  | 'fighting-style-or-unarmored-defense';

/** One thing a facility can be ordered to do. */
export type FacilityOrderOption = {
  /** Stable key, unique within its facility. */
  key: string;
  label: string;
  /** What it produces or does, in a line or two. */
  summary: string;
  /**
   * Days the facility is busy. Null when the duration comes from elsewhere
   * (magic item crafting time, the PHB crafting rules).
   */
  durationDays: number | null;
  /** Fixed gold cost, or null when free or variable (see `summary`). */
  costGp: number | null;
  /** Owner level needed for this option, when higher than the facility's. */
  minimumLevel?: FacilityLevel;
};

export type SpecialFacilityDefinition = {
  /** Stable key, stored on `bastion_special_facilities.facility_key`. */
  key: string;
  name: string;
  /** The owner level at which it becomes available. */
  level: FacilityLevel;
  prerequisite: FacilityPrerequisite | null;
  space: FacilitySpace;
  hirelings: number;
  /** The single order type this facility takes. */
  order: Exclude<BastionOrder, 'maintain'>;
  orderOptions: readonly FacilityOrderOption[];
  /** Always-on effects, one line each. */
  benefits: readonly string[];
  /**
   * Some facilities need a choice that shapes what they do — a Garden's
   * type, a Training Area's trainer, a Guildhall's guild.
   */
  variant?: { label: string; options: readonly string[] };
  /** Barrack, Garden, Stable and Training Area may be taken more than once. */
  allowMultiple?: boolean;
  /** Enlarging to Vast. Always 2,000 GP; the rules give no build time. */
  enlarge?: {
    costGp: number;
    /** What changes once enlarged. */
    summary: string;
    /** Added to `hirelings` once enlarged. */
    extraHirelings: number;
  };
};

/** The six flavour rooms. They have no mechanical effect. */
export type BasicFacilityType =
  'bedroom' | 'dining-room' | 'parlor' | 'courtyard' | 'kitchen' | 'storage';
