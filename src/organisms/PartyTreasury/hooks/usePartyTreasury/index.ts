'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { applyGoldChange } from '~/utils/applyGoldChange';

export type TreasuryDirection = 'deposit' | 'withdraw';

/**
 * Whether a typed amount can move in that direction: a positive whole number,
 * and — for a withdrawal — no more than the treasury holds. Disabling the
 * button up front beats a round trip to be told no.
 */
export const canMoveGold = (
  balance: number,
  amount: number,
  direction: TreasuryDirection,
): boolean => {
  if (!Number.isInteger(amount) || amount <= 0) return false;

  return applyGoldChange(balance, direction === 'deposit' ? amount : -amount)
    .ok;
};

export const usePartyTreasury = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const party = useQuery(trpc.party.get.queryOptions());

  const adjust = useMutation(
    trpc.party.adjustTreasury.mutationOptions({
      onSuccess: updated => {
        queryClient.setQueryData(trpc.party.get.queryKey(), current =>
          current ? { ...current, ...updated } : current,
        );

        // The bastion turn checks its orders against the same balance.
        return queryClient.invalidateQueries({
          queryKey: trpc.bastionTurns.current.queryKey(),
        });
      },
    }),
  );

  return {
    isPending: party.isPending,
    balance: party.data?.treasuryGold ?? 0,
    isSaving: adjust.isPending,
    move: (amount: number, direction: TreasuryDirection) =>
      adjust.mutate({ delta: direction === 'deposit' ? amount : -amount }),
  };
};
