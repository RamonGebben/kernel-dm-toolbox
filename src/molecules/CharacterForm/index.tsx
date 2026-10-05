'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { SearchableSelect } from '~/atoms/SearchableSelect';

export type CharacterFormValues = {
  name: string;
  playerName: string;
  armorClass: number;
  maxHitPoints: number;
  initiativeModifier: number;
  level: number;
};

export const emptyCharacterForm: CharacterFormValues = {
  name: '',
  playerName: '',
  armorClass: 10,
  maxHitPoints: 10,
  initiativeModifier: 0,
  level: 1,
};

export type CharacterFormClassOption = {
  slug: string;
  name: string;
  /** Null for a base class; the parent class's slug for a subclass. */
  subclassOfSlug: string | null;
};

export type CharacterFormClassPick = {
  classSlug: string;
  subclassSlug: string;
} | null;

/**
 * A new character picks class/subclass/level right here, applied
 * immediately on save — nothing to overwrite yet. An existing character's
 * class instead opens the standalone `ClassTemplateWizard`, which already
 * handles warning before it wipes a hand-edited action/spell list; this form
 * only ever shows what's already applied and a way to change it.
 */
export type CharacterFormClassField =
  | { mode: 'pick'; options: readonly CharacterFormClassOption[] }
  | { mode: 'readonly'; label: string | null; onOpenWizard: () => void };

type CharacterFormProps = {
  initialValues?: CharacterFormValues;
  isSaving: boolean;
  submitLabel: string;
  classField: CharacterFormClassField;
  onSubmit: (
    values: CharacterFormValues,
    classPick: CharacterFormClassPick,
  ) => void;
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
  classField,
  onSubmit,
  onCancel,
}: CharacterFormProps) => {
  const [values, setValues] = useState(initialValues);
  const [classSlug, setClassSlug] = useState('');
  const [subclassSlug, setSubclassSlug] = useState('');

  const setNumber = (key: keyof CharacterFormValues) => (raw: string) =>
    setValues(current => ({ ...current, [key]: Number(raw) || 0 }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const classPick: CharacterFormClassPick =
      classField.mode === 'pick' && classSlug
        ? { classSlug, subclassSlug }
        : null;
    onSubmit(values, classPick);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <Label htmlFor="character-name">Name</Label>
        <TextInput
          id="character-name"
          value={values.name}
          required
          onChange={event =>
            setValues(current => ({ ...current, name: event.target.value }))
          }
        />
      </Field>

      <Field>
        <Label htmlFor="character-player">Player</Label>
        <TextInput
          id="character-player"
          value={values.playerName}
          onChange={event =>
            setValues(current => ({
              ...current,
              playerName: event.target.value,
            }))
          }
        />
      </Field>

      <Grid>
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

      {classField.mode === 'pick' ? (
        <ClassPickerFields
          options={classField.options}
          classSlug={classSlug}
          subclassSlug={subclassSlug}
          onClassChange={slug => {
            setClassSlug(slug);
            setSubclassSlug('');
          }}
          onSubclassChange={setSubclassSlug}
        />
      ) : (
        <ClassSummaryField
          label={classField.label}
          onOpenWizard={classField.onOpenWizard}
        />
      )}

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

type ClassPickerFieldsProps = {
  options: readonly CharacterFormClassOption[];
  classSlug: string;
  subclassSlug: string;
  onClassChange: (slug: string) => void;
  onSubclassChange: (slug: string) => void;
};

/** Same base-class/subclass split `ClassTemplateWizardView`'s `PickStep`
 * uses, so a DM sees the identical shape whether they're creating a
 * character or changing an existing one's class later. */
const ClassPickerFields = ({
  options,
  classSlug,
  subclassSlug,
  onClassChange,
  onSubclassChange,
}: ClassPickerFieldsProps) => {
  const baseClasses = options.filter(option => option.subclassOfSlug === null);
  const subclassOptions = options.filter(
    option => option.subclassOfSlug === classSlug,
  );

  return (
    <Grid $columns={2}>
      <Field>
        <Label>Class</Label>
        <SearchableSelect
          label="Class"
          placeholder="No class yet"
          value={classSlug}
          options={baseClasses.map(option => ({
            value: option.slug,
            label: option.name,
          }))}
          onChange={onClassChange}
        />
      </Field>

      {subclassOptions.length > 0 && (
        <Field>
          <Label>Subclass</Label>
          <SearchableSelect
            label="Subclass"
            placeholder="None yet"
            value={subclassSlug}
            options={subclassOptions.map(option => ({
              value: option.slug,
              label: option.name,
            }))}
            onChange={onSubclassChange}
          />
        </Field>
      )}
    </Grid>
  );
};

type ClassSummaryFieldProps = {
  label: string | null;
  onOpenWizard: () => void;
};

const ClassSummaryField = ({ label, onOpenWizard }: ClassSummaryFieldProps) => (
  <Field>
    <Label>Class</Label>
    <ClassSummaryRow>
      <ClassSummaryLabel>{label ?? 'No class assigned'}</ClassSummaryLabel>
      <Button type="button" variant="ghost" size="sm" onClick={onOpenWizard}>
        {label ? 'Change class' : 'Assign class'}
      </Button>
    </ClassSummaryRow>
  </Field>
);

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.md};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const Grid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(
    ${props => props.$columns ?? 4},
    minmax(0, 1fr)
  );
  gap: ${props => props.theme.space.sm};
`;

const ClassSummaryRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
`;

const ClassSummaryLabel = styled.span`
  color: ${props => props.theme.color.textPrimary};
`;

const Label = styled.label`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Actions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;
