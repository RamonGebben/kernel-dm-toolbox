'use client';

import { CreatureLibraryView } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';
import { useCreatureLibrary } from '~/organisms/CreatureLibrary/hooks/useCreatureLibrary';
import { useSelectionStore } from '~/stores/selection';

/**
 * Connected boundary: owns the queries and delegates every pixel to
 * `CreatureLibraryView`, which is where the stories live.
 */
export const CreatureLibrary = () => {
  const library = useCreatureLibrary();
  const selectedCreatureSlug = useSelectionStore(
    state => state.selectedCreatureSlug,
  );
  const selectCreature = useSelectionStore(state => state.selectCreature);

  return (
    <CreatureLibraryView
      isPending={library.isPending}
      isLibraryImported={library.isLibraryImported}
      creatures={library.creatures}
      search={library.search}
      selectedSlug={selectedCreatureSlug}
      quantity={library.quantity}
      onSearchChange={library.setSearch}
      onQuantityChange={library.setQuantity}
      onSelect={selectCreature}
      onAdd={library.addCreature}
    />
  );
};
