'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '~/atoms/Button';
import { TextInput } from '~/atoms/TextInput';
import { formatGold } from '~/utils/applyGoldChange';
import {
  canMoveGold,
  type TreasuryDirection,
} from '~/organisms/PartyTreasury/hooks/usePartyTreasury';
import { Stack } from '~/atoms/Stack';
import { Balance } from '~/organisms/PartyTreasury/components/PartyTreasuryView/components/Balance';
import { FieldLabel } from '~/atoms/FieldLabel';
import { Actions } from '~/organisms/PartyTreasury/components/PartyTreasuryView/components/Actions';
import { Skeleton } from '~/atoms/Skeleton';

export interface PartyTreasuryViewProps {
  isPending: boolean;
  balance: number;
  isSaving: boolean;
  onMove: (amount: number, direction: TreasuryDirection) => void;
}

/**
 * The party's gold — the only gold the app tracks; characters have no purse
 * of their own. Bastion costs will draw on it later.
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
    return <Skeleton $height="6rem" aria-label="Loading the treasury" />;

  return (
    <Stack>
      <Balance aria-label="Treasury balance">{formatGold(balance)}</Balance>

      <Stack as="form" $gap="xs" onSubmit={move('deposit')}>
        <FieldLabel htmlFor="treasury-amount">Amount (gp)</FieldLabel>
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
      </Stack>
    </Stack>
  );
};
