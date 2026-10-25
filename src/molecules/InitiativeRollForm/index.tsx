'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import {
  rerollMonsterDrafts,
  toInitiativeDrafts,
  toInitiativeValues,
  type InitiativeRollEntry,
} from '~/utils/initiativeRoll';
import { Stack } from '~/atoms/Stack';
import { Row } from '~/molecules/InitiativeRollForm/components/Row';
import { Name } from '~/molecules/InitiativeRollForm/components/Name';
import { Tag } from '~/molecules/InitiativeRollForm/components/Tag';
import { Field } from '~/molecules/InitiativeRollForm/components/Field';
import { Actions } from '~/molecules/InitiativeRollForm/components/Actions';
import { Spacer } from '~/molecules/InitiativeRollForm/components/Spacer';

export type InitiativeRollRow = InitiativeRollEntry & {
  displayName: string;
};

export interface InitiativeRollFormProps {
  rows: ReadonlyArray<InitiativeRollRow>;
  isSaving: boolean;
  onSubmit: (values: Array<{ id: string; initiative: number }>) => void;
  onCancel: () => void;
}

/**
 * The "Roll for initiative" form: one number field per combatant, in the order
 * they were added.
 *
 * Monsters arrive prefilled with the roll the tool made for them; the player
 * rows are empty, because at the table the players are the ones rolling and
 * the DM is typing what they call out. All of the arithmetic lives in
 * `~/utils/initiativeRoll`, so this component only wires fields to it.
 */
export const InitiativeRollForm = ({
  rows,
  isSaving,
  onSubmit,
  onCancel,
}: InitiativeRollFormProps) => {
  const [drafts, setDrafts] = useState(() => toInitiativeDrafts(rows));

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(toInitiativeValues(rows, drafts));
  };

  return (
    <Stack as="form" onSubmit={handleSubmit}>
      <Stack $gap="xs">
        {rows.map(row => (
          <Row key={row.id}>
            <Name htmlFor={`initiative-${row.id}`}>
              {row.displayName}
              {row.isPlayerCharacter ? <Tag>player</Tag> : null}
            </Name>
            <Field>
              <TextInput
                id={`initiative-${row.id}`}
                type="number"
                inputMode="numeric"
                min={-20}
                max={50}
                placeholder={row.isPlayerCharacter ? 'Roll' : undefined}
                value={drafts[row.id] ?? ''}
                onChange={event =>
                  setDrafts(current => ({
                    ...current,
                    [row.id]: event.target.value,
                  }))
                }
              />
            </Field>
          </Row>
        ))}
      </Stack>

      <Actions>
        <Button
          variant="ghost"
          type="button"
          onClick={() =>
            setDrafts(current => rerollMonsterDrafts(rows, current))
          }
        >
          Reroll monsters
        </Button>
        <Spacer />
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || rows.length === 0}>
          Start combat
        </Button>
      </Actions>
    </Stack>
  );
};
