import type { EngineSide } from '~/server/simulator/engine/types';

/** Turns a run's `winner` into the battle viewer's headline — pure and
 * colocated alongside `formatBattleLogEntry`/`highlightedCombatantIdsForEntry`
 * rather than inline in `BattleViewerView`, the same reason those exist. */
export const formatWinnerLabel = (winner: EngineSide | 'draw'): string =>
  winner === 'party'
    ? 'The party wins!'
    : winner === 'monsters'
      ? 'The monsters win!'
      : "It's a draw.";
