'use client';

import { Row } from '~/molecules/SpellListItem/components/Row';
import { Name } from '~/molecules/SpellListItem/components/Name';
import { MonoCaption } from '~/atoms/MonoCaption';

export interface SpellListItemProps {
  name: string;
  levelLabel: string;
  school: string;
  isSelected: boolean;
  onSelect: () => void;
}

export const SpellListItem = ({
  name,
  levelLabel,
  school,
  isSelected,
  onSelect,
}: SpellListItemProps) => (
  <Row
    type="button"
    onClick={onSelect}
    aria-pressed={isSelected}
    aria-label={`Show the ${name} description`}
    $isSelected={isSelected}
  >
    <Name>{name}</Name>
    <MonoCaption>
      {levelLabel} · {school}
    </MonoCaption>
  </Row>
);
