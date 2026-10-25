'use client';

import { useState } from 'react';
import { CreatureLibraryView } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';
import { useCreatureLibrary } from '~/organisms/CreatureLibrary/hooks/useCreatureLibrary';
import { useSelectionStore } from '~/store/selection';
import { NewCreatureWizard } from '~/organisms/NewCreatureWizard';
import type { CreatureSummary } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';

/**
 * Connected boundary: owns the queries and delegates every pixel to
 * `CreatureLibraryView`, which is where the stories live.
 */
export const CreatureLibrary = () => {
  const library = useCreatureLibrary();
  const selectedCreatureSlug = useSelectionStore(
    state => state.selectedCreatureSlug,
  );
  const selectedCustomCreatureId = useSelectionStore(
    state => state.selectedCustomCreatureId,
  );
  const selectCreature = useSelectionStore(state => state.selectCreature);
  const selectCustomCreature = useSelectionStore(
    state => state.selectCustomCreature,
  );
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleSelect = (creature: CreatureSummary) =>
    creature.source === 'library'
      ? selectCreature(creature.slug)
      : selectCustomCreature(creature.id);

  return (
    <>
      <CreatureLibraryView
        isPending={library.isPending}
        isLibraryImported={library.isLibraryImported}
        creatures={library.creatures}
        search={library.search}
        sourceOptions={library.sourceOptions}
        selectedSources={library.selectedSources}
        typeOptions={library.typeOptions}
        selectedTypes={library.selectedTypes}
        documentOptions={library.documentOptions}
        selectedDocuments={library.selectedDocuments}
        challengeRatingOptions={library.challengeRatingOptions}
        challengeRatingRange={library.challengeRatingRange}
        selectedSlug={selectedCreatureSlug}
        selectedCustomCreatureId={selectedCustomCreatureId}
        onSearchChange={library.setSearch}
        onSourcesChange={library.setSelectedSources}
        onTypesChange={library.setSelectedTypes}
        onDocumentsChange={library.setSelectedDocuments}
        onMinChallengeRatingChange={library.setMinChallengeRating}
        onMaxChallengeRatingChange={library.setMaxChallengeRating}
        onSelect={handleSelect}
        onAdd={library.addCreature}
        onNewCreature={() => setIsWizardOpen(true)}
      />
      <NewCreatureWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreated={id => {
          setIsWizardOpen(false);
          selectCustomCreature(id);
        }}
      />
    </>
  );
};
