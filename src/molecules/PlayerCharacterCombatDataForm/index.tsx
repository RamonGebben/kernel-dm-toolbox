'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import {
  Actions,
  Form,
  SectionTitle,
} from '~/molecules/CustomCreatureForm/styled';
import { ActionRows } from '~/molecules/CustomCreatureForm/components/ActionRows';
import type {
  ActionFormValues,
  AttackFormValues,
} from '~/molecules/CustomCreatureForm';
import { SpellRows } from '~/molecules/PlayerCharacterCombatDataForm/components/SpellRows';
import { SpellSlotRows } from '~/molecules/PlayerCharacterCombatDataForm/components/SpellSlotRows';
import { ResourceRows } from '~/molecules/PlayerCharacterCombatDataForm/components/ResourceRows';
import type { CharacterActionInput } from '~/server/trpc/schemas/characters';

export type SpellFormValues = {
  spellSlug: string;
  /** Display only — never sent to the server, which only stores the slug. */
  name: string;
  isPrepared: boolean;
  isAlwaysAvailable: boolean;
};

export type SpellSlotFormValues = {
  spellLevel: number;
  maxSlots: string;
};

export type ResourceFormValues = {
  resourceKey: string;
  name: string;
  maxUses: string;
  isUnlimited: boolean;
  resetsOn: 'SHORT_REST' | 'LONG_REST';
};

export type PlayerCharacterCombatDataFormValues = {
  actions: ActionFormValues[];
  spells: SpellFormValues[];
  spellSlots: SpellSlotFormValues[];
  resources: ResourceFormValues[];
};

export const SPELL_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export const emptyPlayerCharacterCombatDataForm: PlayerCharacterCombatDataFormValues =
  {
    actions: [],
    spells: [],
    spellSlots: SPELL_LEVELS.map(spellLevel => ({
      spellLevel,
      maxSlots: '0',
    })),
    resources: [],
  };

const parseOptionalInt = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const blankToUndefined = (raw: string): string | undefined =>
  raw.trim() === '' ? undefined : raw.trim();

const toAttackInput = (attack: AttackFormValues) => ({
  name: attack.name.trim(),
  attackType: blankToUndefined(attack.attackType),
  toHitMod: parseOptionalInt(attack.toHitMod),
  reach: parseOptionalInt(attack.reach),
  range: parseOptionalInt(attack.range),
  longRange: parseOptionalInt(attack.longRange),
  targetCreatureOnly: attack.targetCreatureOnly,
  damageDieCount: parseOptionalInt(attack.damageDieCount),
  damageDieType: blankToUndefined(attack.damageDieType),
  damageBonus: parseOptionalInt(attack.damageBonus),
  damageType: blankToUndefined(attack.damageType),
  extraDamageDieCount: parseOptionalInt(attack.extraDamageDieCount),
  extraDamageDieType: blankToUndefined(attack.extraDamageDieType),
  extraDamageBonus: parseOptionalInt(attack.extraDamageBonus),
  extraDamageType: blankToUndefined(attack.extraDamageType),
});

/**
 * Flattens the form's string-sentinel draft shape into
 * `characters.updateCombatData`'s input — the PC-editing equivalent of
 * `toCreateCustomCreatureInput`. Zero-slot spell-slot rows and blank
 * resource rows are dropped rather than round-tripped, so clearing a field
 * removes the row instead of persisting a zero.
 */
export const toUpdateCombatDataInput = (
  id: string,
  values: PlayerCharacterCombatDataFormValues,
) => ({
  id,
  actions: values.actions.map((action): CharacterActionInput => ({
    name: action.name.trim(),
    desc: action.desc.trim(),
    actionType: action.actionType,
    legendaryActionCost: parseOptionalInt(action.legendaryActionCost),
    attack: action.attack ? toAttackInput(action.attack) : undefined,
  })),
  spells: values.spells.map(spell => ({
    spellSlug: spell.spellSlug,
    isPrepared: spell.isPrepared,
    isAlwaysAvailable: spell.isAlwaysAvailable,
  })),
  spellSlots: values.spellSlots
    .map(slot => ({
      spellLevel: slot.spellLevel,
      maxSlots: Number.parseInt(slot.maxSlots, 10) || 0,
    }))
    .filter(slot => slot.maxSlots > 0),
  resources: values.resources
    .filter(resource => resource.name.trim() !== '')
    .map(resource => ({
      resourceKey: resource.resourceKey,
      name: resource.name.trim(),
      maxUses: resource.isUnlimited
        ? undefined
        : parseOptionalInt(resource.maxUses),
      isUnlimited: resource.isUnlimited,
      resetsOn: resource.resetsOn,
    })),
});

export type SpellOption = { slug: string; name: string };

type PlayerCharacterCombatDataFormProps = {
  initialValues?: PlayerCharacterCombatDataFormValues;
  isSaving: boolean;
  /** The chosen class's known spell list, for the "add spell" picker. Empty
   * for a non-caster class. */
  availableSpells: readonly SpellOption[];
  onSubmit: (values: PlayerCharacterCombatDataFormValues) => void;
};

/**
 * The materialized-PC editor: actions(+attacks), spells, spell slots and
 * resources, all freely editable after a class template is applied —
 * `ClassTemplateWizard`'s second step. Reuses `ActionRows` directly from
 * `CustomCreatureForm` since `player_character_actions` mirrors
 * `custom_creature_actions` field-for-field (issue #5).
 *
 * Uncontrolled from the caller's point of view, matching `CustomCreatureForm`
 * — it owns its own draft state and only reports a complete set of values on
 * submit.
 */
export const PlayerCharacterCombatDataForm = ({
  initialValues = emptyPlayerCharacterCombatDataForm,
  isSaving,
  availableSpells,
  onSubmit,
}: PlayerCharacterCombatDataFormProps) => {
  const [values, setValues] = useState(initialValues);

  const patch = (next: Partial<PlayerCharacterCombatDataFormValues>) =>
    setValues(current => ({ ...current, ...next }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <ActionRows
        actions={values.actions}
        onChange={actions => patch({ actions })}
      />

      <div>
        <SectionTitle>Spells</SectionTitle>
        <SpellRows
          spells={values.spells}
          availableSpells={availableSpells}
          onChange={spells => patch({ spells })}
        />
      </div>

      <div>
        <SectionTitle>Spell Slots</SectionTitle>
        <SpellSlotRows
          spellSlots={values.spellSlots}
          onChange={spellSlots => patch({ spellSlots })}
        />
      </div>

      <div>
        <SectionTitle>Resources</SectionTitle>
        <ResourceRows
          resources={values.resources}
          onChange={resources => patch({ resources })}
        />
      </div>

      <Actions>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </Actions>
    </Form>
  );
};
