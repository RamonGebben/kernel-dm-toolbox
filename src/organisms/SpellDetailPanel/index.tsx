'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { SpellDetailView } from '~/organisms/SpellDetailPanel/components/SpellDetailView';
import { useSpellSelectionStore } from '~/stores/spellSelection';

/**
 * Connected boundary: the fixed right-hand panel showing the selected spell.
 *
 * Delegates rendering to `SpellDetailView`; only wires the selection store to
 * the query.
 */
export const SpellDetailPanel = () => {
  const trpc = useTRPC();
  const selectedSpellSlug = useSpellSelectionStore(
    state => state.selectedSpellSlug,
  );

  const spell = useQuery({
    ...trpc.library.getSpell.queryOptions({ slug: selectedSpellSlug ?? '' }),
    enabled: selectedSpellSlug !== null,
  });

  return (
    <SpellDetailView
      // A disabled query reports `isPending` forever, which would leave a
      // skeleton on screen with nothing selected. Nothing selected is not
      // loading.
      isPending={selectedSpellSlug !== null && spell.isPending}
      spell={spell.data ?? null}
    />
  );
};
