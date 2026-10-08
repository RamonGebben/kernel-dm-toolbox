export interface TickableCondition {
  id: string;
  roundsRemaining: number | null;
}

export interface TickResult<TCondition> {
  /** Conditions that survive, with their counter decremented. */
  remaining: Array<TCondition>;
  /** Conditions whose duration ran out and should be cleared. */
  expired: Array<TCondition>;
}

/**
 * Counts conditions down by one round.
 *
 * Durations tick when the **round** advances, not when the affected creature's
 * turn comes round. That is a simplification of the rules — 5e durations end
 * at a specific point in a specific creature's turn — chosen because "3 rounds
 * left" is what a DM says out loud, and because a counter that only moves on
 * one combatant's turn looks broken when you glance at the list.
 *
 * A null counter means indefinite and never expires.
 */
export const tickConditions = <TCondition extends TickableCondition>(
  conditions: ReadonlyArray<TCondition>,
): TickResult<TCondition> =>
  conditions.reduce<TickResult<TCondition>>(
    (result, condition) => {
      if (condition.roundsRemaining === null) {
        return { ...result, remaining: [...result.remaining, condition] };
      }

      const next = condition.roundsRemaining - 1;

      return next <= 0
        ? { ...result, expired: [...result.expired, condition] }
        : {
            ...result,
            remaining: [
              ...result.remaining,
              { ...condition, roundsRemaining: next },
            ],
          };
    },
    { remaining: [], expired: [] },
  );
