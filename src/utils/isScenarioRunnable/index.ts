/**
 * A scenario needs at least one party member and one monster before
 * `runEncounter` has two opposing sides to resolve — the same gate the SSE
 * run route (`~/app/api/simulator/[scenarioId]/run`), `simulator.runBatch`,
 * and the Battle/Monte Carlo tabs' own "Run" controls all enforce, so the
 * rule lives in one place instead of four independent copies.
 */
export const isScenarioRunnable = (
  partyCount: number,
  monsterCount: number,
): boolean => partyCount > 0 && monsterCount > 0;
