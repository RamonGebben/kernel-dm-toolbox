'use client';

import { EmptyState } from '~/atoms/EmptyState';
import type { HealthStatus } from '~/utils/applyDamage';
import { healthStatusLabels } from '~/utils/healthStatusPresentation';
import { Wrapper } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Wrapper';
import { Centered } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Centered';
import { Header } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Header';
import { Round } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Round';
import { Reconnecting } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Reconnecting';
import { List } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/List';
import { Row } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Row';
import { Initiative } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Initiative';
import { Name } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Name';
import { Health } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Health';

export interface PlayerBoardCombatant {
  id: string;
  displayName: string;
  initiative: number;
  isActive: boolean;
  isPlayerCharacter: boolean;
  healthStatus: HealthStatus;
}

export interface PlayerBoardViewProps {
  isConnected: boolean;
  roundNumber: number;
  combatants: ReadonlyArray<PlayerBoardCombatant>;
}

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
