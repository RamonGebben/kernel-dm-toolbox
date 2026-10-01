'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { CheckboxRow, FieldRow } from '~/atoms/FormControls';
import { TextInput } from '~/atoms/TextInput';

export type BastionSettingsValues = {
  name: string;
  notes: string;
  defenderCount: number;
  wallSquares: number;
  isFullyEnclosed: boolean;
};

export type BastionSettingsFormProps = {
  initialValues: BastionSettingsValues;
  isSaving: boolean;
  onSubmit: (values: BastionSettingsValues) => void;
  onCancel: () => void;
};

/**
 * The bastion's own record, corrected by hand: its name and notes, and the
 * defenders and walls it already had before the app was tracking it.
 */
export const BastionSettingsForm = ({
  initialValues,
  isSaving,
  onSubmit,
  onCancel,
}: BastionSettingsFormProps) => {
  const [values, setValues] = useState(initialValues);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <Form onSubmit={submit}>
      <FieldRow>
        <label htmlFor="bastion-settings-name">Name</label>
        <TextInput
          id="bastion-settings-name"
          required
          value={values.name}
          onChange={event =>
            setValues(current => ({ ...current, name: event.target.value }))
          }
        />
      </FieldRow>
      <Grid>
        <FieldRow>
          <label htmlFor="bastion-settings-defenders">Defenders</label>
          <TextInput
            id="bastion-settings-defenders"
            type="number"
            min={0}
            value={values.defenderCount}
            onChange={event =>
              setValues(current => ({
                ...current,
                defenderCount: Math.max(0, Number(event.target.value) || 0),
              }))
            }
          />
        </FieldRow>
        <FieldRow>
          <label htmlFor="bastion-settings-walls">Wall squares</label>
          <TextInput
            id="bastion-settings-walls"
            type="number"
            min={0}
            value={values.wallSquares}
            onChange={event =>
              setValues(current => ({
                ...current,
                wallSquares: Math.max(0, Number(event.target.value) || 0),
              }))
            }
          />
        </FieldRow>
      </Grid>
      <CheckboxRow>
        <input
          id="bastion-settings-enclosed"
          type="checkbox"
          checked={values.isFullyEnclosed}
          onChange={event =>
            setValues(current => ({
              ...current,
              isFullyEnclosed: event.target.checked,
            }))
          }
        />
        <label htmlFor="bastion-settings-enclosed">
          Walls fully enclose the bastion
        </label>
      </CheckboxRow>
      <FieldRow>
        <label htmlFor="bastion-settings-notes">Notes</label>
        <TextArea
          id="bastion-settings-notes"
          rows={4}
          value={values.notes}
          onChange={event =>
            setValues(current => ({ ...current, notes: event.target.value }))
          }
        />
      </FieldRow>
      <Actions>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
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

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${props => props.theme.space.sm};
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
