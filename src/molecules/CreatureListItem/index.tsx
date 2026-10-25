'use client';

import { Button } from '~/atoms/Button';
import { Row } from '~/molecules/CreatureListItem/components/Row';
import { SelectButton } from '~/molecules/CreatureListItem/components/SelectButton';
import { Name } from '~/molecules/CreatureListItem/components/Name';
import { AddSlot } from '~/molecules/CreatureListItem/components/AddSlot';
import { MonoCaption } from '~/atoms/MonoCaption';

export interface CreatureListItemProps {
  name: string;
  challengeRatingLabel: string;
  isSelected: boolean;
  onSelect: () => void;
  /** Adds this creature to the encounter without changing the selection. */
  onAdd: () => void;
}

export const CreatureListItem = ({
  name,
  challengeRatingLabel,
  isSelected,
  onSelect,
  onAdd,
}: CreatureListItemProps) => (
  <Row $isSelected={isSelected}>
    <SelectButton
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`Show the ${name} statblock`}
    >
      <Name>{name}</Name>
      <MonoCaption>CR {challengeRatingLabel}</MonoCaption>
    </SelectButton>
    <AddSlot>
      <Button
        variant="ghost"
        size="sm"
        onClick={onAdd}
        aria-label={`Add ${name} to the encounter`}
      >
        +
      </Button>
    </AddSlot>
  </Row>
);
