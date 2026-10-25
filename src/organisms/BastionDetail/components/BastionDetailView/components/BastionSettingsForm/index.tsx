'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { CheckboxRow } from '~/atoms/CheckboxRow';
import { FieldRow } from '~/atoms/FieldRow';
import { TextInput } from '~/atoms/TextInput';
import { Stack } from '~/atoms/Stack';
import { Grid } from '~/organisms/BastionDetail/components/BastionDetailView/components/BastionSettingsForm/components/Grid';
import { TextArea } from '~/atoms/TextArea';
import { Cluster } from '~/atoms/Cluster';

export interface BastionSettingsValues {
  name: string;
  notes: string;
  defenderCount: number;
  wallSquares: number;
  isFullyEnclosed: boolean;
}

export interface BastionSettingsFormProps {
  initialValues: BastionSettingsValues;
  isSaving: boolean;
  onSubmit: (values: BastionSettingsValues) => void;
  onCancel: () => void;
}

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
    <Stack as="form" $gap="s" onSubmit={submit}>
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
      <Cluster>
        <Button type="submit" size="sm" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </Cluster>
    </Stack>
  );
};
