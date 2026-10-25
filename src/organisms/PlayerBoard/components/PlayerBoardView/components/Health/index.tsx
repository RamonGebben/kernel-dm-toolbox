'use client';

import styled from 'styled-components';
import type { HealthStatus } from '~/utils/applyDamage';
import { healthStatusColor } from '~/utils/healthStatusPresentation';

export const Health = styled.span<{ $status: HealthStatus }>`
  font-size: ${props => props.theme.fontSize('m')};
  color: ${props => props.theme.color(healthStatusColor[props.$status])};
`;
