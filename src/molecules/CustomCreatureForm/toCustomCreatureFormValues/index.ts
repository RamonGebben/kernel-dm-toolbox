import type { StatblockSourceCreature } from '~/server/trpc/helpers/buildStatblock';
import {
  ABILITY_FIELDS,
  SKILL_FIELDS,
  type AbilityKey,
  type SkillKey,
} from '~/molecules/CustomCreatureForm/fields';
import type {
  ActionFormValues,
  AttackFormValues,
  CustomCreatureFormValues,
  TraitFormValues,
} from '~/molecules/CustomCreatureForm';

/** Every curated creature-level field the form edits — `StatblockSourceCreature`
 * happens to be exactly this set already, since both were drawn from the
 * same curated list (issue #3). */
type RawCreature = StatblockSourceCreature;

type RawTrait = Pick<TraitFormValues, 'name' | 'desc'> & {
  type: string | null;
};

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

type ToCustomCreatureFormValuesArgs = {
  creature: RawCreature;
  traits: readonly RawTrait[];
  actions: readonly RawAction[];
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
 * Turns a raw creature row (library or custom — both share the same field
 * names, see `~/server/db/schema`) plus its traits/actions into the form's
 * string-sentinel draft shape. The reverse of
 * `toCreateCustomCreatureInput`, and the reason "reskin an existing
 * creature" and "edit a custom creature" can share one form: both start
 * from the same raw shape, never from a rendered `Statblock`.
 */
export const toCustomCreatureFormValues = ({
  creature,
  traits,
  actions,
}: ToCustomCreatureFormValuesArgs): CustomCreatureFormValues => ({
  name: creature.name,
  size: creature.size,
  type: creature.type,
  alignment: creature.alignment,
  challengeRating: creature.challengeRating,
  armorClass: creature.armorClass,
  armorDetail: textToField(creature.armorDetail),
  hitPoints: creature.hitPoints,
  hitDice: creature.hitDice,
  initiativeBonus: numberToField(creature.initiativeBonus),

  abilityScores: Object.fromEntries(
    ABILITY_FIELDS.map(([key, scoreField]) => [key, creature[scoreField]]),
  ) as Record<AbilityKey, number>,

  savingThrows: Object.fromEntries(
    ABILITY_FIELDS.map(([key, , saveField]) => [
      key,
      numberToField(creature[saveField]),
    ]),
  ) as Record<AbilityKey, string>,

  skills: Object.fromEntries(
    SKILL_FIELDS.map(([key, field]) => [key, numberToField(creature[field])]),
  ) as Record<SkillKey, string>,

  walk: numberToField(creature.walk),
  swim: numberToField(creature.swim),
  fly: numberToField(creature.fly),
  climb: numberToField(creature.climb),
  burrow: numberToField(creature.burrow),
  hover: creature.hover,

  darkvisionRange: numberToField(creature.darkvisionRange),
  blindsightRange: numberToField(creature.blindsightRange),
  tremorsenseRange: numberToField(creature.tremorsenseRange),
  truesightRange: numberToField(creature.truesightRange),
  telepathyRange: numberToField(creature.telepathyRange),
  passivePerception: creature.passivePerception,

  damageImmunitiesDisplay: textToField(creature.damageImmunitiesDisplay),
  damageResistancesDisplay: textToField(creature.damageResistancesDisplay),
  damageVulnerabilitiesDisplay: textToField(
    creature.damageVulnerabilitiesDisplay,
  ),
  conditionImmunitiesDisplay: textToField(creature.conditionImmunitiesDisplay),
  languagesDesc: textToField(creature.languagesDesc),

  traits: traits.map((trait): TraitFormValues => ({
    name: trait.name,
    desc: trait.desc,
    type: textToField(trait.type),
  })),
  actions: actions.map((action): ActionFormValues => ({
    name: action.name,
    desc: action.desc,
    actionType: action.actionType as ActionFormValues['actionType'],
    legendaryActionCost: numberToField(action.legendaryActionCost),
    attack: action.attack ? toAttackFormValues(action.attack) : null,
  })),
});
