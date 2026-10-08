'use client';

import { Button } from '~/atoms/Button';
import { describeCharacter } from '~/utils/describeCharacter';
import { formatModifier } from '~/utils/formatModifier';
import { Card } from '~/molecules/PartyMemberCard/components/Card';
import { SpreadRow } from '~/atoms/SpreadRow';
import { Shrink } from '~/atoms/Shrink';
import { Name } from '~/molecules/PartyMemberCard/components/Name';
import { Badge } from '~/molecules/PartyMemberCard/components/Badge';
import { MutedNote } from '~/atoms/MutedNote';
import { Actions } from '~/molecules/PartyMemberCard/components/Actions';
import { Stats } from '~/molecules/PartyMemberCard/components/Stats';
import { Stat } from '~/molecules/PartyMemberCard/components/Stat';
import { Notes } from '~/molecules/PartyMemberCard/components/Notes';

export interface PartyMemberCardProps {
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
  notes: string | null;
  isActive: boolean;
  /** True while this member's bench/recall is in flight. */
  isUpdating: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
}

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
  notes,
  isActive,
  isUpdating,
  onEdit,
  onToggleActive,
}: PartyMemberCardProps) => (
  <Card $isActive={isActive} aria-label={name}>
    <SpreadRow $align="flex-start">
      <Shrink>
        <Name>
          {name}
          {isActive ? null : <Badge>Benched</Badge>}
        </Name>
        <MutedNote>
          {describeCharacter({ level, className, subclass, species })}
          {playerName ? ` · played by ${playerName}` : ''}
        </MutedNote>
      </Shrink>
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
    </SpreadRow>

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
    </Stats>

    {notes ? <Notes>{notes}</Notes> : null}
  </Card>
);
