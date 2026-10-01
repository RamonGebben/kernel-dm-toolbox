'use client';

import Link from 'next/link';
import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { formatModifier } from '~/utils/formatModifier';
import { describeCharacter } from '~/utils/describeCharacter';
import { buildPartyEditorHref } from '~/utils/partyEditorHref';

export type CharacterRowProps = {
  id: string;
  name: string;
  playerName: string | null;
  level: number;
  className: string | null;
  subclass: string | null;
  species: string | null;
  armorClass: number;
  maxHitPoints: number;
  initiativeModifier: number;
  /** True once they are already in the encounter — they cannot be added twice. */
  isInEncounter: boolean;
  onAddToEncounter: () => void;
};

/**
 * A party member in the tracker's pick list. Picking only: editing is a link
 * into the Party page's editor (DECISIONS #32), never a form in here.
 */
export const CharacterRow = ({
  id,
  name,
  playerName,
  level,
  className,
  subclass,
  species,
  armorClass,
  maxHitPoints,
  initiativeModifier,
  isInEncounter,
  onAddToEncounter,
}: CharacterRowProps) => (
  <Row>
    <Details>
      <Name>{name}</Name>
      <Identity>
        {describeCharacter({ level, className, subclass, species })}
        {playerName ? ` · ${playerName}` : ''}
      </Identity>
      <Meta>
        AC {armorClass} · {maxHitPoints} HP · init{' '}
        {formatModifier(initiativeModifier)}
      </Meta>
    </Details>
    <Actions>
      <Button
        variant="secondary"
        size="sm"
        onClick={onAddToEncounter}
        disabled={isInEncounter}
        aria-label={`Add ${name} to the encounter`}
      >
        {isInEncounter ? 'In fight' : 'Add'}
      </Button>
      <EditLink href={buildPartyEditorHref(id)} aria-label={`Edit ${name}`}>
        Edit
      </EditLink>
    </Actions>
  </Row>
);

const Row = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};

  ${props => props.theme.media.md} {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Details = styled.div`
  min-width: 0;
`;

const Name = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textPrimary};
`;

const Identity = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Meta = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  font-family: ${props => props.theme.font.mono};
  color: ${props => props.theme.color.textMuted};
`;

const Actions = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
`;

/** Styled like a ghost `Button`, but a real link: it navigates to /party. */
const EditLink = styled(Link)`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
  text-decoration: none;

  &:hover {
    color: ${props => props.theme.color.textPrimary};
    background: ${props => props.theme.color.surface};
  }
`;
