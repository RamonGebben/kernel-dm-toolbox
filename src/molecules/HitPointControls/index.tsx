'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';

export type HitPointControlsProps = {
  currentHitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number;
  isPending: boolean;
  onDamage: (amount: number) => void;
  onHeal: (amount: number) => void;
  onGrantTemporary: (amount: number) => void;
};

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
    <Wrapper onSubmit={handleSubmit}>
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
    </Wrapper>
  );
};

const Wrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.md};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Readout = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${props => props.theme.space.sm};
`;

const Current = styled.span`
  font-family: ${props => props.theme.font.mono};
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const Temporary = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.accent};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 4.5rem repeat(3, minmax(0, 1fr));
  gap: ${props => props.theme.space.xs};
`;
