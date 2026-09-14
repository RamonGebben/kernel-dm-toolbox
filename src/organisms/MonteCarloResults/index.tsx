'use client';

import { MonteCarloResultsView } from '~/organisms/MonteCarloResults/components/MonteCarloResultsView';
import { useMonteCarloResults } from '~/organisms/MonteCarloResults/hooks/useMonteCarloResults';

/** Connected boundary: owns the scenario-detail query (for its cached
 * `lastRunSummary`) and the `runBatch` mutation, renders nothing itself
 * (issue #5, milestone 6). */
export const MonteCarloResults = () => {
  const results = useMonteCarloResults();

  return (
    <MonteCarloResultsView
      hasScenario={results.hasScenario}
      isDetailPending={results.isDetailPending}
      scenario={results.scenario}
      canRun={results.canRun}
      isRunning={results.isRunning}
      runErrorMessage={results.runErrorMessage}
      onRunBatch={results.onRunBatch}
    />
  );
};
