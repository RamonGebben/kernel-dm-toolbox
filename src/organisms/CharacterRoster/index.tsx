'use client';

import { CharacterRosterView } from '~/organisms/CharacterRoster/components/CharacterRosterView';
import { useCharacterRoster } from '~/organisms/CharacterRoster/hooks/useCharacterRoster';

/** Connected boundary: owns the queries and mutations, renders nothing itself. */
export const CharacterRoster = () => {
  const roster = useCharacterRoster();

  return (
    <CharacterRosterView
      isPending={roster.isPending}
      isSaving={roster.isSaving}
      characters={roster.characters}
      editing={roster.editing}
      combatantCharacterIds={roster.combatantCharacterIds}
      onAddToEncounter={roster.addToEncounter}
      onStartCreate={roster.startCreate}
      onStartEdit={roster.startEdit}
      onCancelEdit={roster.cancelEdit}
      onSubmit={roster.submit}
      onRemove={roster.remove}
    />
  );
};
