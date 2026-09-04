'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import {
  rerollMonsterDrafts,
  toInitiativeDrafts,
  toInitiativeValues,
  type InitiativeRollEntry,
} from '~/utils/initiativeRoll';

export type InitiativeRollRow = InitiativeRollEntry & {
  displayName: string;
};

export type InitiativeRollFormProps = {
  rows: readonly InitiativeRollRow[];
  isSaving: boolean;
  onSubmit: (values: { id: string; initiative: number }[]) => void;
  onCancel: () => void;
};

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
    <Form onSubmit={handleSubmit}>
      <Rows>
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
      </Rows>

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
    </Form>
  );
};

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const Rows = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const Row = styled.div`
  display: grid;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  grid-template-columns: minmax(0, 1fr) 6rem;
  padding: ${props => props.theme.space.xs} 0;
`;

const Name = styled.label`
  display: flex;
  align-items: baseline;
  gap: ${props => props.theme.space.sm};
  color: ${props => props.theme.color.textPrimary};
  font-weight: 600;
`;

const Tag = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${props => props.theme.color.accent};
`;

const Field = styled.div`
  display: flex;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  flex-wrap: wrap;
`;

const Spacer = styled.div`
  flex: 1;
`;
