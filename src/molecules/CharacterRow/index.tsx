'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { formatModifier } from '~/utils/formatModifier';

export type CharacterRowProps = {
  name: string;
  playerName: string | null;
  level: number;
  armorClass: number;
  maxHitPoints: number;
  initiativeModifier: number;
  onEdit: () => void;
  onRemove: () => void;
};

export const CharacterRow = ({
  name,
  playerName,
  level,
  armorClass,
  maxHitPoints,
  initiativeModifier,
  onEdit,
  onRemove,
}: CharacterRowProps) => (
  <Row>
    <Details>
      <Name>{name}</Name>
      <Meta>
        {playerName ? `${playerName} · ` : ''}Level {level} · AC {armorClass} ·{' '}
        {maxHitPoints} HP · init {formatModifier(initiativeModifier)}
      </Meta>
    </Details>
    <Actions>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        Edit
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
      >
        Remove
      </Button>
    </Actions>
  </Row>
);

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Details = styled.div`
  min-width: 0;
`;

const Name = styled.p`
  margin: 0;
  color: ${props => props.theme.color.textPrimary};
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
`;
