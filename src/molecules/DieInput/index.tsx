'use client';

import { useId } from 'react';
import { Button } from '~/atoms/Button';
import { rollExpression } from '~/utils/rollDice';
import { Row } from '~/molecules/DieInput/components/Row';
import { Dice } from '~/molecules/DieInput/components/Dice';
import { Input } from '~/molecules/DieInput/components/Input';

export interface DieInputProps {
  /** What to ask for: "Ask Wren's player to roll". */
  label: string;
  count?: number;
  sides: number;
  /** The total entered, or 0 while nothing has been rolled. */
  value: number;
  onChange: (total: number) => void;
}

/**
 * A dice roll the players make at the table and the DM types in — the total
 * of `count`d`sides`. "Roll for me" is the fallback for someone who is not
 * there; it is never the default.
 */
export const DieInput = ({
  label,
  count = 1,
  sides,
  value,
  onChange,
}: DieInputProps) => {
  const id = useId();
  const dice = `${count === 1 ? 'd' : `${count}d`}${sides === 100 ? '100' : sides}`;

  return (
    <Row>
      <label htmlFor={id}>
        {label} <Dice>{dice}</Dice>
      </label>
      <Input
        id={id}
        type="number"
        min={count}
        max={count * sides}
        value={value || ''}
        onChange={event => onChange(Number(event.target.value) || 0)}
      />
      <Button
        variant="ghost"
        size="sm"
        aria-label={`Roll ${dice} for me`}
        onClick={() => onChange(rollExpression(count, sides, 0).total)}
      >
        Roll for me
      </Button>
    </Row>
  );
};
