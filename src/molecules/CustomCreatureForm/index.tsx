'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import {
  Form,
  Field,
  Label,
  Actions,
} from '~/molecules/CustomCreatureForm/styled';
import { IdentityFields } from '~/molecules/CustomCreatureForm/components/IdentityFields';
import { AbilityScoreFields } from '~/molecules/CustomCreatureForm/components/AbilityScoreFields';
import { SkillFields } from '~/molecules/CustomCreatureForm/components/SkillFields';
import { MovementAndSensesFields } from '~/molecules/CustomCreatureForm/components/MovementAndSensesFields';
import { TraitRows } from '~/molecules/CustomCreatureForm/components/TraitRows';
import { ActionRows } from '~/molecules/CustomCreatureForm/components/ActionRows';
import {
  ABILITY_FIELDS,
  SKILL_FIELDS,
  type AbilityKey,
  type SkillKey,
} from '~/molecules/CustomCreatureForm/fields';
import type { CreateCustomCreatureInput } from '~/server/trpc/schemas/customCreatures';

export type TraitFormValues = {
  name: string;
  desc: string;
  type: string;
};

export type AttackFormValues = {
  name: string;
  attackType: string;
  toHitMod: string;
  reach: string;
  range: string;
  longRange: string;
  targetCreatureOnly: boolean;
  damageDieCount: string;
  damageDieType: string;
  damageBonus: string;
  damageType: string;
  extraDamageDieCount: string;
  extraDamageDieType: string;
  extraDamageBonus: string;
  extraDamageType: string;
};

export type ActionFormValues = {
  name: string;
  desc: string;
  actionType: 'ACTION' | 'BONUS_ACTION' | 'REACTION' | 'LEGENDARY_ACTION';
  legendaryActionCost: string;
  attack: AttackFormValues | null;
};

export type CustomCreatureFormValues = {
  name: string;
  size: string;
  type: string;
  alignment: string;
  challengeRating: number;
  armorClass: number;
  armorDetail: string;
  hitPoints: number;
  hitDice: string;
  initiativeBonus: string;
  abilityScores: Record<AbilityKey, number>;
  savingThrows: Record<AbilityKey, string>;
  skills: Record<SkillKey, string>;
  walk: string;
  swim: string;
  fly: string;
  climb: string;
  burrow: string;
  hover: boolean;
  darkvisionRange: string;
  blindsightRange: string;
  tremorsenseRange: string;
  truesightRange: string;
  telepathyRange: string;
  passivePerception: number;
  damageImmunitiesDisplay: string;
  damageResistancesDisplay: string;
  damageVulnerabilitiesDisplay: string;
  conditionImmunitiesDisplay: string;
  languagesDesc: string;
  traits: TraitFormValues[];
  actions: ActionFormValues[];
};

export const emptyCustomCreatureForm: CustomCreatureFormValues = {
  name: '',
  size: 'medium',
  type: 'humanoid',
  alignment: 'unaligned',
  challengeRating: 0,
  armorClass: 10,
  armorDetail: '',
  hitPoints: 10,
  hitDice: '2d8 + 2',
  initiativeBonus: '',
  abilityScores: {
    Strength: 10,
    Dexterity: 10,
    Constitution: 10,
    Intelligence: 10,
    Wisdom: 10,
    Charisma: 10,
  },
  savingThrows: {
    Strength: '',
    Dexterity: '',
    Constitution: '',
    Intelligence: '',
    Wisdom: '',
    Charisma: '',
  },
  skills: Object.fromEntries(SKILL_FIELDS.map(([key]) => [key, ''])) as Record<
    SkillKey,
    string
  >,
  walk: '30',
  swim: '',
  fly: '',
  climb: '',
  burrow: '',
  hover: false,
  darkvisionRange: '',
  blindsightRange: '',
  tremorsenseRange: '',
  truesightRange: '',
  telepathyRange: '',
  passivePerception: 10,
  damageImmunitiesDisplay: '',
  damageResistancesDisplay: '',
  damageVulnerabilitiesDisplay: '',
  conditionImmunitiesDisplay: '',
  languagesDesc: '',
  traits: [],
  actions: [],
};

const parseOptionalInt = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const blankToUndefined = (raw: string): string | undefined =>
  raw.trim() === '' ? undefined : raw.trim();

/**
 * Flattens the form's string-sentinel draft shape into the shape
 * `customCreatures.create`/`.update` expect — blank strings become
 * `undefined` rather than empty text, so an unset save/skill/sense reads as
 * "not proficient"/"absent" exactly like an imported library creature.
 */
export const toCreateCustomCreatureInput = (
  values: CustomCreatureFormValues,
): Omit<CreateCustomCreatureInput, 'traits' | 'actions'> & {
  traits: CreateCustomCreatureInput['traits'];
  actions: CreateCustomCreatureInput['actions'];
} => ({
  name: values.name.trim(),
  size: values.size.trim(),
  type: values.type.trim(),
  alignment: values.alignment.trim(),
  challengeRating: values.challengeRating,
  armorClass: values.armorClass,
  armorDetail: blankToUndefined(values.armorDetail),
  hitPoints: values.hitPoints,
  hitDice: values.hitDice.trim(),
  initiativeBonus: parseOptionalInt(values.initiativeBonus),

  abilityScoreStrength: values.abilityScores.Strength,
  abilityScoreDexterity: values.abilityScores.Dexterity,
  abilityScoreConstitution: values.abilityScores.Constitution,
  abilityScoreIntelligence: values.abilityScores.Intelligence,
  abilityScoreWisdom: values.abilityScores.Wisdom,
  abilityScoreCharisma: values.abilityScores.Charisma,

  ...(Object.fromEntries(
    ABILITY_FIELDS.map(([key, , saveField]) => [
      saveField,
      parseOptionalInt(values.savingThrows[key]),
    ]),
  ) as Record<(typeof ABILITY_FIELDS)[number][2], number | undefined>),

  ...(Object.fromEntries(
    SKILL_FIELDS.map(([key, field]) => [
      field,
      parseOptionalInt(values.skills[key]),
    ]),
  ) as Record<(typeof SKILL_FIELDS)[number][1], number | undefined>),

  walk: parseOptionalInt(values.walk),
  swim: parseOptionalInt(values.swim),
  fly: parseOptionalInt(values.fly),
  climb: parseOptionalInt(values.climb),
  burrow: parseOptionalInt(values.burrow),
  hover: values.hover,

  darkvisionRange: parseOptionalInt(values.darkvisionRange),
  blindsightRange: parseOptionalInt(values.blindsightRange),
  tremorsenseRange: parseOptionalInt(values.tremorsenseRange),
  truesightRange: parseOptionalInt(values.truesightRange),
  telepathyRange: parseOptionalInt(values.telepathyRange),
  passivePerception: values.passivePerception,

  damageImmunitiesDisplay: blankToUndefined(values.damageImmunitiesDisplay),
  damageResistancesDisplay: blankToUndefined(values.damageResistancesDisplay),
  damageVulnerabilitiesDisplay: blankToUndefined(
    values.damageVulnerabilitiesDisplay,
  ),
  conditionImmunitiesDisplay: blankToUndefined(
    values.conditionImmunitiesDisplay,
  ),
  languagesDesc: blankToUndefined(values.languagesDesc),

  traits: values.traits.map(trait => ({
    name: trait.name.trim(),
    desc: trait.desc.trim(),
    type: blankToUndefined(trait.type),
  })),
  actions: values.actions.map(action => ({
    name: action.name.trim(),
    desc: action.desc.trim(),
    actionType: action.actionType,
    legendaryActionCost: parseOptionalInt(action.legendaryActionCost),
    attack: action.attack
      ? {
          name: action.attack.name.trim(),
          attackType: blankToUndefined(action.attack.attackType),
          toHitMod: parseOptionalInt(action.attack.toHitMod),
          reach: parseOptionalInt(action.attack.reach),
          range: parseOptionalInt(action.attack.range),
          longRange: parseOptionalInt(action.attack.longRange),
          targetCreatureOnly: action.attack.targetCreatureOnly,
          damageDieCount: parseOptionalInt(action.attack.damageDieCount),
          damageDieType: blankToUndefined(action.attack.damageDieType),
          damageBonus: parseOptionalInt(action.attack.damageBonus),
          damageType: blankToUndefined(action.attack.damageType),
          extraDamageDieCount: parseOptionalInt(
            action.attack.extraDamageDieCount,
          ),
          extraDamageDieType: blankToUndefined(
            action.attack.extraDamageDieType,
          ),
          extraDamageBonus: parseOptionalInt(action.attack.extraDamageBonus),
          extraDamageType: blankToUndefined(action.attack.extraDamageType),
        }
      : undefined,
  })),
});

type CustomCreatureFormProps = {
  initialValues?: CustomCreatureFormValues;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (values: CustomCreatureFormValues) => void;
  onCancel: () => void;
};

/**
 * Uncontrolled from the caller's point of view, like `CharacterForm`: it owns
 * its own draft state and only reports a complete set of values on submit.
 *
 * Sized up for the curated statblock field set (issue #3) — split into
 * sub-components per field group so this file stays a thin orchestrator.
 */
export const CustomCreatureForm = ({
  initialValues = emptyCustomCreatureForm,
  isSaving,
  submitLabel,
  onSubmit,
  onCancel,
}: CustomCreatureFormProps) => {
  const [values, setValues] = useState(initialValues);

  const patch = (next: Partial<CustomCreatureFormValues>) =>
    setValues(current => ({ ...current, ...next }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <IdentityFields values={values} onChange={patch} />
      <AbilityScoreFields values={values} onChange={patch} />
      <SkillFields values={values} onChange={patch} />
      <MovementAndSensesFields values={values} onChange={patch} />

      <Field>
        <Label htmlFor="custom-creature-languages">Languages</Label>
        <TextInput
          id="custom-creature-languages"
          value={values.languagesDesc}
          placeholder="Common, Goblin"
          onChange={event => patch({ languagesDesc: event.target.value })}
        />
      </Field>

      <TraitRows
        traits={values.traits}
        onChange={traits => patch({ traits })}
      />
      <ActionRows
        actions={values.actions}
        onChange={actions => patch({ actions })}
      />

      <Actions>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </Actions>
    </Form>
  );
};
