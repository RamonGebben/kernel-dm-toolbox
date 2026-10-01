'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';
import { describeCharacter } from '~/utils/describeCharacter';
import { formatModifier } from '~/utils/formatModifier';
import { formatGold } from '~/utils/applyGoldChange';

export type PartyMemberCardProps = {
  name: string;
  playerName: string | null;
  level: number;
  className: string | null;
  subclass: string | null;
  species: string | null;
  armorClass: number;
  maxHitPoints: number;
  initiativeModifier: number;
  passivePerception: number | null;
  passiveInsight: number | null;
  passiveInvestigation: number | null;
  gold: number;
  notes: string | null;
  isActive: boolean;
  /** True while this member's bench/recall is in flight. */
  isUpdating: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
};

/** An unrecorded passive reads as a dash, never as a misleading 0. */
const passive = (score: number | null) => (score === null ? '—' : `${score}`);

/** One party member on the Party page: everything at a glance, edit in a modal. */
export const PartyMemberCard = ({
  name,
  playerName,
  level,
  className,
  subclass,
  species,
  armorClass,
  maxHitPoints,
  initiativeModifier,
  passivePerception,
  passiveInsight,
  passiveInvestigation,
  gold,
  notes,
  isActive,
  isUpdating,
  onEdit,
  onToggleActive,
}: PartyMemberCardProps) => (
  <Card $isActive={isActive} aria-label={name}>
    <Header>
      <Identity>
        <Name>
          {name}
          {isActive ? null : <Badge>Benched</Badge>}
        </Name>
        <Summary>
          {describeCharacter({ level, className, subclass, species })}
          {playerName ? ` · played by ${playerName}` : ''}
        </Summary>
      </Identity>
      <Actions>
        <Button
          variant="secondary"
          size="sm"
          onClick={onEdit}
          aria-label={`Edit ${name}`}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleActive}
          disabled={isUpdating}
          aria-label={isActive ? `Bench ${name}` : `Recall ${name}`}
        >
          {isActive ? 'Bench' : 'Recall'}
        </Button>
      </Actions>
    </Header>

    <Stats>
      <Stat>
        <dt>AC</dt>
        <dd>{armorClass}</dd>
      </Stat>
      <Stat>
        <dt>HP</dt>
        <dd>{maxHitPoints}</dd>
      </Stat>
      <Stat>
        <dt>Init</dt>
        <dd>{formatModifier(initiativeModifier)}</dd>
      </Stat>
      <Stat>
        <dt>Perception</dt>
        <dd>{passive(passivePerception)}</dd>
      </Stat>
      <Stat>
        <dt>Insight</dt>
        <dd>{passive(passiveInsight)}</dd>
      </Stat>
      <Stat>
        <dt>Investigation</dt>
        <dd>{passive(passiveInvestigation)}</dd>
      </Stat>
      <Stat>
        <dt>Purse</dt>
        <dd>{formatGold(gold)}</dd>
      </Stat>
    </Stats>

    {notes ? <Notes>{notes}</Notes> : null}
  </Card>
);

const Card = styled.article<{ $isActive: boolean }>`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.sm};
  padding: ${props => props.theme.space.md};
  background: ${props => props.theme.color.canvas};
  /* Benched reads as a dashed outline, not dimmed text — fading the text
   * would drop muted copy below AA contrast. */
  border: 1px ${props => (props.$isActive ? 'solid' : 'dashed')}
    ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
`;

const Identity = styled.div`
  min-width: 0;
`;

const Name = styled.h3`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  margin: 0;
  font-size: ${props => props.theme.fontSize.lg};
  color: ${props => props.theme.color.textPrimary};
`;

const Badge = styled.span`
  padding: 0 ${props => props.theme.space.xs};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: normal;
  color: ${props => props.theme.color.textMuted};
`;

const Summary = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;

const Actions = styled.div`
  display: flex;
  flex-shrink: 0;
  gap: ${props => props.theme.space.xs};
`;

const Stats = styled.dl`
  display: flex;
  flex-wrap: wrap;
  gap: ${props => props.theme.space.xs} ${props => props.theme.space.md};
  margin: 0;
`;

const Stat = styled.div`
  display: flex;
  gap: ${props => props.theme.space.xs};
  font-size: ${props => props.theme.fontSize.sm};

  dt {
    color: ${props => props.theme.color.textMuted};
  }

  dd {
    margin: 0;
    font-family: ${props => props.theme.font.mono};
    color: ${props => props.theme.color.textPrimary};
  }
`;

const Notes = styled.p`
  margin: 0;
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
  white-space: pre-line;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
