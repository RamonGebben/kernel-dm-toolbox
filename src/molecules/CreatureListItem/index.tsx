'use client';

import styled from 'styled-components';
import { Button } from '~/atoms/Button';

export type CreatureListItemProps = {
  name: string;
  challengeRatingLabel: string;
  isSelected: boolean;
  onSelect: () => void;
  /** Adds this creature to the encounter without changing the selection. */
  onAdd: () => void;
};

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
      <ChallengeRating>CR {challengeRatingLabel}</ChallengeRating>
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

const Row = styled.div<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  width: 100%;
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.md};
  background: ${props =>
    props.$isSelected
      ? props.theme.color.surfaceRaised
      : props.theme.color.canvas};
  border: 1px solid
    ${props =>
      props.$isSelected ? props.theme.color.accent : props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-size: ${props => props.theme.fontSize.md};

  &:hover {
    border-color: ${props => props.theme.color.accent};
  }
`;

/**
 * Selecting is its own control rather than the row itself: a button wrapping
 * the whole row would nest the add button inside it, which is invalid and
 * unreachable by keyboard.
 */
const SelectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  flex: 1;
  min-width: 0;
  padding: 0;
  background: none;
  border: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
`;

const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const AddSlot = styled.span`
  display: flex;
  flex-shrink: 0;
`;

const ChallengeRating = styled.span`
  flex-shrink: 0;
  font-family: ${props => props.theme.font.mono};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
