'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { SessionControlsView } from '~/organisms/SessionControlsPanel/components/SessionControlsView';

/**
 * Connected boundary: owns the session query and the mode/lock mutations,
 * and delegates every pixel to `SessionControlsView`, which is where the
 * stories live.
 */
export const SessionControlsPanel = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const session = useQuery(trpc.maps.getSession.queryOptions());

  const invalidateSession = () =>
    queryClient.invalidateQueries({
      queryKey: trpc.maps.getSession.queryKey(),
    });

  const setPlayerScreenMode = useMutation(
    trpc.maps.setPlayerScreenMode.mutationOptions({
      onSuccess: invalidateSession,
    }),
  );

  const setPlayerScreenOrientation = useMutation(
    trpc.maps.setPlayerScreenOrientation.mutationOptions({
      onSuccess: invalidateSession,
    }),
  );

  return (
    <SessionControlsView
      hasActiveMap={session.data?.activeMapId != null}
      mode={session.data?.playerScreenMode ?? 'tracker'}
      onModeChange={mode => setPlayerScreenMode.mutate({ mode })}
      orientation={session.data?.playerScreenOrientation ?? 'auto'}
      onOrientationChange={orientation =>
        setPlayerScreenOrientation.mutate({ orientation })
      }
    />
  );
};
