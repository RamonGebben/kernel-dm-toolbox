'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { Select } from '~/atoms/FormControls';
import {
  characterClasses,
  srdSpecies,
  srdSubclassByClass,
  type CharacterClass,
} from '~/content/characterOptions';

export type CharacterFormValues = {
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
  gold: number;
  notes: string;
  isActive: boolean;
};

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
  gold: 0,
  notes: '',
  isActive: true,
};

type NumberKey =
  'armorClass' | 'maxHitPoints' | 'initiativeModifier' | 'level' | 'gold';

type PassiveKey =
  'passivePerception' | 'passiveInsight' | 'passiveInvestigation';

type TextKey = 'name' | 'playerName' | 'subclass' | 'species' | 'notes';

const isCharacterClass = (value: string): value is CharacterClass =>
  (characterClasses as readonly string[]).includes(value);

/** A blank passive box is null; anything typed is a number. */
const toPassive = (raw: string): number | null =>
  raw.trim() === '' ? null : Number(raw) || 0;

type CharacterFormProps = {
  initialValues?: CharacterFormValues;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: (values: CharacterFormValues) => void;
  onCancel: () => void;
};

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
    <Form onSubmit={handleSubmit}>
      <Grid $columns={2}>
        <Field>
          <Label htmlFor="character-name">Name</Label>
          <TextInput
            id="character-name"
            value={values.name}
            required
            onChange={event => setText('name')(event.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="character-player">Player</Label>
          <TextInput
            id="character-player"
            value={values.playerName}
            onChange={event => setText('playerName')(event.target.value)}
          />
        </Field>
      </Grid>

      <Grid $columns={3}>
        <Field>
          <Label htmlFor="character-class">Class</Label>
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
          <Label htmlFor="character-subclass">Subclass</Label>
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
          <Label htmlFor="character-species">Species</Label>
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
          <Label htmlFor="character-level">Level</Label>
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
          <Label htmlFor="character-ac">AC</Label>
          <TextInput
            id="character-ac"
            type="number"
            min={0}
            value={values.armorClass}
            onChange={event => setNumber('armorClass')(event.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="character-hp">Max HP</Label>
          <TextInput
            id="character-hp"
            type="number"
            min={1}
            value={values.maxHitPoints}
            onChange={event => setNumber('maxHitPoints')(event.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="character-init">Init</Label>
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
          <Label htmlFor="character-passive-perception">
            Passive Perception
          </Label>
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
          <Label htmlFor="character-passive-insight">Passive Insight</Label>
          <TextInput
            id="character-passive-insight"
            type="number"
            min={0}
            value={values.passiveInsight ?? ''}
            onChange={event => setPassive('passiveInsight')(event.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="character-passive-investigation">
            Passive Investigation
          </Label>
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

      <Grid $columns={3}>
        <Field>
          <Label htmlFor="character-gold">Gold (gp)</Label>
          <TextInput
            id="character-gold"
            type="number"
            min={0}
            value={values.gold}
            onChange={event => setNumber('gold')(event.target.value)}
          />
        </Field>
        <CheckboxField>
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
          <Label htmlFor="character-active">Active party member</Label>
        </CheckboxField>
      </Grid>

      <Field>
        <Label htmlFor="character-notes">Notes</Label>
        <TextArea
          id="character-notes"
          rows={4}
          value={values.notes}
          onChange={event => setText('notes')(event.target.value)}
        />
      </Field>

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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  min-width: 0;
`;

const CheckboxField = styled.div`
  display: flex;
  align-items: center;
  align-self: end;
  gap: ${props => props.theme.space.sm};
  padding-bottom: ${props => props.theme.space.sm};
`;

const Grid = styled.div<{ $columns: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.$columns}, minmax(0, 1fr));
  gap: ${props => props.theme.space.sm};
`;

const Label = styled.label`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const ClassSelect = styled(Select)`
  padding: ${props => props.theme.space.sm};
  font-size: ${props => props.theme.fontSize.md};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
  resize: vertical;
`;

const Actions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;
