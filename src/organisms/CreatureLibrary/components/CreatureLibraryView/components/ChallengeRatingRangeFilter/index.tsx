'use client';

import { InlineRow } from '~/atoms/InlineRow';
import { MutedCaption } from '~/atoms/MutedCaption';
import { BoundSelect } from '~/organisms/CreatureLibrary/components/CreatureLibraryView/components/ChallengeRatingRangeFilter/components/BoundSelect';

export interface ChallengeRatingRange {
  min: number | null;
  max: number | null;
}

export interface ChallengeRatingRangeFilterProps {
  options: ReadonlyArray<{ value: number; label: string }>;
  range: ChallengeRatingRange;
  onMinChange: (min: number | null) => void;
  onMaxChange: (max: number | null) => void;
  disabled?: boolean;
}

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
  <InlineRow role="group" aria-label="Challenge rating">
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
    <MutedCaption aria-hidden="true">to</MutedCaption>
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
  </InlineRow>
);
