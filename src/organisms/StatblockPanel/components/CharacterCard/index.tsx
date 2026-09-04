'use client';

import styled from 'styled-components';

export type CharacterCardProps = {
  displayName: string;
  currentHitPoints: number;
  maxHitPoints: number;
  armorClass: number;
};

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
    <Rule />
    <Line>
      <Key>Armor Class</Key> {armorClass}
    </Line>
    <Line>
      <Key>Hit Points</Key> {currentHitPoints}/{maxHitPoints}
    </Line>
    <Note>The player has the character sheet.</Note>
  </article>
);

const Name = styled.h3`
  margin: 0;
  font-size: ${props => props.theme.fontSize.xl};
  color: ${props => props.theme.color.accent};
`;

const Kind = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 600;
  color: ${props => props.theme.color.textMuted};
`;

const Rule = styled.hr`
  margin: ${props => props.theme.space.sm} 0;
  border: none;
  border-top: 1px solid ${props => props.theme.color.accentMuted};
`;

const Line = styled.p`
  margin: 0 0 ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textPrimary};
`;

const Key = styled.strong`
  color: ${props => props.theme.color.accent};
`;

const Note = styled.p`
  margin-top: ${props => props.theme.space.lg};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
