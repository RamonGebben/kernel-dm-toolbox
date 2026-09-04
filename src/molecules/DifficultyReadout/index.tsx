'use client';

import styled from 'styled-components';
import {
  difficultyLabels,
  type EncounterDifficulty,
} from '~/content/encounterDifficulty';

export type DifficultyReadoutProps = {
  difficulty: EncounterDifficulty;
  totalExperience: number;
  /** False when nobody from the party is in the fight yet. */
  hasParty: boolean;
};

/**
 * "Moderate · 2,900 XP" — the encounter's weight at a glance.
 *
 * Without a party in the fight there is nothing to measure against, so it says
 * so rather than showing a rating computed from a party of zero.
 */
export const DifficultyReadout = ({
  difficulty,
  totalExperience,
  hasParty,
}: DifficultyReadoutProps) => {
  if (!hasParty) {
    return (
      <Wrapper>
        <Muted>Add the party to rate this fight</Muted>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Rating $difficulty={difficulty}>{difficultyLabels[difficulty]}</Rating>
      <Experience>{totalExperience.toLocaleString()} XP</Experience>
    </Wrapper>
  );
};

const difficultyColor = {
  trivial: (color: { textMuted: string }) => color.textMuted,
  low: (color: { success: string }) => color.success,
  moderate: (color: { accent: string }) => color.accent,
  high: (color: { warning: string }) => color.warning,
  deadly: (color: { danger: string }) => color.danger,
} as const;

const Wrapper = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${props => props.theme.space.sm};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Rating = styled.span<{ $difficulty: EncounterDifficulty }>`
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${props => difficultyColor[props.$difficulty](props.theme.color)};
`;

const Experience = styled.span`
  font-family: ${props => props.theme.font.mono};
  color: ${props => props.theme.color.textMuted};
`;

const Muted = styled.span`
  color: ${props => props.theme.color.textMuted};
`;
