'use client';

import { StatblockView } from '~/organisms/StatblockPanel/components/StatblockView';
import { CharacterCard } from '~/organisms/StatblockPanel/components/CharacterCard';
import { useStatblockTarget } from '~/organisms/StatblockPanel/hooks/useStatblockTarget';

/** Connected boundary for the right-hand panel. */
export const StatblockPanel = () => {
  const { target, isPending, statblock } = useStatblockTarget();

  if (target.kind === 'character') {
    return (
      <CharacterCard
        displayName={target.combatant.displayName}
        currentHitPoints={target.combatant.currentHitPoints}
        maxHitPoints={target.combatant.maxHitPoints}
        armorClass={target.combatant.armorClass}
      />
    );
  }

  return <StatblockView isPending={isPending} statblock={statblock} />;
};
