'use client';

import { SavedEncountersView } from '~/organisms/SavedEncounters/components/SavedEncountersView';
import { useSavedEncounters } from '~/organisms/SavedEncounters/hooks/useSavedEncounters';

/** Connected boundary: owns the queries and mutations, renders nothing itself. */
export const SavedEncounters = () => {
  const saved = useSavedEncounters();

  return (
    <SavedEncountersView
      isPending={saved.isPending}
      isSaving={saved.isSaving}
      presets={saved.presets}
      canSaveCurrent={saved.canSaveCurrent}
      onSave={saved.save}
      onApply={saved.apply}
      onRemove={saved.remove}
    />
  );
};
