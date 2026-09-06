'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTRPC } from '~/trpc/react';
import { useDiceRollStore } from '~/stores/diceRoll';
import {
  DiceRollModalView,
  type DiceRollApplyIntent,
} from '~/organisms/DiceRollModal/components/DiceRollModalView';

/**
 * Connected boundary, globally mounted: owns the dice-roll store subscription
 * and, only when the roll came from a combatant's statblock, the combatant
 * list and the damage/heal mutations used to apply a result.
 *
 * The combatant query is gated on `canApplyToCombatants`, so opening this
 * from spell text on `/spells` never fetches the encounter.
 */
export const DiceRollModal = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const dice = useDiceRollStore(state => state.dice);
  const closeDiceRoll = useDiceRollStore(state => state.closeDiceRoll);

  const canApplyToCombatants = dice?.canApplyToCombatants ?? false;

  const encounter = useQuery({
    ...trpc.encounter.get.queryOptions(),
    enabled: canApplyToCombatants,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: trpc.encounter.get.queryKey() });

  const damage = useMutation(
    trpc.encounter.damage.mutationOptions({ onSuccess: invalidate }),
  );
  const heal = useMutation(
    trpc.encounter.heal.mutationOptions({ onSuccess: invalidate }),
  );

  const handleApply = async (
    intent: DiceRollApplyIntent,
    targets: { id: string; amount: number }[],
  ) => {
    const mutate = intent === 'damage' ? damage.mutateAsync : heal.mutateAsync;
    await Promise.all(targets.map(target => mutate(target)));
    closeDiceRoll();
  };

  if (!dice) return null;

  return (
    <DiceRollModalView
      key={dice.requestId}
      sides={dice.sides}
      modifier={dice.modifier}
      initialCount={dice.count}
      canApplyToCombatants={canApplyToCombatants}
      combatants={encounter.data?.combatants ?? []}
      isApplying={damage.isPending || heal.isPending}
      onClose={closeDiceRoll}
      onApply={handleApply}
    />
  );
};
