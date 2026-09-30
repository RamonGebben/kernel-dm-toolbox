'use client';

import styled from 'styled-components';

export type FilterTagProps = {
  label: string;
  /** What the filter is set to; `null` while it is being set up for the first time. */
  summary: string | null;
  isEditing: boolean;
  disabled?: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

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
      <Label>{label}:</Label> {summary ?? '…'}
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

const Tag = styled.span<{ $isEditing: boolean; $isDisabled: boolean }>`
  display: inline-flex;
  align-items: stretch;
  max-width: 100%;
  background: ${props => props.theme.color.canvas};
  border: 1px solid
    ${props =>
      props.$isEditing ? props.theme.color.accent : props.theme.color.border};
  border-radius: ${props => props.theme.radius.pill};
  font-size: ${props => props.theme.fontSize.sm};
  opacity: ${props => (props.$isDisabled ? 0.5 : 1)};

  &:hover {
    border-color: ${props => props.theme.color.accent};
  }
`;

const Body = styled.button`
  overflow: hidden;
  padding: ${props => props.theme.space.xs} 0 ${props => props.theme.space.xs}
    ${props => props.theme.space.sm};
  background: transparent;
  border: none;
  border-radius: ${props => props.theme.radius.pill} 0 0
    ${props => props.theme.radius.pill};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: inherit;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${props => props.theme.shadow.focus};
  }
`;

const Label = styled.span`
  color: ${props => props.theme.color.textMuted};
`;

const Remove = styled.button`
  padding: 0 ${props => props.theme.space.sm};
  background: transparent;
  border: none;
  border-radius: 0 ${props => props.theme.radius.pill}
    ${props => props.theme.radius.pill} 0;
  color: ${props => props.theme.color.textMuted};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.color.accent};
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${props => props.theme.shadow.focus};
  }
`;
