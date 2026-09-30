'use client';

import styled from 'styled-components';

export type ChallengeRatingRange = { min: number | null; max: number | null };

export type ChallengeRatingRangeFilterProps = {
  options: readonly { value: number; label: string }[];
  range: ChallengeRatingRange;
  onMinChange: (min: number | null) => void;
  onMaxChange: (max: number | null) => void;
  disabled?: boolean;
};

/** A `<select>` value is always a string; `''` is the "Any" option. */
const toBound = (value: string): number | null =>
  value === '' ? null : Number(value);

/**
 * A from–to pair of selects rather than a checkbox list: a DM building an
 * encounter asks for "CR 2 to 5", and ticking four boxes to say that is
 * busywork. Rendered as the CR filter's editor inside `FilterBar`'s popover,
 * so it carries no trigger chrome of its own.
 */
export const ChallengeRatingRangeFilter = ({
  options,
  range,
  onMinChange,
  onMaxChange,
  disabled = false,
}: ChallengeRatingRangeFilterProps) => (
  <Group role="group" aria-label="Challenge rating">
    <BoundSelect
      aria-label="Minimum challenge rating"
      value={range.min ?? ''}
      onChange={event => onMinChange(toBound(event.target.value))}
      disabled={disabled}
    >
      <option value="">Any</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </BoundSelect>
    <Separator aria-hidden="true">to</Separator>
    <BoundSelect
      aria-label="Maximum challenge rating"
      value={range.max ?? ''}
      onChange={event => onMaxChange(toBound(event.target.value))}
      disabled={disabled}
    >
      <option value="">Any</option>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </BoundSelect>
  </Group>
);

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
`;

const Separator = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const BoundSelect = styled.select`
  flex: 1;
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.sm};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.color.accent};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  option {
    background: ${props => props.theme.color.canvas};
  }
`;
