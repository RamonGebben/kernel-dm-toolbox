'use client';

import {
  difficultyLabels,
  type EncounterDifficulty,
} from '~/content/encounterDifficulty';
import { Wrapper } from '~/molecules/DifficultyReadout/components/Wrapper';
import { Rating } from '~/molecules/DifficultyReadout/components/Rating';
import { MonoMuted } from '~/atoms/MonoMuted';
import { MutedInline } from '~/atoms/MutedInline';

export interface DifficultyReadoutProps {
  difficulty: EncounterDifficulty;
  totalExperience: number;
  /** False when nobody from the party is in the fight yet. */
  hasParty: boolean;
}

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
        <MutedInline>Add the party to rate this fight</MutedInline>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Rating $difficulty={difficulty}>{difficultyLabels[difficulty]}</Rating>
      <MonoMuted>{totalExperience.toLocaleString()} XP</MonoMuted>
    </Wrapper>
  );
};
