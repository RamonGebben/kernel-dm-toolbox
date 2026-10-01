'use client';

import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { formatGold } from '~/utils/applyGoldChange';
import {
  canMoveGold,
  type TreasuryDirection,
} from '~/organisms/PartyTreasury/hooks/usePartyTreasury';

export type PartyTreasuryViewProps = {
  isPending: boolean;
  balance: number;
  isSaving: boolean;
  onMove: (amount: number, direction: TreasuryDirection) => void;
};

/**
 * The shared pot. Each character's own purse is on their card; this is what
 * belongs to the group — and what bastion costs will draw on later.
 */
export const PartyTreasuryView = ({
  isPending,
  balance,
  isSaving,
  onMove,
}: PartyTreasuryViewProps) => {
  const [amount, setAmount] = useState('');
  const parsed = Number(amount);

  const move = (direction: TreasuryDirection) => (event?: FormEvent) => {
    event?.preventDefault();
    if (!canMoveGold(balance, parsed, direction)) return;

    onMove(parsed, direction);
    setAmount('');
  };

  if (isPending)
    return <Skeleton role="status" aria-label="Loading the treasury" />;

  return (
    <Wrapper>
      <Balance aria-label="Treasury balance">{formatGold(balance)}</Balance>

      <Form onSubmit={move('deposit')}>
        <Label htmlFor="treasury-amount">Amount (gp)</Label>
        <TextInput
          id="treasury-amount"
          type="number"
          min={1}
          step={1}
          inputMode="numeric"
          value={amount}
          onChange={event => setAmount(event.target.value)}
        />
        <Actions>
          <Button
            type="submit"
            size="sm"
            disabled={isSaving || !canMoveGold(balance, parsed, 'deposit')}
          >
            Deposit
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={isSaving || !canMoveGold(balance, parsed, 'withdraw')}
            onClick={() => move('withdraw')()}
          >
            Withdraw
          </Button>
        </Actions>
      </Form>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.md};
`;

const Balance = styled.p`
  margin: 0;
  font-family: ${props => props.theme.font.mono};
  font-size: ${props => props.theme.fontSize.xl};
  color: ${props => props.theme.color.textPrimary};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
`;

const Label = styled.label`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Actions = styled.div`
  display: flex;
  gap: ${props => props.theme.space.sm};
  margin-top: ${props => props.theme.space.xs};
`;

const Skeleton = styled.div`
  height: 6rem;
  border-radius: ${props => props.theme.radius.sm};
  background: ${props => props.theme.color.surfaceRaised};
`;
