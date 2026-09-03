'use client';

import styled from 'styled-components';

export type CreatureListItemProps = {
  name: string;
  challengeRatingLabel: string;
  isSelected: boolean;
  onSelect: () => void;
};

export const CreatureListItem = ({
  name,
  challengeRatingLabel,
  isSelected,
  onSelect,
}: CreatureListItemProps) => (
  <Row
    type="button"
    onClick={onSelect}
    $isSelected={isSelected}
    aria-pressed={isSelected}
  >
    <Name>{name}</Name>
    <ChallengeRating>CR {challengeRatingLabel}</ChallengeRating>
  </Row>
);

const Row = styled.button<{ $isSelected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: ${props => props.theme.color.accent};
  }
`;

const Name = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ChallengeRating = styled.span`
  flex-shrink: 0;
  font-family: ${props => props.theme.font.mono};
  font-size: ${props => props.theme.fontSize.sm};
  color: ${props => props.theme.color.textMuted};
`;
