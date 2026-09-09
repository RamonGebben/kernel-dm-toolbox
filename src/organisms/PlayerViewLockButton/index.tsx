'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { PlayerViewLockButtonView } from '~/organisms/PlayerViewLockButton/components/PlayerViewLockButtonView';

/**
 * Connected boundary: owns the session query and the lock mutation, and
 * delegates every pixel to `PlayerViewLockButtonView`.
 */
export const PlayerViewLockButton = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const session = useQuery(trpc.maps.getSession.queryOptions());

  const setViewportLocked = useMutation(
    trpc.maps.setViewportLocked.mutationOptions({
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: trpc.maps.getSession.queryKey(),
        }),
    }),
  );

  const isLocked = session.data?.isViewportLocked ?? false;

  return (
    <PlayerViewLockButtonView
      isLocked={isLocked}
      onToggle={() => setViewportLocked.mutate({ locked: !isLocked })}
    />
  );
};
