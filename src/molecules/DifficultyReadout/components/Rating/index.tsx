'use client';

import styled, { type DefaultTheme } from 'styled-components';
import type { EncounterDifficulty } from '~/content/encounterDifficulty';

const difficultyColor = {
  trivial: (theme: DefaultTheme) => theme.color('formBackground', 'text'),
  low: (theme: DefaultTheme) => theme.color('tertiary'),
  moderate: (theme: DefaultTheme) => theme.color('primary'),
  high: (theme: DefaultTheme) => theme.color('quaternary'),
  deadly: (theme: DefaultTheme) => theme.color('error'),
} as const;

export const Rating = styled.span<{ $difficulty: EncounterDifficulty }>`
  font-weight: ${props => props.theme.fontWeight('bold')};
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${props => difficultyColor[props.$difficulty](props.theme)};
`;
