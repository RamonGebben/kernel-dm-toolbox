'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useMapToolStore } from '~/stores/mapTool';
import { useActiveMap } from '~/hooks/useActiveMap';

export const useFogControls = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const fogBrush = useMapToolStore(state => state.fogBrush);
  const setFogBrush = useMapToolStore(state => state.setFogBrush);

  const { activeMapId } = useActiveMap();

  const map = useQuery({
    ...trpc.maps.get.queryOptions({ id: activeMapId ?? '' }),
    enabled: activeMapId !== null,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.maps.get.queryKey() });

  const toggleFog = useMutation(
    trpc.maps.toggleFog.mutationOptions({ onSuccess: invalidate }),
  );
  const resetFog = useMutation(
    trpc.maps.resetFog.mutationOptions({ onSuccess: invalidate }),
  );
  const revealFog = useMutation(
    trpc.maps.revealFog.mutationOptions({ onSuccess: invalidate }),
  );
  const setFogOpacity = useMutation(
    trpc.maps.setFogOpacity.mutationOptions({ onSuccess: invalidate }),
  );

  return {
    hasSelectedMap: activeMapId !== null,
    isEnabled: map.data?.fog.enabled ?? false,
    dmOpacity: map.data?.fog.opacityDm ?? 0.6,
    playerOpacity: map.data?.fog.opacityTable ?? 0.9,
    brush: fogBrush,
    onToggleEnabled: (enabled: boolean) => {
      if (map.data) toggleFog.mutate({ id: map.data.id, enabled });
    },
    onReset: () => {
      if (map.data) resetFog.mutate({ id: map.data.id });
    },
    onRevealAll: () => {
      if (map.data) revealFog.mutate({ id: map.data.id });
    },
    onDmOpacityChange: (opacity: number) => {
      if (map.data) {
        setFogOpacity.mutate({ id: map.data.id, view: 'dm', opacity });
      }
    },
    onPlayerOpacityChange: (opacity: number) => {
      if (map.data) {
        setFogOpacity.mutate({ id: map.data.id, view: 'table', opacity });
      }
    },
    onBrushChange: setFogBrush,
  };
};
