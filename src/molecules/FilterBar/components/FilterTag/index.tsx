'use client';

import { Tag } from '~/molecules/FilterBar/components/FilterTag/components/Tag';
import { Body } from '~/molecules/FilterBar/components/FilterTag/components/Body';
import { MutedInline } from '~/atoms/MutedInline';
import { Remove } from '~/molecules/FilterBar/components/FilterTag/components/Remove';

export interface FilterTagProps {
  label: string;
  /** What the filter is set to; `null` while it is being set up for the first time. */
  summary: string | null;
  isEditing: boolean;
  disabled?: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

/**
 * One applied filter, collapsed to a pill: "Type: Dragon, Undead ✕". The
 * body reopens the filter's editor; the ✕ clears it. The ✕ stays usable
 * when the filter is disabled, so a filter that stopped applying (Book,
 * once the source is narrowed to Custom) can still be tidied away.
 */
export const FilterTag = ({
  label,
  summary,
  isEditing,
  disabled = false,
  onEdit,
  onRemove,
}: FilterTagProps) => (
  <Tag $isEditing={isEditing} $isDisabled={disabled}>
    <Body
      type="button"
      aria-expanded={isEditing}
      disabled={disabled}
      onClick={onEdit}
    >
      <MutedInline>{label}:</MutedInline> {summary ?? '…'}
    </Body>
    <Remove
      type="button"
      aria-label={`Remove ${label} filter`}
      onClick={onRemove}
    >
      ×
    </Remove>
  </Tag>
);
