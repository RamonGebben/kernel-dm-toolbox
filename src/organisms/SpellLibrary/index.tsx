'use client';

import { SpellLibraryView } from '~/organisms/SpellLibrary/components/SpellLibraryView';
import { useSpellLibrary } from '~/organisms/SpellLibrary/hooks/useSpellLibrary';
import { useSpellSelectionStore } from '~/stores/spellSelection';

/**
 * Connected boundary: owns the queries and delegates every pixel to
 * `SpellLibraryView`, which is where the stories live.
 */
export const SpellLibrary = () => {
  const library = useSpellLibrary();
  const selectedSpellSlug = useSpellSelectionStore(
    state => state.selectedSpellSlug,
  );
  const selectSpell = useSpellSelectionStore(state => state.selectSpell);

  return (
    <SpellLibraryView
      isPending={library.isPending}
      isLibraryImported={library.isLibraryImported}
      spells={library.spells}
      search={library.search}
      selectedSlug={selectedSpellSlug}
      onSearchChange={library.setSearch}
      onSelect={selectSpell}
      levelOptions={library.levelOptions}
      selectedLevels={library.selectedLevels}
      onLevelsChange={library.setSelectedLevels}
      classOptions={library.classOptions}
      selectedClassSlugs={library.selectedClassSlugs}
      onClassSlugsChange={library.setSelectedClassSlugs}
    />
  );
};
