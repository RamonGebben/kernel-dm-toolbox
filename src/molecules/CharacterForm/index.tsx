'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import {
  characterClasses,
  srdSpecies,
  srdSubclassByClass,
  type CharacterClass,
} from '~/content/characterOptions';
import { Stack } from '~/atoms/Stack';
import { Field } from '~/molecules/CharacterForm/components/Field';
import { InlineRow } from '~/atoms/InlineRow';
import { Grid } from '~/molecules/CharacterForm/components/Grid';
import { FieldLabel } from '~/atoms/FieldLabel';
import { ClassSelect } from '~/molecules/CharacterForm/components/ClassSelect';
import { TextArea } from '~/atoms/TextArea';
import { Cluster } from '~/atoms/Cluster';

export interface CharacterFormValues {
  name: string;
  playerName: string;
  /** `''` is "no class chosen yet". */
  className: CharacterClass | '';
  subclass: string;
  species: string;
  armorClass: number;
  maxHitPoints: number;
  initiativeModifier: number;
  level: number;
  /** Null is "not recorded" — a blank box, not a 0. */
  passivePerception: number | null;
  passiveInsight: number | null;
  passiveInvestigation: number | null;
  notes: string;
  isActive: boolean;
}

export const emptyCharacterForm: CharacterFormValues = {
  name: '',
  playerName: '',
  className: '',
  subclass: '',
  species: '',
  armorClass: 10,
  maxHitPoints: 10,
  initiativeModifier: 0,
  level: 1,
  passivePerception: null,
  passiveInsight: null,
  passiveInvestigation: null,
  notes: '',
  isActive: true,
};

type NumberKey = 'armorClass' | 'maxHitPoints' | 'initiativeModifier' | 'level';

type PassiveKey =
  'passivePerception' | 'passiveInsight' | 'passiveInvestigation';

type TextKey = 'name' | 'playerName' | 'subclass' | 'species' | 'notes';

const isCharacterClass = (value: string): value is CharacterClass =>
  (characterClasses as ReadonlyArray<string>).includes(value);

/** A blank passive box is null; anything typed is a number. */
const toPassive = (raw: string): number | null =>
  raw.trim() === '' ? null : Number(raw) || 0;

interface CharacterFormProps {
  initialValues?: CharacterFormValues;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (values: CharacterFormValues) => void;
  onCancel: () => void;
}

/**
 * Uncontrolled from the caller's point of view: it owns its own draft state
 * and only reports a complete set of values on submit, so a half-typed name
 * never round-trips to the server.
 */
export const CharacterForm = ({
  initialValues = emptyCharacterForm,
  isSaving,
  submitLabel,
  onSubmit,
  onCancel,
}: CharacterFormProps) => {
  const [values, setValues] = useState(initialValues);

  const setText = (key: TextKey) => (raw: string) =>
    setValues(current => ({ ...current, [key]: raw }));

  const setNumber = (key: NumberKey) => (raw: string) =>
    setValues(current => ({ ...current, [key]: Number(raw) || 0 }));

  const setPassive = (key: PassiveKey) => (raw: string) =>
    setValues(current => ({ ...current, [key]: toPassive(raw) }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  const suggestedSubclass = values.className
    ? srdSubclassByClass[values.className]
    : null;

  return (
    <Stack as="form" $gap="s" onSubmit={handleSubmit}>
      <Grid $columns={2}>
        <Field>
          <FieldLabel htmlFor="character-name">Name</FieldLabel>
          <TextInput
            id="character-name"
            value={values.name}
            required
            onChange={event => setText('name')(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="character-player">Player</FieldLabel>
          <TextInput
            id="character-player"
            value={values.playerName}
            onChange={event => setText('playerName')(event.target.value)}
          />
        </Field>
      </Grid>

      <Grid $columns={3}>
        <Field>
          <FieldLabel htmlFor="character-class">Class</FieldLabel>
          <ClassSelect
            id="character-class"
            value={values.className}
            onChange={event => {
              const { value } = event.target;
              setValues(current => ({
                ...current,
                className: isCharacterClass(value) ? value : '',
              }));
            }}
          >
            <option value="">—</option>
            {characterClasses.map(className => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </ClassSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="character-subclass">Subclass</FieldLabel>
          <TextInput
            id="character-subclass"
            list="character-subclass-suggestions"
            value={values.subclass}
            onChange={event => setText('subclass')(event.target.value)}
          />
          <datalist id="character-subclass-suggestions">
            {suggestedSubclass ? <option value={suggestedSubclass} /> : null}
          </datalist>
        </Field>
        <Field>
          <FieldLabel htmlFor="character-species">Species</FieldLabel>
          <TextInput
            id="character-species"
            list="character-species-suggestions"
            value={values.species}
            onChange={event => setText('species')(event.target.value)}
          />
          <datalist id="character-species-suggestions">
            {srdSpecies.map(species => (
              <option key={species} value={species} />
            ))}
          </datalist>
        </Field>
      </Grid>

      <Grid $columns={4}>
        <Field>
          <FieldLabel htmlFor="character-level">Level</FieldLabel>
          <TextInput
            id="character-level"
            type="number"
            min={1}
            max={20}
            value={values.level}
            onChange={event => setNumber('level')(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="character-ac">AC</FieldLabel>
          <TextInput
            id="character-ac"
            type="number"
            min={0}
            value={values.armorClass}
            onChange={event => setNumber('armorClass')(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="character-hp">Max HP</FieldLabel>
          <TextInput
            id="character-hp"
            type="number"
            min={1}
            value={values.maxHitPoints}
            onChange={event => setNumber('maxHitPoints')(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="character-init">Init</FieldLabel>
          <TextInput
            id="character-init"
            type="number"
            value={values.initiativeModifier}
            onChange={event =>
              setNumber('initiativeModifier')(event.target.value)
            }
          />
        </Field>
      </Grid>

      <Grid $columns={3}>
        <Field>
          <FieldLabel htmlFor="character-passive-perception">
            Passive Perception
          </FieldLabel>
          <TextInput
            id="character-passive-perception"
            type="number"
            min={0}
            value={values.passivePerception ?? ''}
            onChange={event =>
              setPassive('passivePerception')(event.target.value)
            }
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="character-passive-insight">
            Passive Insight
          </FieldLabel>
          <TextInput
            id="character-passive-insight"
            type="number"
            min={0}
            value={values.passiveInsight ?? ''}
            onChange={event => setPassive('passiveInsight')(event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="character-passive-investigation">
            Passive Investigation
          </FieldLabel>
          <TextInput
            id="character-passive-investigation"
            type="number"
            min={0}
            value={values.passiveInvestigation ?? ''}
            onChange={event =>
              setPassive('passiveInvestigation')(event.target.value)
            }
          />
        </Field>
      </Grid>

      <InlineRow>
        <input
          id="character-active"
          type="checkbox"
          checked={values.isActive}
          onChange={event =>
            setValues(current => ({
              ...current,
              isActive: event.target.checked,
            }))
          }
        />
        <FieldLabel htmlFor="character-active">Active party member</FieldLabel>
      </InlineRow>

      <Field>
        <FieldLabel htmlFor="character-notes">Notes</FieldLabel>
        <TextArea
          id="character-notes"
          rows={4}
          value={values.notes}
          onChange={event => setText('notes')(event.target.value)}
        />
      </Field>

      <Cluster>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </Cluster>
    </Stack>
  );
};
