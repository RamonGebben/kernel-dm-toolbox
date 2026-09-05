'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { SidePanel } from '~/atoms/SidePanel';
import { SpellDetailView } from '~/organisms/SpellDetailPanel/components/SpellDetailView';
import { useSpellSelectionStore } from '~/stores/spellSelection';

/**
 * Connected boundary: the slide-in pane a selected spell appears in.
 *
 * Delegates rendering to `SpellDetailView`; only wires the selection store to
 * a query and to `SidePanel`'s open/close state.
 */
export const SpellDetailPanel = () => {
  const trpc = useTRPC();
  const selectedSpellSlug = useSpellSelectionStore(
    state => state.selectedSpellSlug,
  );
  const selectSpell = useSpellSelectionStore(state => state.selectSpell);

  const spell = useQuery({
    ...trpc.library.getSpell.queryOptions({ slug: selectedSpellSlug ?? '' }),
    enabled: selectedSpellSlug !== null,
  });

  return (
    <SidePanel
      title={spell.data?.name ?? 'Spell'}
      isOpen={selectedSpellSlug !== null}
      onClose={() => selectSpell(null)}
    >
      <SpellDetailView isPending={spell.isPending} spell={spell.data ?? null} />
    </SidePanel>
  );
};
