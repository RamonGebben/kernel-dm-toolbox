'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { Form } from '~/molecules/ConditionPicker/components/Form';
import { Select } from '~/molecules/ConditionPicker/components/Select';

export interface ConditionOption {
  slug: string;
  name: string;
}

export interface ConditionPickerProps {
  options: ReadonlyArray<ConditionOption>;
  isPending: boolean;
  onApply: (input: {
    conditionSlug: string;
    roundsRemaining: number | null;
  }) => void;
}

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
