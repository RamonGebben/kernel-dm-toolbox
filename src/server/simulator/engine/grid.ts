export type GridCell = { x: number; y: number };

/** Matches `PlacementGrid`'s own default extent (issue #5, milestone 3) —
 * a scenario built in the UI and run through the engine shares the same
 * grid, so a DM's placements land where they clicked them. */
export const DEFAULT_GRID_COLS = 14;
export const DEFAULT_GRID_ROWS = 10;

/** 5e's tabletop convention: a diagonal costs the same as an orthogonal
 * move, matching `~/utils/mapMeasurement`'s own grid-square counting for the
 * Maps tool's ruler — Chebyshev distance in cells, times feet per cell. */
export const FEET_PER_CELL = 5;

export const chebyshevDistanceFeet = (a: GridCell, b: GridCell): number =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y)) * FEET_PER_CELL;

/**
 * Spreads a group of combatants that have no DM-chosen position across a
 * side of the grid — the party along the left edge, the monsters along the
 * right, each column filled top to bottom then wrapping into the next
 * column inward. Simple, deterministic, and good enough for a simulator
 * whose actual tactics come from `selectAction`/`runEncounter`, not from
 * clever deployment.
 */
export const autoPlacePositions = (
  count: number,
  side: 'party' | 'monsters',
  cols: number = DEFAULT_GRID_COLS,
  rows: number = DEFAULT_GRID_ROWS,
): GridCell[] =>
  Array.from({ length: count }, (_, index) => {
    const column = Math.floor(index / rows);
    const row = index % rows;
    const x = side === 'party' ? column : cols - 1 - column;
    return { x: Math.max(0, Math.min(cols - 1, x)), y: row };
  });

/** One step toward `target`, at most `stepCells` cells away, each axis
 * moving independently — an 8-directional walk, matching Chebyshev
 * distance's own diagonal-is-free assumption. */
export const stepToward = (
  from: GridCell,
  target: GridCell,
  stepCells: number,
): GridCell => {
  const dx = Math.sign(target.x - from.x);
  const dy = Math.sign(target.y - from.y);

  return {
    x: from.x + dx * Math.min(stepCells, Math.abs(target.x - from.x)),
    y: from.y + dy * Math.min(stepCells, Math.abs(target.y - from.y)),
  };
};

/** The mirror of `stepToward` for retreat behaviour: one step directly away
 * from `threat`, at most `stepCells` cells, clamped to the grid extent so a
 * retreat can't walk a combatant off the board. When `from` and `threat`
 * share an axis exactly, that axis picks a positive direction arbitrarily —
 * any direction away from a threat at the same coordinate is equally valid,
 * and clamping keeps the result on the grid either way. */
export const stepAway = (
  from: GridCell,
  threat: GridCell,
  stepCells: number,
  cols: number = DEFAULT_GRID_COLS,
  rows: number = DEFAULT_GRID_ROWS,
): GridCell => {
  const dx = Math.sign(from.x - threat.x) || 1;
  const dy = Math.sign(from.y - threat.y) || 1;

  return {
    x: Math.max(0, Math.min(cols - 1, from.x + dx * stepCells)),
    y: Math.max(0, Math.min(rows - 1, from.y + dy * stepCells)),
  };
};
