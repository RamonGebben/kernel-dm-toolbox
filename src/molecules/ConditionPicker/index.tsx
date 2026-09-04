'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';

export type ConditionOption = {
  slug: string;
  name: string;
};

export type ConditionPickerProps = {
  options: readonly ConditionOption[];
  isPending: boolean;
  onApply: (input: {
    conditionSlug: string;
    roundsRemaining: number | null;
  }) => void;
};

/**
 * Applies a condition, optionally for a number of rounds.
 *
 * The duration field is left blank by default because most conditions at the
 * table are indefinite — Prone lasts until someone stands up, and forcing a
 * number would invent bookkeeping the rules do not ask for.
 */
export const ConditionPicker = ({
  options,
  isPending,
  onApply,
}: ConditionPickerProps) => {
  const [conditionSlug, setConditionSlug] = useState('');
  const [rounds, setRounds] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!conditionSlug) return;

    const parsed = Number.parseInt(rounds, 10);

    onApply({
      conditionSlug,
      roundsRemaining: Number.isFinite(parsed) && parsed > 0 ? parsed : null,
    });
    setConditionSlug('');
    setRounds('');
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Select
        value={conditionSlug}
        aria-label="Condition"
        disabled={options.length === 0}
        onChange={event => setConditionSlug(event.target.value)}
      >
        <option value="">Add condition…</option>
        {options.map(option => (
          <option key={option.slug} value={option.slug}>
            {option.name}
          </option>
        ))}
      </Select>
      <TextInput
        type="number"
        min={1}
        value={rounds}
        placeholder="∞"
        aria-label="Rounds"
        onChange={event => setRounds(event.target.value)}
      />
      <Button type="submit" size="sm" disabled={!conditionSlug || isPending}>
        Apply
      </Button>
    </Form>
  );
};

const Form = styled.form`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.5rem auto;
  gap: ${props => props.theme.space.xs};
`;

const Select = styled.select`
  width: 100%;
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
`;
