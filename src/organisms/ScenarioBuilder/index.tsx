'use client';

import { ScenarioBuilderView } from '~/organisms/ScenarioBuilder/components/ScenarioBuilderView';
import { useScenarioBuilder } from '~/organisms/ScenarioBuilder/hooks/useScenarioBuilder';

/** Connected boundary: owns the queries and mutations, renders nothing itself. */
export const ScenarioBuilder = () => {
  const builder = useScenarioBuilder();

  return (
    <ScenarioBuilderView
      scenario={builder.scenario}
      isDetailPending={builder.isDetailPending}
      party={builder.party}
      monsters={builder.monsters}
      roster={builder.roster}
      creatureOptions={builder.creatureOptions}
      isCreatureOptionsPending={builder.isCreatureOptionsPending}
      monsterSearch={builder.monsterSearch}
      onMonsterSearchChange={builder.onMonsterSearchChange}
      armedTokenKey={builder.armedTokenKey}
      onArmToken={builder.onArmToken}
      onPlaceCell={builder.onPlaceCell}
      onClearPosition={builder.onClearPosition}
      onUpdateScenario={builder.onUpdateScenario}
      onAddPartyMember={builder.onAddPartyMember}
      onRemovePartyMember={builder.onRemovePartyMember}
      onAddMonsterEntry={builder.onAddMonsterEntry}
      onUpdateMonsterEntryCount={builder.onUpdateMonsterEntryCount}
      onRemoveMonsterEntry={builder.onRemoveMonsterEntry}
    />
  );
};
