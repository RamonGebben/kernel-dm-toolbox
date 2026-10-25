'use client';

import { Button } from '~/atoms/Button';
import { formatModifier } from '~/utils/formatModifier';
import { describeCharacter } from '~/utils/describeCharacter';
import { buildPartyEditorHref } from '~/utils/partyEditorHref';
import { Row } from '~/molecules/CharacterRow/components/Row';
import { Shrink } from '~/atoms/Shrink';
import { Paragraph } from '~/atoms/Paragraph';
import { MutedNote } from '~/atoms/MutedNote';
import { Meta } from '~/molecules/CharacterRow/components/Meta';
import { Actions } from '~/molecules/CharacterRow/components/Actions';
import { EditLink } from '~/molecules/CharacterRow/components/EditLink';

export interface CharacterRowProps {
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
}

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
    <Shrink>
      <Paragraph>{name}</Paragraph>
      <MutedNote>
        {describeCharacter({ level, className, subclass, species })}
        {playerName ? ` · ${playerName}` : ''}
      </MutedNote>
      <Meta>
        AC {armorClass} · {maxHitPoints} HP · init{' '}
        {formatModifier(initiativeModifier)}
      </Meta>
    </Shrink>
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
