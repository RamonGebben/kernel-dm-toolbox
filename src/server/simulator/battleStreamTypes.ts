import type {
  EngineFinalCombatantState,
  EngineSide,
  TurnLogEntry,
} from '~/server/simulator/engine/types';

/** A combatant as it stands at the very start of a run — enough for the
 * animated viewer to draw every token's starting cell before the first
 * `entry` frame arrives. Positions here are post-auto-placement (see
 * `loadScenarioCombatants`), so they may differ from a DM's raw, unplaced
 * builder state. */
export type BattleStartCombatant = {
  id: string;
  name: string;
  side: EngineSide;
  position: { x: number; y: number };
  maxHitPoints: number;
};

/**
 * The frame shapes `GET /api/simulator/[scenarioId]/run` emits, in order:
 * exactly one `start`, then one `entry` per `TurnLogEntry`, then exactly one
 * `complete` — or a single `error` in place of all of the above if the
 * scenario can't be run at all (no combatants loaded). Shared, type-only,
 * between the route handler and `useBattleRunStream` — matching this repo's
 * `AppRouter` convention of crossing the server/client boundary as types
 * only, so nothing server-side is pulled into the client bundle by importing
 * this file.
 */
export type BattleStreamFrame =
  | { kind: 'start'; seed: number; combatants: BattleStartCombatant[] }
  | { kind: 'entry'; entry: TurnLogEntry }
  | {
      kind: 'complete';
      winner: EngineSide | 'draw';
      rounds: number;
      combatants: EngineFinalCombatantState[];
    }
  | { kind: 'error'; message: string };
