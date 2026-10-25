'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { Card } from '~/atoms/Card';
import { Readout } from '~/molecules/HitPointControls/components/Readout';
import { Current } from '~/molecules/HitPointControls/components/Current';
import { Temporary } from '~/molecules/HitPointControls/components/Temporary';
import { Row } from '~/molecules/HitPointControls/components/Row';

export interface HitPointControlsProps {
  currentHitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  isPending: boolean;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onGrantTemporary: (amount: number) => void;
}

/**
 * Damage, healing and temporary hit points for the selected combatant.
 *
 * One amount field feeding three actions, because at the table the DM already
 * knows the number before they know which button it is — "seventeen" comes
 * first, "damage" second.
 */
export const HitPointControls = ({
  currentHitPoints,
  maxHitPoints,
  temporaryHitPoints,
  isPending,
  onDamage,
  onHeal,
  onGrantTemporary,
}: HitPointControlsProps) => {
  const [amount, setAmount] = useState('');
  const parsed = Number.parseInt(amount, 10);
  const isValid = Number.isFinite(parsed) && parsed > 0;

  const apply = (action: (value: number) => void) => () => {
    if (!isValid) return;

    action(parsed);
    setAmount('');
  };

  // Enter applies damage: it is what a DM reaches for most.
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    apply(onDamage)();
  };

  return (
    <Card as="form" onSubmit={handleSubmit}>
      <Readout>
        <Current>
          {currentHitPoints}/{maxHitPoints}
        </Current>
        {temporaryHitPoints > 0 && (
          <Temporary>+{temporaryHitPoints} temp</Temporary>
        )}
      </Readout>

      <Row>
        <TextInput
          type="number"
          min={1}
          value={amount}
          placeholder="0"
          aria-label="Amount"
          onChange={event => setAmount(event.target.value)}
        />
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={!isValid || isPending}
        >
          Damage
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!isValid || isPending}
          onClick={apply(onHeal)}
        >
          Heal
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!isValid || isPending}
          onClick={apply(onGrantTemporary)}
        >
          Temp
        </Button>
      </Row>
    </Card>
  );
};
