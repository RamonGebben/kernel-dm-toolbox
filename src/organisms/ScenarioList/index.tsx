'use client';

import { ScenarioListView } from '~/organisms/ScenarioList/components/ScenarioListView';
import { useScenarioList } from '~/organisms/ScenarioList/hooks/useScenarioList';

/** Connected boundary: owns the queries and mutations, renders nothing itself. */
export const ScenarioList = () => {
  const scenarios = useScenarioList();

  return (
    <ScenarioListView
      isPending={scenarios.isPending}
      isCreating={scenarios.isCreating}
      scenarios={scenarios.scenarios}
      selectedScenarioId={scenarios.selectedScenarioId}
      onSelect={scenarios.onSelect}
      onCreate={scenarios.onCreate}
      onRemove={scenarios.onRemove}
    />
  );
};
