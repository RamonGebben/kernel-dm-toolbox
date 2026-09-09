'use client';

import styled from 'styled-components';
import { EmptyState } from '~/atoms/EmptyState';
import type { PlayerBoardCombatant } from '~/organisms/PlayerBoard/components/PlayerBoardView';
import {
  healthStatusColor,
  healthStatusLabels,
} from '~/utils/healthStatusPresentation';

export type TrackerOverlayCondition = {
  conditionSlug: string;
  name: string;
};

/** `PlayerBoardCombatant` plus the one field standalone `PlayerBoardView`
 * doesn't render — defined here rather than added to `PlayerBoardCombatant`
 * itself, so that component stays untouched. */
export type TrackerOverlayCombatant = PlayerBoardCombatant & {
  conditions: readonly TrackerOverlayCondition[];
};

export type TrackerOverlayBoardViewProps = {
  isConnected: boolean;
  roundNumber: number;
  combatants: readonly TrackerOverlayCombatant[];
  showInitiative: boolean;
  showName: boolean;
  showHealth: boolean;
  showConditions: boolean;
};

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
        {!isConnected && <Reconnecting>Reconnecting…</Reconnecting>}
      </Header>

      <List>
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
      </List>
    </Wrapper>
  );
};

/**
 * No fixed/percentage height and no scrolling anywhere in this component —
 * this is projected onto a TV with no controls, so every combatant must
 * stay visible without anyone touching it. The overlay box that wraps this
 * (\`PlayerScreenView\`) sizes itself to this content instead of the other
 * way around.
 */
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  width: 100%;
  padding: ${props => props.theme.space.sm};
`;

const Header = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  flex-shrink: 0;
`;

const Round = styled.h2`
  margin: 0;
  font-size: ${props => props.theme.fontSize.md};
  letter-spacing: 0.04em;
  color: ${props => props.theme.color.accent};
`;

const Reconnecting = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const List = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: ${props =>
    props.$isActive
      ? props.theme.color.surfaceRaised
      : props.theme.color.surface};
  border: 1px solid
    ${props =>
      props.$isActive ? props.theme.color.accent : props.theme.color.border};
  border-left-width: ${props => (props.$isActive ? '4px' : '1px')};
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.fontSize.sm};
`;

/** Never wraps to a second line and never grows past its share of the row —
 * `ConditionBadge` truncates instead, so an active combatant with several
 * conditions can't push the row's height around. */
const Conditions = styled.div`
  display: flex;
  flex-wrap: nowrap;
  gap: ${props => props.theme.space.xs};
  min-width: 0;
  max-width: 45%;
  overflow: hidden;
`;

const ConditionBadge = styled.span`
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 ${props => props.theme.space.xs};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Initiative = styled.span`
  flex-shrink: 0;
  font-family: ${props => props.theme.font.mono};
  font-weight: 700;
  color: ${props => props.theme.color.textMuted};
`;

const Name = styled.span<{ $isPlayerCharacter: boolean }>`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${props => (props.$isPlayerCharacter ? 700 : 400)};
  color: ${props => props.theme.color.textPrimary};
`;

const Health = styled.span<{ $status: PlayerBoardCombatant['healthStatus'] }>`
  flex-shrink: 0;
  color: ${props => healthStatusColor[props.$status](props.theme.color)};
`;
