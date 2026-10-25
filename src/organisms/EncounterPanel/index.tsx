'use client';

import { useState } from 'react';
import { EncounterView } from '~/organisms/EncounterPanel/components/EncounterView';
import { useEncounter } from '~/organisms/EncounterPanel/hooks/useEncounter';
import { useTrackerHotkeys } from '~/organisms/EncounterPanel/hooks/useTrackerHotkeys';
import { useSelectionStore } from '~/store/selection';

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

  // Which combatant's HP dialog is open, opened by clicking the HP readout in
  // that combatant's own row — also ephemeral, own-panel-only view state.
  const [hitPointsCombatantId, setHitPointsCombatantId] = useState<
    string | null
  >(null);
  const hitPointsCombatant =
    encounter.combatants.find(
      combatant => combatant.id === hitPointsCombatantId,
    ) ?? null;

  const isStarted = encounter.roundNumber > 0;
  // A dialog can land focus on a non-editable element (a Modal's panel, a
  // button) that `isHotkeyEvent` has no way to recognize as "inside an open
  // dialog" — so the hotkey has to be disabled at the source whenever one is
  // open, or pressing "n" to type into the HP/initiative dialog silently
  // advances the turn in the background instead.
  const isDialogOpen = isRollingInitiative || hitPointsCombatant !== null;
  useTrackerHotkeys({
    enabled: isStarted && !isDialogOpen,
    onNextTurn: encounter.nextTurn,
  });

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
      onOpenHitPoints={setHitPointsCombatantId}
      onOpenInitiativeRoll={() => setIsRollingInitiative(true)}
      onCloseInitiativeRoll={() => setIsRollingInitiative(false)}
      onStart={initiatives =>
        encounter.start(initiatives, () => setIsRollingInitiative(false))
      }
      onEndCombat={encounter.end}
      onNextTurn={encounter.nextTurn}
      onPreviousTurn={encounter.previousTurn}
      onClearMonsters={encounter.clearMonsters}
      hitPointsCombatant={hitPointsCombatant}
      isAdjustingHitPoints={encounter.isAdjusting}
      onCloseHitPoints={() => setHitPointsCombatantId(null)}
      onDamage={amount =>
        hitPointsCombatant && encounter.damage(hitPointsCombatant.id, amount)
      }
      onHeal={amount =>
        hitPointsCombatant && encounter.heal(hitPointsCombatant.id, amount)
      }
      onGrantTemporary={amount =>
        hitPointsCombatant &&
        encounter.grantTemporary(hitPointsCombatant.id, amount)
      }
    />
  );
};
