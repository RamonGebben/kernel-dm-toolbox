'use client';

import styled from 'styled-components';
import type { HitPointTone } from '~/utils/applyDamage';

const toneColor = {
  full: 'tertiary',
  damaged: 'quaternary',
  down: 'error',
} as const;

export const HitPointsButton = styled.button<{ $tone: HitPointTone }>`
  padding: 0;
  background: none;
  border: none;
  font: inherit;
  font-family: ${props => props.theme.fontFamily('mono')};
  color: ${props => props.theme.color(toneColor[props.$tone])};
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;
