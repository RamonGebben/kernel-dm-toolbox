'use client';

import { CreatureLibraryView } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';
import { useCreatureLibrary } from '~/organisms/CreatureLibrary/hooks/useCreatureLibrary';
import { useSelectionStore } from '~/stores/selection';

/**
 * Connected boundary: owns the queries and delegates every pixel to
 * `CreatureLibraryView`, which is where the stories live.
 */
export const CreatureLibrary = () => {
  const { isPending, isLibraryImported, creatures, search, setSearch } =
    useCreatureLibrary();
  const selectedCreatureSlug = useSelectionStore(
    state => state.selectedCreatureSlug,
  );
  const selectCreature = useSelectionStore(state => state.selectCreature);

  return (
    <CreatureLibraryView
      isPending={isPending}
      isLibraryImported={isLibraryImported}
      creatures={creatures}
      search={search}
      selectedSlug={selectedCreatureSlug}
      onSearchChange={setSearch}
      onSelect={selectCreature}
    />
  );
};
