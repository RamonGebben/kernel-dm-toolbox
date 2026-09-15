import {
  SPELL_LEVELS,
  type PlayerCharacterCombatDataFormValues,
  type ResourceFormValues,
  type SpellFormValues,
  type SpellSlotFormValues,
} from '~/molecules/PlayerCharacterCombatDataForm';
import type {
  ActionFormValues,
  AttackFormValues,
} from '~/molecules/CustomCreatureForm';

type RawAttack = {
  name: string;
  attackType: string | null;
  toHitMod: number | null;
  reach: number | null;
  range: number | null;
  longRange: number | null;
  targetCreatureOnly: boolean;
  damageDieCount: number | null;
  damageDieType: string | null;
  damageBonus: number | null;
  damageType: string | null;
  extraDamageDieCount: number | null;
  extraDamageDieType: string | null;
  extraDamageBonus: number | null;
  extraDamageType: string | null;
};

type RawAction = {
  name: string;
  desc: string;
  actionType: string;
  legendaryActionCost: number | null;
  attack: RawAttack | null;
};

type RawSpell = {
  spellSlug: string;
  isPrepared: boolean;
  isAlwaysAvailable: boolean;
};

type RawSpellSlot = { spellLevel: number; maxSlots: number };

type RawResource = {
  resourceKey: string;
  name: string;
  maxUses: number | null;
  isUnlimited: boolean;
  /** `string` rather than the narrow union: the `resets_on` column is plain
   * text at the drizzle level (only the zod input schema enforces the enum
   * on write), so a row read back from the database is a wider type. */
  resetsOn: string;
};

type ToPlayerCharacterCombatDataFormValuesArgs = {
  actions: readonly RawAction[];
  spells: readonly RawSpell[];
  spellSlots: readonly RawSpellSlot[];
  resources: readonly RawResource[];
  /** A spell's name isn't stored on `player_character_spells` (only its
   * slug) — the caller supplies this from whatever spell list it already
   * fetched (the class's known spells) so an existing row can still show a
   * readable name. A slug missing from the map (a spell removed from the
   * library after being added to this PC) falls back to the slug itself. */
  spellNamesBySlug: ReadonlyMap<string, string>;
};

const numberToField = (value: number | null): string =>
  value == null ? '' : String(value);

const textToField = (value: string | null): string => value ?? '';

const toAttackFormValues = (attack: RawAttack): AttackFormValues => ({
  name: attack.name,
  attackType: textToField(attack.attackType),
  toHitMod: numberToField(attack.toHitMod),
  reach: numberToField(attack.reach),
  range: numberToField(attack.range),
  longRange: numberToField(attack.longRange),
  targetCreatureOnly: attack.targetCreatureOnly,
  damageDieCount: numberToField(attack.damageDieCount),
  damageDieType: textToField(attack.damageDieType),
  damageBonus: numberToField(attack.damageBonus),
  damageType: textToField(attack.damageType),
  extraDamageDieCount: numberToField(attack.extraDamageDieCount),
  extraDamageDieType: textToField(attack.extraDamageDieType),
  extraDamageBonus: numberToField(attack.extraDamageBonus),
  extraDamageType: textToField(attack.extraDamageType),
});

/**
 * Turns the raw `characters.getCombatData` result into the combat-data
 * form's draft shape — the reverse of `toUpdateCombatDataInput`, and the PC
 * equivalent of `toCustomCreatureFormValues`.
 */
export const toPlayerCharacterCombatDataFormValues = ({
  actions,
  spells,
  spellSlots,
  resources,
  spellNamesBySlug,
}: ToPlayerCharacterCombatDataFormValuesArgs): PlayerCharacterCombatDataFormValues => ({
  actions: actions.map((action): ActionFormValues => ({
    name: action.name,
    desc: action.desc,
    actionType: action.actionType as ActionFormValues['actionType'],
    legendaryActionCost: numberToField(action.legendaryActionCost),
    attack: action.attack ? toAttackFormValues(action.attack) : null,
  })),
  spells: spells.map((spell): SpellFormValues => ({
    spellSlug: spell.spellSlug,
    name: spellNamesBySlug.get(spell.spellSlug) ?? spell.spellSlug,
    isPrepared: spell.isPrepared,
    isAlwaysAvailable: spell.isAlwaysAvailable,
  })),
  spellSlots: SPELL_LEVELS.map((spellLevel): SpellSlotFormValues => ({
    spellLevel,
    maxSlots: String(
      spellSlots.find(slot => slot.spellLevel === spellLevel)?.maxSlots ?? 0,
    ),
  })),
  resources: resources.map((resource): ResourceFormValues => ({
    resourceKey: resource.resourceKey,
    name: resource.name,
    maxUses: numberToField(resource.maxUses) || '0',
    isUnlimited: resource.isUnlimited,
    resetsOn: resource.resetsOn as ResourceFormValues['resetsOn'],
  })),
});
