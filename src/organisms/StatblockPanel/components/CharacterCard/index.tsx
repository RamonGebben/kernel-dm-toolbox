'use client';

import { Name } from '~/organisms/StatblockPanel/components/CharacterCard/components/Name';
import { Kind } from '~/organisms/StatblockPanel/components/CharacterCard/components/Kind';
import { StatblockRule } from '~/atoms/StatblockRule';
import { StatblockLine } from '~/atoms/StatblockLine';
import { StatblockKey } from '~/atoms/StatblockKey';
import { Note } from '~/organisms/StatblockPanel/components/CharacterCard/components/Note';

export interface CharacterCardProps {
  displayName: string;
  currentHitPoints: number;
  maxHitPoints: number;
  armorClass: number;
}

/**
 * What the panel shows for a party member.
 *
 * A player character has no statblock in the library — the player has the
 * sheet. All this needs to answer is the question the DM asks mid-fight: how
 * hurt are they, and what do I need to beat?
 */
export const CharacterCard = ({
  displayName,
  currentHitPoints,
  maxHitPoints,
  armorClass,
}: CharacterCardProps) => (
  <article>
    <Name>{displayName}</Name>
    <Kind>Player Character</Kind>
    <StatblockRule />
    <StatblockLine>
      <StatblockKey>Armor Class</StatblockKey> {armorClass}
    </StatblockLine>
    <StatblockLine>
      <StatblockKey>Hit Points</StatblockKey> {currentHitPoints}/{maxHitPoints}
    </StatblockLine>
    <Note>The player has the character sheet.</Note>
  </article>
);
