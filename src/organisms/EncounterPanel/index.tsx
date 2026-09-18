'use client';

import { useState } from 'react';
import { Modal } from '~/atoms/Modal';
import { HitPointControls } from '~/molecules/HitPointControls';
import { EncounterView } from '~/organisms/EncounterPanel/components/EncounterView';
import { useEncounter } from '~/organisms/EncounterPanel/hooks/useEncounter';
import { useTrackerHotkeys } from '~/organisms/EncounterPanel/hooks/useTrackerHotkeys';
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
  useTrackerHotkeys({ enabled: isStarted, onNextTurn: encounter.nextTurn });

  return (
    <>
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
      />

      <Modal
        title={`Hit points — ${hitPointsCombatant?.displayName ?? ''}`}
        isOpen={hitPointsCombatant !== null}
        onClose={() => setHitPointsCombatantId(null)}
      >
        {hitPointsCombatant && (
          <HitPointControls
            currentHitPoints={hitPointsCombatant.currentHitPoints}
            maxHitPoints={hitPointsCombatant.maxHitPoints}
            temporaryHitPoints={hitPointsCombatant.temporaryHitPoints}
            isPending={encounter.isAdjusting}
            onDamage={amount => encounter.damage(hitPointsCombatant.id, amount)}
            onHeal={amount => encounter.heal(hitPointsCombatant.id, amount)}
            onGrantTemporary={amount =>
              encounter.grantTemporary(hitPointsCombatant.id, amount)
            }
          />
        )}
      </Modal>
    </>
  );
};
