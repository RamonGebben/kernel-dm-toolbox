'use client';

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

  return (
    <EncounterView
      isPending={encounter.isPending}
      roundNumber={encounter.roundNumber}
      combatants={encounter.combatants}
      selectedCombatantId={selectedCombatantId}
      activeCombatantId={encounter.activeCombatantId}
      onSelect={selectCombatant}
      onRemove={encounter.remove}
      onToggleDelay={encounter.toggleDelay}
      onNextTurn={encounter.nextTurn}
      onPreviousTurn={encounter.previousTurn}
      onClearMonsters={encounter.clearMonsters}
    />
  );
};
