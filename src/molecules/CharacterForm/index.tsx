'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';

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

  const setNumber = (key: keyof CharacterFormValues) => (raw: string) =>
    setValues(current => ({ ...current, [key]: Number(raw) || 0 }));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${props => props.theme.space.sm};
`;

const Label = styled.label`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Actions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
`;
