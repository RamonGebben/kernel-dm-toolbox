'use client';

import { CharacterRosterView } from '~/organisms/CharacterRoster/components/CharacterRosterView';
import { useCharacterRoster } from '~/organisms/CharacterRoster/hooks/useCharacterRoster';

/** Connected boundary: owns the queries and mutations, renders nothing itself. */
export const CharacterRoster = () => {
  const roster = useCharacterRoster();

  return (
    <CharacterRosterView
      isPending={roster.isPending}
      characters={roster.characters}
      combatantCharacterIds={roster.combatantCharacterIds}
      canAddAll={roster.canAddAll}
      isAddingAll={roster.isAddingAll}
      onAddToEncounter={roster.addToEncounter}
      onAddAllActive={roster.addAllActive}
    />
  );
};
