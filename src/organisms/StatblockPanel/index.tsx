'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { StatblockView } from '~/organisms/StatblockPanel/components/StatblockView';
import { useSelectionStore } from '~/stores/selection';

/** Connected boundary for the right-hand panel. */
export const StatblockPanel = () => {
  const trpc = useTRPC();
  const selectedCreatureSlug = useSelectionStore(
    state => state.selectedCreatureSlug,
  );

  const { isPending, data } = useQuery({
    ...trpc.library.getCreature.queryOptions({
      slug: selectedCreatureSlug ?? '',
    }),
    enabled: selectedCreatureSlug !== null,
  });

  // A disabled query reports `isPending`, which would leave the panel showing
  // a skeleton forever with nothing selected. Nothing selected is not loading.
  if (selectedCreatureSlug === null) {
    return <StatblockView isPending={false} statblock={null} />;
  }

  return <StatblockView isPending={isPending} statblock={data ?? null} />;
};
