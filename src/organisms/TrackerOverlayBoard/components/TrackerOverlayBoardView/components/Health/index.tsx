'use client';

import styled from 'styled-components';
import type { PlayerBoardCombatant } from '~/organisms/PlayerBoard/components/PlayerBoardView';
import { healthStatusColor } from '~/utils/healthStatusPresentation';

export const Health = styled.span<{
  $status: PlayerBoardCombatant['healthStatus'];
}>`
  flex-shrink: 0;
  color: ${props => props.theme.color(healthStatusColor[props.$status])};
`;
