/** The fields ordering depends on — deliberately narrow, so tests are cheap. */
export type Orderable = {
  id: string;
  initiative: number;
  sortOrder: number;
  isDelayed: boolean;
};

/**
 * Initiative order: highest first.
 *
 * Ties fall back to `sortOrder`, which is insertion order until the DM drags a
 * row. Delayed combatants sink to the bottom — they have stepped out of the
 * order and re-enter where the DM puts them.
 */
export const sortCombatants = <TCombatant extends Orderable>(
  combatants: readonly TCombatant[],
): TCombatant[] =>
  [...combatants].sort((left, right) => {
    if (left.isDelayed !== right.isDelayed) return left.isDelayed ? 1 : -1;
    if (left.initiative !== right.initiative)
      return right.initiative - left.initiative;

    return left.sortOrder - right.sortOrder;
  });

/**
 * Whose turn is next.
 *
 * Wraps to the top of the order and reports it, because wrapping is what
 * advances the round counter — the caller should not have to infer it.
 */
export const nextTurn = <TCombatant extends Orderable>(
  combatants: readonly TCombatant[],
  activeId: string | null,
): { activeId: string | null; didWrap: boolean } => {
  const order = sortCombatants(combatants).filter(
    combatant => !combatant.isDelayed,
  );

  if (!order.length) return { activeId: null, didWrap: false };

  const currentIndex = order.findIndex(combatant => combatant.id === activeId);

  // No active combatant, or the active one just left the fight: start at the
  // top. That counts as beginning a round, not as wrapping around.
  if (currentIndex === -1) return { activeId: order[0].id, didWrap: true };

  const nextIndex = currentIndex + 1;

  return nextIndex >= order.length
    ? { activeId: order[0].id, didWrap: true }
    : { activeId: order[nextIndex].id, didWrap: false };
};

/** The mirror of `nextTurn`, for correcting a mis-click. */
export const previousTurn = <TCombatant extends Orderable>(
  combatants: readonly TCombatant[],
  activeId: string | null,
): { activeId: string | null; didWrap: boolean } => {
  const order = sortCombatants(combatants).filter(
    combatant => !combatant.isDelayed,
  );

  if (!order.length) return { activeId: null, didWrap: false };

  const currentIndex = order.findIndex(combatant => combatant.id === activeId);

  if (currentIndex === -1)
    return { activeId: order[order.length - 1].id, didWrap: false };

  return currentIndex === 0
    ? { activeId: order[order.length - 1].id, didWrap: true }
    : { activeId: order[currentIndex - 1].id, didWrap: false };
};

/**
 * The round counter.
 *
 * Round 0 means "not started". Advancing past the bottom of the order wraps to
 * the top and begins a new round; stepping back past the top returns to the
 * previous one. Rounds never go below 1 once a fight has begun — a round zero
 * mid-fight would be nonsense on screen.
 */
export const nextRoundNumber = ({
  roundNumber,
  didWrap,
  direction,
}: {
  roundNumber: number;
  didWrap: boolean;
  direction: 'forward' | 'backward';
}): number => {
  if (!didWrap) return roundNumber;

  return direction === 'forward'
    ? roundNumber + 1
    : Math.max(1, roundNumber - 1);
};
