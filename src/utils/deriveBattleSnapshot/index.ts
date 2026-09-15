import type { EngineSide, TurnLogEntry } from '~/server/simulator/engine/types';
import type { BattleStartCombatant } from '~/server/simulator/battleStreamTypes';

export type BattleSnapshotCombatant = {
  id: string;
  name: string;
  side: EngineSide;
  position: { x: number; y: number };
  maxHitPoints: number;
  currentHitPoints: number;
  isDefeated: boolean;
  /** At 0 HP and still in the fight — `down` has fired but neither
   * `stabilized` nor `revived`/`defeated` has yet (issue #5, milestone 13).
   * Distinct from `isDefeated`: a down combatant is still drawn, just
   * visually marked as out of the action. Always false for a combatant
   * that isn't death-save-eligible (a monster just goes straight to
   * `isDefeated` instead — see `EngineCombatant.tracksDeathSaves`). */
  isDown: boolean;
  /** 3 death-save successes reached — stopped rolling, stays down for the
   * rest of the encounter. A stricter sub-state of `isDown` (`isDown` stays
   * true too), drawn distinctly since "still might die" and "definitely
   * not dying any further" read differently to a DM watching the replay. */
  isStabilized: boolean;
  /** Every condition currently affecting this combatant, by key — for a
   * small persistent badge on its token. Order follows application order;
   * duplicates aren't possible (an already-active condition of the same
   * key isn't reapplied by the engine). */
  activeConditionKeys: string[];
};

/**
 * Reduces a run's starting combatants plus a prefix of its turn log into
 * "where is everyone and how hurt are they right now" — what the battle
 * canvas actually draws. Pure, so playback (which prefix is "revealed" at
 * any moment) is a `usePlaybackClock` concern entirely separate from this
 * reducer, and both are unit-testable without a canvas or a timer.
 *
 * Recomputed from the full prefix on every call rather than kept as
 * incremental state — a run's log tops out at a few hundred entries
 * (`DEFAULT_MAX_ROUNDS` in the engine), trivial to fold on every animation
 * frame.
 */
export const deriveBattleSnapshot = (
  initialCombatants: readonly BattleStartCombatant[],
  revealedEntries: readonly TurnLogEntry[],
): BattleSnapshotCombatant[] => {
  const byId = new Map<string, BattleSnapshotCombatant>(
    initialCombatants.map(combatant => [
      combatant.id,
      {
        id: combatant.id,
        name: combatant.name,
        side: combatant.side,
        position: combatant.position,
        maxHitPoints: combatant.maxHitPoints,
        currentHitPoints: combatant.maxHitPoints,
        isDefeated: false,
        isDown: false,
        isStabilized: false,
        activeConditionKeys: [],
      },
    ]),
  );

  const damage = (id: string, amount: number) => {
    if (amount <= 0) return;
    const current = byId.get(id);
    if (!current) return;
    byId.set(id, {
      ...current,
      currentHitPoints: Math.max(0, current.currentHitPoints - amount),
    });
  };

  /** The common "patch this combatant if it still exists" shape most log
   * entries reduce to — a plain no-op for an unknown id rather than an
   * error, since every entry only ever names combatants this snapshot
   * already started with. */
  const update = (id: string, patch: Partial<BattleSnapshotCombatant>) => {
    const current = byId.get(id);
    if (current) byId.set(id, { ...current, ...patch });
  };

  for (const entry of revealedEntries) {
    switch (entry.kind) {
      case 'move':
        update(entry.combatantId, { position: entry.to });
        break;

      case 'attack':
        if (entry.hit) damage(entry.targetId, entry.damage);
        break;

      case 'save-effect':
        for (const target of entry.targets)
          damage(target.targetId, target.damage);
        break;

      case 'defeated':
        update(entry.combatantId, { isDefeated: true, currentHitPoints: 0 });
        break;

      // `isDefeated` deliberately stays false for all of `down`/
      // `death-save`/`stabilized` — a down-but-not-dead combatant is not
      // the same terminal state `defeated` represents (issue #5, milestone
      // 13's own visual distinction: still drawn, just visibly out).
      case 'down':
        update(entry.combatantId, { isDown: true });
        break;

      case 'stabilized':
        update(entry.combatantId, { isStabilized: true });
        break;

      case 'revived':
        update(entry.combatantId, {
          currentHitPoints: entry.hitPoints,
          isDown: false,
          isStabilized: false,
        });
        break;

      case 'condition-applied': {
        const current = byId.get(entry.combatantId);
        if (
          current &&
          !current.activeConditionKeys.includes(entry.conditionKey)
        ) {
          update(entry.combatantId, {
            activeConditionKeys: [
              ...current.activeConditionKeys,
              entry.conditionKey,
            ],
          });
        }
        break;
      }

      case 'condition-removed': {
        const current = byId.get(entry.combatantId);
        if (current) {
          update(entry.combatantId, {
            activeConditionKeys: current.activeConditionKeys.filter(
              key => key !== entry.conditionKey,
            ),
          });
        }
        break;
      }

      case 'round-start':
      case 'initiative':
      case 'no-action':
      case 'concentration-check':
      case 'death-save':
        break;

      default: {
        const exhaustive: never = entry;
        void exhaustive;
      }
    }
  }

  return [...byId.values()];
};
