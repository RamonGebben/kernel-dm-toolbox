'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { ConnectionStatusView } from '~/organisms/ConnectionStatus/components/ConnectionStatusView';
import { useConnectionStatus } from '~/organisms/ConnectionStatus/hooks/useConnectionStatus';

/**
 * The **connected boundary**: the one component in this folder allowed to touch
 * the data layer. It owns the query and delegates every pixel to the
 * presentational `ConnectionStatusView`, which is what keeps the view fully
 * story-driveable.
 *
 * Connected boundaries carry no `index.stories.tsx` of their own — there is
 * nothing to drive through a knob. Their view child carries the stories.
 */
export const ConnectionStatus = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const status = useConnectionStatus();

  const handleRetry = () => {
    void queryClient.invalidateQueries({
      queryKey: trpc.health.ping.queryKey({ message: 'ping' }),
    });
  };

  return <ConnectionStatusView status={status} onRetry={handleRetry} />;
};
