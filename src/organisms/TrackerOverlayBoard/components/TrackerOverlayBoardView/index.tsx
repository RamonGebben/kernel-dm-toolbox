'use client';

import { EmptyState } from '~/atoms/EmptyState';
import type { PlayerBoardCombatant } from '~/organisms/PlayerBoard/components/PlayerBoardView';
import { healthStatusLabels } from '~/utils/healthStatusPresentation';
import { Wrapper } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Wrapper';
import { Header } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Header';
import { Round } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Round';
import { MutedCaption } from '~/atoms/MutedCaption';
import { PlainList } from '~/atoms/PlainList';
import { Row } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Row';
import { Conditions } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Conditions';
import { ConditionBadge } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/ConditionBadge';
import { Initiative } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Initiative';
import { Name } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Name';
import { Health } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Health';

export interface TrackerOverlayCondition {
  conditionSlug: string;
  name: string;
}

/** `PlayerBoardCombatant` plus the one field standalone `PlayerBoardView`
 * doesn't render — defined here rather than added to `PlayerBoardCombatant`
 * itself, so that component stays untouched. */
export type TrackerOverlayCombatant = PlayerBoardCombatant & {
  conditions: ReadonlyArray<TrackerOverlayCondition>;
};

export interface TrackerOverlayBoardViewProps {
  isConnected: boolean;
  roundNumber: number;
  combatants: ReadonlyArray<TrackerOverlayCombatant>;
  showInitiative: boolean;
  showName: boolean;
  showHealth: boolean;
  showConditions: boolean;
}

/**
 * The tracker overlay's content — the compact twin of `PlayerBoardView`,
 * sized to live inside a small draggable box layered over the map rather
 * than fill a whole screen read from across the table. Each field is a
 * guard clause on its own `show*` flag, so the DM's overlay settings decide
 * what's drawn without touching what's fetched (`PlayerViewCombatant` is
 * already the full extent of what the player is allowed to know).
 */
export const TrackerOverlayBoardView = ({
  isConnected,
  roundNumber,
  combatants,
  showInitiative,
  showName,
  showHealth,
  showConditions,
}: TrackerOverlayBoardViewProps) => {
  if (!combatants.length) {
    return (
      <Wrapper>
        <EmptyState
          title="No fight in progress"
          description="The initiative order will appear here when the encounter begins."
        />
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Header>
        <Round>
          {roundNumber > 0 ? `Round ${roundNumber}` : 'Rolling for initiative'}
        </Round>
        {!isConnected && <MutedCaption>Reconnecting…</MutedCaption>}
      </Header>

      <PlainList as="ol">
        {combatants.map(combatant => (
          <Row key={combatant.id} $isActive={combatant.isActive}>
            {showInitiative && <Initiative>{combatant.initiative}</Initiative>}
            {showName && (
              <Name $isPlayerCharacter={combatant.isPlayerCharacter}>
                {combatant.displayName}
              </Name>
            )}
            {showConditions && combatant.conditions.length > 0 && (
              <Conditions>
                {combatant.conditions.map(condition => (
                  <ConditionBadge key={condition.conditionSlug}>
                    {condition.name}
                  </ConditionBadge>
                ))}
              </Conditions>
            )}
            {showHealth && (
              <Health $status={combatant.healthStatus}>
                {healthStatusLabels[combatant.healthStatus]}
              </Health>
            )}
          </Row>
        ))}
      </PlainList>
    </Wrapper>
  );
};
