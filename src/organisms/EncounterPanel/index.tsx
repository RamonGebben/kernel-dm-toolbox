'use client';

import { useState } from 'react';
import { EncounterView } from '~/organisms/EncounterPanel/components/EncounterView';
import { useEncounter } from '~/organisms/EncounterPanel/hooks/useEncounter';
import { useSelectionStore } from '~/stores/selection';

/** Connected boundary for the centre column. */
export const EncounterPanel = () => {
  const encounter = useEncounter();
  const selectedCombatantId = useSelectionStore(
    state => state.selectedCombatantId,
  );
  const selectCombatant = useSelectionStore(state => state.selectCombatant);

  // Whether the initiative dialog is open is ephemeral view state that nothing
  // else in the app needs, so it stays here rather than in a store.
  const [isRollingInitiative, setIsRollingInitiative] = useState(false);

  return (
    <EncounterView
      isPending={encounter.isPending}
      roundNumber={encounter.roundNumber}
      difficulty={encounter.difficulty}
      combatants={encounter.combatants}
      selectedCombatantId={selectedCombatantId}
      activeCombatantId={encounter.activeCombatantId}
      isRollingInitiative={isRollingInitiative}
      isStarting={encounter.isStarting}
      onSelect={selectCombatant}
      onRemove={encounter.remove}
      onToggleDelay={encounter.toggleDelay}
      onOpenInitiativeRoll={() => setIsRollingInitiative(true)}
      onCloseInitiativeRoll={() => setIsRollingInitiative(false)}
      onStart={initiatives =>
        encounter.start(initiatives, () => setIsRollingInitiative(false))
      }
      onEndCombat={encounter.end}
      onNextTurn={encounter.nextTurn}
      onPreviousTurn={encounter.previousTurn}
      onClearMonsters={encounter.clearMonsters}
    />
  );
};
