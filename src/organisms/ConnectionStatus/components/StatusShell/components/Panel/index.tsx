'use client';

import styled, { type DefaultTheme } from 'styled-components';
import type { StatusTone } from '~/organisms/ConnectionStatus/components/StatusShell';

const toneColor = {
  neutral: (theme: DefaultTheme) => theme.color('formBackground', 'emphasis'),
  good: (theme: DefaultTheme) => theme.color('tertiary'),
  bad: (theme: DefaultTheme) => theme.color('error'),
} as const;

export const Panel = styled.section<{ $tone: StatusTone }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing('s')};
  padding: ${props => props.theme.spacing('m')};
  background: ${props => props.theme.color('background', 'emphasis')};
  border: ${props => props.theme.borderWidth('s')} solid
    ${props => props.theme.color('formBackground', 'emphasis')};
  border-left: 3px solid ${props => toneColor[props.$tone](props.theme)};
  border-radius: ${props => props.theme.borderRadius('base')};
  box-shadow: ${props => props.theme.boxShadow('card')};
`;
