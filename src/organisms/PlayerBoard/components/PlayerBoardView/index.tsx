'use client';

import styled from 'styled-components';
import { EmptyState } from '~/atoms/EmptyState';
import type { HealthStatus } from '~/utils/applyDamage';
import {
  healthStatusColor,
  healthStatusLabels,
} from '~/utils/healthStatusPresentation';

export type PlayerBoardCombatant = {
  id: string;
  displayName: string;
  initiative: number;
  isActive: boolean;
  isPlayerCharacter: boolean;
  healthStatus: HealthStatus;
};

export type PlayerBoardViewProps = {
  isConnected: boolean;
  roundNumber: number;
  combatants: readonly PlayerBoardCombatant[];
};

/**
 * The second screen, read from across a table.
 *
 * Everything here is deliberately large and low-density: the reader is several
 * feet away and glancing, not scanning. No exact hit points appear because the
 * server never sends them — this component could not leak them if it tried.
 */
export const PlayerBoardView = ({
  isConnected,
  roundNumber,
  combatants,
}: PlayerBoardViewProps) => {
  if (!combatants.length) {
    return (
      <Centered>
        <EmptyState
          title="No fight in progress"
          description="The initiative order will appear here when the encounter begins."
        />
      </Centered>
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
            <Initiative>{combatant.initiative}</Initiative>
            <Name $isPlayerCharacter={combatant.isPlayerCharacter}>
              {combatant.displayName}
            </Name>
            <Health $status={combatant.healthStatus}>
              {healthStatusLabels[combatant.healthStatus]}
            </Health>
          </Row>
        ))}
      </List>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.lg};
  max-width: 60rem;
  margin: 0 auto;
  padding: ${props => props.theme.space.xl} ${props => props.theme.space.md};
`;

const Centered = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60dvh;
`;

const Header = styled.header`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${props => props.theme.space.md};
`;

const Round = styled.h1`
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0.04em;
  color: ${props => props.theme.color.accent};
`;

const Reconnecting = styled.span`
  font-size: ${props => props.theme.fontSize.md};
  color: ${props => props.theme.color.textMuted};
`;

const List = styled.ol`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  margin: 0;
  padding: 0;
  list-style: none;
`;

const Row = styled.li<{ $isActive: boolean }>`
  display: grid;
  grid-template-columns: 4rem minmax(0, 1fr) auto;
  align-items: center;
  gap: ${props => props.theme.space.md};
  padding: ${props => props.theme.space.md};
  background: ${props =>
    props.$isActive
      ? props.theme.color.surfaceRaised
      : props.theme.color.surface};
  border: 1px solid
    ${props =>
      props.$isActive ? props.theme.color.accent : props.theme.color.border};
  border-left-width: ${props => (props.$isActive ? '6px' : '1px')};
  border-radius: ${props => props.theme.radius.md};
  font-size: 1.5rem;
`;

const Initiative = styled.span`
  font-family: ${props => props.theme.font.mono};
  font-weight: 700;
  color: ${props => props.theme.color.textMuted};
`;

const Name = styled.span<{ $isPlayerCharacter: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: ${props => (props.$isPlayerCharacter ? 700 : 400)};
  color: ${props => props.theme.color.textPrimary};
`;

const Health = styled.span<{ $status: HealthStatus }>`
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => healthStatusColor[props.$status](props.theme.color)};
`;
