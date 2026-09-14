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

  for (const entry of revealedEntries) {
    switch (entry.kind) {
      case 'move': {
        const current = byId.get(entry.combatantId);
        if (current) {
          byId.set(entry.combatantId, { ...current, position: entry.to });
        }
        break;
      }

      case 'attack':
        if (entry.hit) damage(entry.targetId, entry.damage);
        break;

      case 'save-effect':
        for (const target of entry.targets)
          damage(target.targetId, target.damage);
        break;

      case 'defeated': {
        const current = byId.get(entry.combatantId);
        if (current) {
          byId.set(entry.combatantId, {
            ...current,
            isDefeated: true,
            currentHitPoints: 0,
          });
        }
        break;
      }

      // A death-save-eligible combatant going down (`down`), rolling
      // (`death-save`), stabilizing, or waking back up (`revived`) is all
      // real detail for milestone 13's UI pass to draw — this snapshot
      // reducer just needs `revived` to restore the 1 HP `rollDeathSave`
      // grants so a later `attack`/`save-effect` entry's damage clamp has
      // the right starting point to subtract from; the others need no
      // numeric change here (HP is already 0 from the hit that caused
      // `down`, and `isDefeated` deliberately stays false for all of
      // `down`/`death-save`/`stabilized` — a down-but-not-dead combatant
      // is not the same terminal state `defeated` represents).
      case 'revived': {
        const current = byId.get(entry.combatantId);
        if (current) {
          byId.set(entry.combatantId, {
            ...current,
            currentHitPoints: entry.hitPoints,
          });
        }
        break;
      }

      case 'round-start':
      case 'initiative':
      case 'no-action':
      case 'condition-applied':
      case 'condition-removed':
      case 'concentration-check':
      case 'down':
      case 'death-save':
      case 'stabilized':
        break;

      default: {
        const exhaustive: never = entry;
        void exhaustive;
      }
    }
  }

  return [...byId.values()];
};
