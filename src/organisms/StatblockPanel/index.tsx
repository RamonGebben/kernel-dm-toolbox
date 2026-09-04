'use client';

import { StatblockView } from '~/organisms/StatblockPanel/components/StatblockView';
import { CharacterCard } from '~/organisms/StatblockPanel/components/CharacterCard';
import { CombatantControls } from '~/organisms/StatblockPanel/components/CombatantControls';
import { useStatblockTarget } from '~/organisms/StatblockPanel/hooks/useStatblockTarget';
import { useEncounter } from '~/organisms/EncounterPanel/hooks/useEncounter';

/**
 * Connected boundary for the right-hand panel.
 *
 * Shows reference material for a browsed creature, and reference material plus
 * the controls that change it for a combatant in the fight.
 */
export const StatblockPanel = () => {
  const { target, isPending, statblock } = useStatblockTarget();
  const encounter = useEncounter();

  const combatant = target.kind === 'none' ? null : target.combatant;

  const controls = combatant && (
    <CombatantControls
      displayName={combatant.displayName}
      currentHitPoints={combatant.currentHitPoints}
      maxHitPoints={combatant.maxHitPoints}
      temporaryHitPoints={combatant.temporaryHitPoints}
      isHidden={combatant.isHidden}
      isPending={encounter.isAdjusting}
      onDamage={amount => encounter.damage(combatant.id, amount)}
      onHeal={amount => encounter.heal(combatant.id, amount)}
      onGrantTemporary={amount =>
        encounter.grantTemporary(combatant.id, amount)
      }
      onToggleHidden={() =>
        encounter.setHidden(combatant.id, !combatant.isHidden)
      }
    />
  );

  if (target.kind === 'character') {
    return (
      <>
        {controls}
        <CharacterCard
          displayName={target.combatant.displayName}
          currentHitPoints={target.combatant.currentHitPoints}
          maxHitPoints={target.combatant.maxHitPoints}
          armorClass={target.combatant.armorClass}
        />
      </>
    );
  }

  return (
    <>
      {controls}
      <StatblockView isPending={isPending} statblock={statblock} />
    </>
  );
};
