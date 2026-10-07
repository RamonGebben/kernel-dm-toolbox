'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';

/**
 * Refetches everything a bastion write can change: the bastion itself, the
 * list's counts, the treasury gold it spent or refunded, and what the bastion
 * turn has to work with. One place, so a new bastion query is added once
 * rather than to every hook that writes.
 */
export const useInvalidateBastions = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return () =>
    Promise.all(
      [
        trpc.bastions.get.queryKey(),
        trpc.bastions.list.queryKey(),
        trpc.party.get.queryKey(),
        trpc.bastionTurns.current.queryKey(),
      ].map(queryKey => queryClient.invalidateQueries({ queryKey })),
    );
};
